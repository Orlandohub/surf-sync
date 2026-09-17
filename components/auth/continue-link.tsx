import Link from "next/link";

/** Primary continuation link (DS pill button) for auth landing states. */
export function ContinueLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-[140ms] hover:bg-teal-400 hover:shadow-[var(--ss-shadow-glow)] active:translate-y-px"
    >
      {label}
    </Link>
  );
}
