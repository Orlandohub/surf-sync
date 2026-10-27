import Link from "next/link";

/** Primary continuation link (DS button recipe) for auth landing states. */
export function ContinueLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-6 text-label text-primary-foreground transition-[background-color,transform] duration-(--duration-fast) ease-move hover:bg-primary-hover active:scale-98"
    >
      {label}
    </Link>
  );
}
