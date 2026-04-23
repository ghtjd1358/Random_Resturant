# 랜덤한끼 (Random-Hankki)

> 일본 여행 중 "오늘 뭐 먹지…" 가 애매할 때, **현재 위치에서 한 집**을 대신 뽑아주는 PWA.

주사위를 굴리듯 흔들면, 근처 식당 · 카페 후보 중 한 곳이 결정됩니다. 좋아요/싫어요 피드백이 쌓일수록 취향을 학습해서 다음 픽에 반영합니다.

---

## 주요 기능

- **원-탭 랜덤 픽** — 위치 기반으로 식당/카페 한 집을 즉시 추천
- **세분화 필터** — 카테고리(식사/카페) · 서브카테고리(라멘 · 스시 · 커피 · 베이커리 등) · 반경 · 영업 중 · 가격대
- **모드 선택** — `popular` (평점/리뷰 가중) vs `discovery` (숨은 맛집 가중)
- **취향 학습** — 좋아요/싫어요 피드백이 `typeBias` · `priceBias` 에 누적되어 점수에 반영
- **AI 한줄평** — Vercel AI Gateway 를 통해 "왜 이 집인가" 를 한 문장으로 설명
- **방문/스킵 기록** — IndexedDB(`idb`) 로 로컬 저장, 최근 스킵/방문은 다음 픽에서 회피
- **PWA** — Serwist 기반 서비스 워커, 홈 화면 설치, 오프라인 페이지 지원
- **일본풍 UI** — 와시(和紙) 텍스처, 한코(判子) 도장, 마스코트 기린, 손글씨 폰트

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js **16.2** (App Router) · React **19** |
| 번들러 | Turbopack (dev) · Webpack (build) |
| 스타일 | Tailwind CSS **v4** · `tw-animate-css` · shadcn/ui · Base UI · Vaul |
| 모션 | `motion` (Framer Motion v12) |
| 상태 | Zustand (filters / location / session) |
| 로컬 DB | IndexedDB via `idb` |
| 외부 API | Google Places API (New) |
| AI | Vercel AI Gateway (`ai` SDK v6) |
| PWA | `@serwist/next` |
| 배포 | Vercel (`vercel.ts` 기반 설정) |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local.example` 을 `.env.local` 로 복사한 뒤 값을 채워주세요.

```bash
cp .env.local.example .env.local
```

| 변수 | 설명 |
|---|---|
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console → Places API (New) 활성화 후 발급. 서버 전용. |
| `AI_GATEWAY_API_KEY` | [Vercel AI Gateway](https://vercel.com/dashboard/ai-gateway) 에서 발급. 서버 전용. |
| `NEXT_PUBLIC_APP_URL` | manifest `start_url` · canonical 용. 개발 시 `http://localhost:3000`. |

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인. 개발 환경에서는 서비스 워커가 비활성화됩니다 (HMR 충돌 방지).

### 4. 기타 스크립트

```bash
npm run build      # 프로덕션 빌드 (Webpack)
npm run start      # 프로덕션 서버
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── ai/reason/        # AI 한줄평 엔드포인트
│   │   └── places/
│   │       ├── nearby/       # 주변 장소 검색
│   │       └── [id]/         # 장소 상세
│   ├── history/              # 방문/스킵 기록 페이지
│   ├── settings/             # 설정 · 학습된 취향 관리
│   ├── privacy/              # 개인정보 처리방침
│   ├── offline/              # 오프라인 폴백
│   ├── sw.ts                 # Serwist 서비스 워커
│   ├── icon.tsx              # 동적 파비콘
│   └── layout.tsx
├── components/
│   ├── home/                 # HomeShell · DiceButton · PickCard · FiltersPanel ...
│   ├── history/              # 기록 UI
│   ├── skipped/              # 스킵 리스트
│   ├── nav/                  # BottomTabBar
│   ├── pwa/                  # 설치 프롬프트
│   ├── common/               # 공용 (NoirenDivider 등)
│   └── ui/                   # shadcn/ui primitives
├── hooks/
│   ├── useGeolocation.ts     # 위치 권한/좌표
│   ├── useRoll.ts            # 주사위 로직
│   ├── useDiceSpin.ts        # 주사위 애니메이션
│   ├── useAIReason.ts        # AI 한줄평 스트리밍
│   ├── useVisitActions.ts    # 좋아요/싫어요 기록
│   ├── useVisitedRecords.ts
│   ├── useSkippedRecords.ts
│   ├── useInstallPrompt.ts   # PWA 설치
│   └── useTicker.ts
├── lib/
│   ├── ai/reason.ts          # AI 프롬프트 구성
│   ├── places/
│   │   ├── client.ts         # Places API 클라이언트
│   │   ├── pick.ts           # 픽 오케스트레이션
│   │   ├── score.ts          # 점수 / 랭킹 / weightedPick
│   │   ├── mapUrl.ts         # Google Maps 딥링크
│   │   └── types.ts          # Category · Subcategory · PriceLevel
│   ├── db/
│   │   ├── client.ts         # IndexedDB 초기화
│   │   ├── schema.ts         # visited · skipped · sessions · profile
│   │   ├── repo.ts           # CRUD
│   │   └── profile.ts        # 취향 학습 업데이트
│   ├── cache/                # 런타임 캐시 헬퍼
│   ├── geo/                  # 지역 추정 (guessRegion)
│   ├── format/               # 거리/가격 포맷터
│   ├── rate-limit.ts         # API 레이트리밋
│   ├── haptic.ts             # 햅틱 피드백
│   └── utils.ts              # cn (class merge)
├── stores/
│   ├── useFiltersStore.ts    # 카테고리 · 반경 · 가격 · 모드
│   ├── useLocationStore.ts   # 좌표 · 권한 상태
│   └── useSessionStore.ts    # 현재 세션 픽 히스토리
vercel.ts                     # Vercel 프로젝트 설정 (TS)
next.config.ts                # Next + Serwist 통합
```

---

## 픽 알고리즘 개요

1. **후보 수집** — `/api/places/nearby` 가 Google Places API (New) 로 반경 내 장소 조회
2. **주석 + 랭킹** (`annotateAndRank`) — 거리 · 평점 · 리뷰 수 · 취향 편향(`typeBias`/`priceBias`) · 모드(popular/discovery) 로 가중 점수 계산
3. **필터링** — 가격대, 영업 중, 품질 임계치(`isCandidateQualityOk`) 적용
4. **스킵/최근 제외** — `skippedIds` 는 완전 제외, `recentIds` 는 회피 대상
5. **가중 샘플링** (`weightedPick`) — 상위 N개(`popular: 8`, `discovery: 15`) 에서 점수 비례 확률로 한 집 선택
6. **AI 한줄평** — 선택된 장소 정보를 Vercel AI Gateway 로 전달해 스트리밍으로 설명 생성

---

## 취향 학습

`src/lib/db/schema.ts::ProfileRecord` 에 사용자별로 누적:

- `typeBias` — Google Places `primaryType` 별 (+/-) 가중치 (예: `ramen_restaurant`, `coffee_shop`)
- `priceBias` — `PRICE_LEVEL_*` 버킷별 가중치

좋아요 피드백은 해당 타입/가격의 bias 를 증가, 싫어요 는 감소시키고 `annotateAndRank` 가 점수에 반영합니다. 설정 페이지에서 초기화 가능합니다.

---

## PWA

- 매니페스트: `public/manifest.webmanifest`
- 서비스 워커: `src/app/sw.ts` → 빌드 시 `public/sw.js` 로 생성
- 오프라인 폴백: `/offline`
- 숏컷: 매니페스트의 `?c=food` / `?c=cafe` URL 이 홈에서 카테고리를 미리 선택
- 설치 프롬프트: `useInstallPrompt` + `components/pwa/`

---

## 배포 (Vercel)

`vercel.ts` 에 빌드 명령 · 캐시 헤더가 선언되어 있습니다.

```bash
npx vercel        # preview
npx vercel --prod # production
```

> Vercel CLI 가 없다면 `npm i -g vercel` 로 전역 설치.

환경 변수는 Vercel 대시보드 또는 `vercel env` 로 관리하세요.

---

## 라이선스

개인 포트폴리오 프로젝트.
