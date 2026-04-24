# 랜덤한끼 (Random-Hankki)

일본 여행 중 "오늘 뭐 먹지" 가 애매할 때, 지금 내 위치에서 한 집을 대신 뽑아주는 PWA.

데모: https://random-restaurant-orcin.vercel.app

---

## 만든 이유

여행지에서 식당 고르는 데 30분씩 쓰는 게 싫었다. 후보 4-5개 비교하다 결국 평점 높은 데 가는 일이 반복되니까, 차라리 한 집을 **뽑아주는** 쪽이 나았다. 평점·거리·내 취향을 적당히 섞어서 한 집만 내놓는 앱.

---

## 어떻게 동작하나

내부 흐름은 이렇다.

```
좌표 ─▶ Google Places API (반경 R, 카테고리)
        ▼
  annotateAndRank()        — 거리·평점·리뷰수·취향 가중 점수
        ▼
  isCandidateQualityOk()   — 모드별 품질 게이트
        ▼
  skipped 제거 + recent 회피
        ▼
  weightedPick(top N)      — 점수² 비례 확률 샘플링
        ▼
  PlaceLite 한 집 + AI 한줄평 (스트리밍)
```

### 스코어링

`src/lib/places/score.ts::scorePlace()` 가 두 가지 모드를 갖는다.

**popular 모드** — 검증된 인기집 위주.

```
popularBase  = rating × log10(count + 1)
distBonus    = max(0, (radius − distance) / radius)
fewPenalty   = 1.0 if count < 20 else 0
score        = popularBase + distBonus × 1.5 − fewPenalty
```

리뷰 많은 4.5점이 리뷰 5개짜리 5.0점보다 위로 간다 (베이지안 가중). 거리가 가까울수록 보너스. 리뷰 20개 미만은 페널티.

**discovery 모드** — 숨은 맛집 발견 위주.

```
sweetBonus   = 2.2  if 20 ≤ count ≤ 80     ("발견하기 좋은 단계")
             = 1.0  if 80 < count ≤ 200
             = 1.5  if 3 ≤ count < 20      ("이제 막 알려진")
             = 0.8  if count == 0          ("순수 모험")

mainstreamPenalty = log10(count / 200) × 1.8   if count > 200 else 0
ratingFactor      = rating × 0.5
score             = ratingFactor + sweetBonus − mainstreamPenalty + distBonus × 2.0
```

리뷰 200개 넘는 유명집은 점수가 깎인다. 리뷰 20-80개 구간이 가장 가중치를 받음 (이미 검증됐지만 인스타엔 안 도배된 영역). 거리는 popular 모드보다 더 강하게 반영 — "발견" 모드에선 코앞이 중요.

### 품질 게이트

`isCandidateQualityOk()` 가 모드별로 통계적 더드(dud) 를 걸러낸다.

- popular: `count ≥ 5 && rating ≥ 3.5`
- discovery: `count == 0` 무조건 통과 (모험), 그 외엔 `count < 3 && rating < 3.0` 만 차단

### 가중 샘플링

`weightedPick()` 은 상위 N개 (popular 8 / discovery 15) 만 후보로 두고, **점수² 비례 확률** 로 한 집을 뽑는다.

```ts
const weights = top.map((c) => Math.max(0.01, c.score ** 2));
// 누적합 r 에서 random() × sum 위치를 찾음
```

지수 2 를 쓰는 건 1위가 2위보다 너무 자주 나오지 않게 하면서도, 하위권이 깜짝 등장할 확률을 낮추는 절충점. 매번 같은 집이 나오는 걸 방지하면서 "그래도 추천할 만한" 곳에서만 뽑는다.

### 최근 회피

`recentIds` (최근 픽 3집) 는 1차 시도에서 제외 → 후보가 비면 2차 시도에서 다시 포함. 즉 후보가 충분하면 같은 집이 연속으로 안 나오고, 후보가 적으면 어쩔 수 없이 다시 나올 수 있다.

---

## 취향 학습

`src/lib/db/profile.ts` 에서 좋아요/싫어요가 누적되어 다음 픽에 반영된다.

```
typeBias[primaryType]  ← clamp( prev + delta × 0.35,        −2.5 … +2.5 )
priceBias[priceLevel]  ← clamp( prev + delta × 0.35 × 0.6,  −2.5 … +2.5 )
delta = +1 (좋아요), −1 (싫어요)
```

EMA 스타일 누적이라 한 번의 싫어요로 카테고리가 영영 차단되진 않는다. confidence 는 `log10(N+1) / log10(21)` 로 계산 — 피드백 20개쯤 쌓이면 약 0.9 (사실상 100% 신뢰). 새 사용자가 한두 번 클릭으로 모델이 굳어버리는 걸 방지.

스코어에 적용될 땐 `score = base + (typeBias + priceBias) × confidence` 라서, 학습 초기엔 거의 영향 없다가 점차 강해진다.

---

## 기술 스택

Next.js 16.2 (App Router) · React 19 · TypeScript 5
Tailwind CSS v4 · shadcn/ui · Base UI · `motion`
Zustand (상태) · IndexedDB (`idb`) (로컬 DB)
Google Places API (New) · Vercel AI Gateway (`ai` SDK v6, Claude Haiku 4.5)
`@serwist/next` (PWA) · Vercel (배포, `vercel.ts` 설정)

---

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # 키 채우기
npm run dev                         # http://localhost:3000
```

필요한 환경변수:

- `GOOGLE_PLACES_API_KEY` — Google Cloud Console 에서 Places API (New) 활성화 후 발급. 서버 전용.
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway 대시보드에서 발급. 서버 전용.
- `NEXT_PUBLIC_APP_URL` — manifest `start_url` · canonical 용. 개발 시 `http://localhost:3000`.

빌드/배포 명령:

```bash
npm run build      # 프로덕션 빌드 (Webpack)
npm run typecheck  # tsc --noEmit
npx vercel --prod  # Vercel 배포
```

개발 환경에서는 서비스 워커가 비활성화된다 (HMR 충돌 방지).

---

## 디렉토리

```
src/
  app/
    api/ai/reason/             AI 한줄평 스트리밍 엔드포인트
    api/places/nearby/         Google Places nearbySearch 프록시
    api/places/[id]/           상세 (필요 시)
    history/                   방문 기록 페이지
    settings/                  설정 + 차단목록 + 가격 가이드 + 이용허락
    privacy/                   개인정보
    offline/                   오프라인 폴백
    sw.ts                      Serwist 서비스 워커
    layout.tsx                 폰트 / 메타 / 셸
  components/
    home/                      HomeShell · DiceButton · PickCard · FiltersPanel · …
    history/                   VisitedList · VisitedItem
    skipped/                   SkippedList · SkippedItem
    nav/                       BottomTabBar (選 / 録 / 設)
    pwa/                       InstallBanner · InstallPrompt · InstallGuide
    common/                    PageHeader · KanjiWatermark · …
    ui/                        shadcn primitives
  hooks/
    useGeolocation.ts          위치 권한 / 좌표
    useRoll.ts                 픽 오케스트레이션 (fetch → annotateAndRank → 저장)
    useDiceSpin.ts             주사위 애니메이션 (글리프 cycling)
    useAIReason.ts             AI 한줄평 스트리밍
    useVisitActions.ts         좋아요/싫어요/스킵/공유
    useVisitedRecords.ts       기록 hook (전체 fetch + 클라이언트 필터 + 카운트)
    useSkippedRecords.ts
    useInstallPrompt.ts        beforeinstallprompt 캐치
  lib/
    places/
      client.ts                Places API 호출
      pick.ts                  rollFromCandidates() 오케스트레이션
      score.ts                 scorePlace · annotateAndRank · weightedPick
      types.ts                 Category · Subcategory · PriceLevel
    db/
      schema.ts                visited · skipped · sessions · profile
      repo.ts                  CRUD
      profile.ts               EMA 취향 업데이트
    geo/                       guessRegion · isInTokyo · haversine
    format/                    거리 / 가격 / 시간 포맷터
    audio/                     도쿄 도착 chime (Web Audio synth)
  stores/
    useFiltersStore.ts         카테고리 · 반경 · 가격 · 모드
    useLocationStore.ts        좌표 · 권한 상태 · 프리셋
    useSessionStore.ts         현재 세션 픽 히스토리
    useDiceStyleStore.ts       주사위 표시 스타일 (classic / rotating)
    useTokyoArrivalStore.ts    도쿄 도착 인트로 sealed 상태
vercel.ts                       프로젝트 설정 (TS)
next.config.ts                  Next + Serwist 통합
```

---

## PWA

- 매니페스트: `public/manifest.webmanifest`
- 서비스 워커: `src/app/sw.ts` → 빌드 시 `public/sw.js` 생성
- 오프라인 폴백: `/offline`
- 매니페스트 숏컷: `?c=food` / `?c=cafe` 로 카테고리 미리 선택
- 설치 banner: `src/components/pwa/InstallBanner.tsx` — 첫 진입 1.5초 후 슬라이드업, 7일 dismiss 기억, in-app browser 에선 비표시
- iOS Safari: `beforeinstallprompt` 가 없어서 InstallGuide 모달로 단계 안내

---

## 알아두면 좋은 것

- **가격 정보가 없는 집**은 가격 필터가 켜져 있어도 후보에 포함된다. Google Places 가 가격 정보를 누락하는 비율이 높아서, 빼면 후보가 너무 줄어듦.
- **AI 한줄평**은 가게 이름 + 리뷰 텍스트만 Vercel AI Gateway 로 보낸다. 사용자 식별 정보는 포함되지 않고, Zero Data Retention 정책이 적용된다.
- **방문/스킵/취향**은 전부 IndexedDB 로 기기에만 저장된다. 서버에 사용자 데이터를 보내지 않는다.
- **도쿄 좌표**가 잡히면 한 번만 인트로 애니메이션이 재생된다 (`useTokyoArrivalStore` 가 `localStorage` 에 sealed 기록). 설정에서 다시 켤 수 있다.

---

## 라이선스

개인 포트폴리오 프로젝트.
