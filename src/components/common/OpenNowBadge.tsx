"use client";

interface Props {
  open?: boolean;
}

export function OpenNowBadge({ open }: Props) {
  if (open === undefined) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        open ? "text-matcha" : "text-torii"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          open ? "bg-matcha animate-pulse" : "bg-torii"
        }`}
      />
      {open ? "영업 중" : "영업 종료"}
    </span>
  );
}
