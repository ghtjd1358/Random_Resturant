/** "방금" / "N분 전" / "N시간 전" */
export function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return "방금";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

/** "3월 15일 · 14:02" */
export function formatVisitDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3월 15일" */
export function formatShortDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}
