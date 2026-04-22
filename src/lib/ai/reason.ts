import "server-only";
import { generateText } from "ai";

export interface ReasonInput {
  name: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  reviewTexts: string[];
}

const MODEL = "anthropic/claude-haiku-4-5";

export async function generateReason(input: ReasonInput): Promise<string> {
  const reviewBlock = input.reviewTexts
    .slice(0, 5)
    .map((r) => `- ${truncate(r, 300)}`)
    .join("\n");

  const prompt = [
    "너는 일본 여행 가이드다. 아래 가게의 리뷰를 바탕으로 '왜 이 집을 가봐야 하는지' 한 줄(40자 이내, 한국어)로 써라.",
    "과장 금지, 구체적 디테일 1개 포함. 리뷰에 없는 사실을 지어내지 말 것. 이모지 금지.",
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
