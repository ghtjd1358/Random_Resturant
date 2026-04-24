import Image from "next/image";
import { cn } from "@/lib/utils";

export type MascotVariant =
  | "brush-stand"
  | "brush-desk"
  | "book-read"
  | "brush-wink"
  | "meditate"
  | "lantern"
  | "scroll-fortune"
  | "butterfly";

const FILE_MAP: Record<MascotVariant, string> = {
  "brush-stand": "/mascots/01-brush-stand.png",
  "brush-desk": "/mascots/02-brush-desk.png",
  "book-read": "/mascots/03-book-read.png",
  "brush-wink": "/mascots/04-brush-wink.png",
  meditate: "/mascots/05-meditate.png",
  lantern: "/mascots/06-lantern.png",
  "scroll-fortune": "/mascots/07-scroll-fortune.png",
  butterfly: "/mascots/08-butterfly.png",
};

const ALT_MAP: Record<MascotVariant, string> = {
  "brush-stand": "붓 든 기린",
  "brush-desk": "글 쓰는 기린",
  "book-read": "책 읽는 기린",
  "brush-wink": "윙크하는 기린",
  meditate: "좌선하는 기린",
  lantern: "등불 든 기린",
  "scroll-fortune": "두루마리 든 기린",
  butterfly: "나비와 함께 있는 기린",
};

const SIZE_PX: Record<NonNullable<MascotProps["size"]>, number> = {
  xs: 40,
  sm: 64,
  md: 96,
  lg: 128,
  xl: 192,
};

interface MascotProps {
  variant: MascotVariant;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Override the box size in pixels — for custom-sized watermarks. */
  px?: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}

/**
 * The 8 hanbok-giraffe oracle mascots. Renders a single PNG variant at one
 * of the preset sizes. Decorative by default — pass `decorative={false}`
 * when the mascot conveys actual meaning (e.g. an empty-state hero) so
 * screen readers announce it.
 */
export function Mascot({
  variant,
  size = "md",
  px: customPx,
  className,
  priority = false,
  decorative = true,
}: MascotProps) {
  const px = customPx ?? SIZE_PX[size];
  return (
    <Image
      src={FILE_MAP[variant]}
      alt={decorative ? "" : ALT_MAP[variant]}
      aria-hidden={decorative}
      width={px}
      height={px}
      priority={priority}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}
