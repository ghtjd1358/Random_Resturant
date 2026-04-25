import "server-only";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export interface ReasonInput {
  name: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  reviewTexts: string[];
}

// Groq free tier. Tried Kimi K2 first (better Korean) but the Groq plan
// returns 404 "does not exist or you do not have access" for that model —
// it's gated behind paid tiers despite appearing in the free model list.
// Falling back to Llama 3.3 70B which is universally available + free.
// We compensate for Llama's literal Korean tendency with the few-shot
// prompt below (5 example outputs in the desired punchy tone).
const MODEL = groq("llama-3.3-70b-versatile");

export async function generateReason(input: ReasonInput): Promise<string> {
  const reviewBlock = input.reviewTexts
    .slice(0, 5)
    .map((r) => `- ${truncate(r, 300)}`)
    .join("\n");

  // Few-shot examples replace generic instructions — the model imitates
  // the cadence of the examples (punchy carnival-barker tone with one
  // concrete detail) instead of regurgitating a review fragment.
  const prompt = [
    "너는 일본 여행 가게를 한 줄로 추천하는 카피라이터다.",
    "리뷰를 보고 \"왜 가야 하는지\" 한 줄로만 답해라.",
    "",
    "규칙:",
    "- 한국어, 30자 안팎",
    "- 매력 포인트 + 구체 디테일 (메뉴/분위기/특징) 하나",
    "- 카피 톤. 리뷰 인용·설명조 X",
    "- 리뷰에 없는 사실 지어내지 말 것",
    "- 이모지·따옴표·하이픈 시작 금지",
    "",
    "예시:",
    "- 30년 장인이 끓이는 진한 돈코츠 한 그릇",
    "- 카운터 8석, 셰프 혼자 잡는 작은 스시야",
    "- 주말 줄 서는 두꺼운 가츠동 한 접시",
    "- 새벽 5시까지 여는 골목 라멘집",
    "- 토종 흑돼지로 만든 두툼한 카츠",
    "",
    `가게: ${input.name}${input.primaryType ? ` (${input.primaryType})` : ""}`,
    input.rating != null
      ? `평점: ${input.rating}${input.userRatingCount ? ` (${input.userRatingCount}개 리뷰)` : ""}`
      : "",
    "",
    reviewBlock.length > 0 ? `리뷰:\n${reviewBlock}` : "리뷰: (없음)",
    "",
    "한 줄:",
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await generateText({
    model: MODEL,
    prompt,
    temperature: 0.6,
    maxOutputTokens: 80,
  });

  return cleanReasonOutput(text);
}

/** Strip leading quotes, hyphens, and trim to enforce tight one-liner look. */
function cleanReasonOutput(text: string): string {
  let out = text.trim();
  // Strip Markdown formatting artifacts
  out = out.replace(/^["'「『]+|["'」』]+$/g, "");
  out = out.replace(/^[-—·•]\s*/, "");
  // First non-empty line only
  out = out.split(/\n+/)[0].trim();
  // Enforce a reasonable length ceiling as a safety net
  if (out.length > 60) out = out.slice(0, 58).trimEnd() + "…";
  return out;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
