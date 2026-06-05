import { cn } from "@/lib/utils";

/**
 * RukhsTy brand mark: a navy ring enclosing an "R" whose body shares the ring
 * color and whose leg is a single emerald stroke. Geometry is fixed; only the
 * tone (color treatment) changes between contexts.
 */
export type LogoTone = "brand" | "onDark" | "mono";

const TONES: Record<LogoTone, { ring: string; leg: string; text: string }> = {
  brand: { ring: "#0A2540", leg: "#00C389", text: "text-[#0A2540]" },
  onDark: { ring: "#F4F7F9", leg: "#00C389", text: "text-white" },
  mono: { ring: "currentColor", leg: "currentColor", text: "" },
};

export function LogoMark({ tone = "brand", className }: { tone?: LogoTone; className?: string }) {
  const { ring, leg } = TONES[tone];
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="RukhsTy"
    >
      <circle cx="32" cy="32" r="28" stroke={ring} strokeWidth="4" />
      <path
        d="M26 47 V17 H35 a8.5 8.5 0 0 1 0 17 H26"
        stroke={ring}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 34 L41 47" stroke={leg} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Full lockup: brand mark + wordmark. For the Latin wordmark ("Rukhsty") the
 * trailing "ty" is rendered in emerald to match the official "RukhsTy" identity;
 * non-Latin labels (e.g. "رخصتي") render in a single tone color.
 */
export function Logo({
  label,
  tone = "brand",
  className,
  markClassName,
  textClassName,
}: {
  label: string;
  tone?: LogoTone;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  const { text } = TONES[tone];
  const isLatin = /[a-z]/i.test(label);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark tone={tone} className={cn("h-7 w-7 shrink-0", markClassName)} />
      <span className={cn("font-bold tracking-tight", text, textClassName)}>
        {isLatin && /ty$/i.test(label) ? (
          <>
            {label.slice(0, -2)}
            <span className="text-[#00C389]">{label.slice(-2)}</span>
          </>
        ) : (
          label
        )}
      </span>
    </span>
  );
}
