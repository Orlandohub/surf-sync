import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BookmarkToggle } from "@/components/school/bookmark-toggle";
import { LevelBadge, VerifiedMark, WeekStrip } from "@/components/school/instructor-bits";
import type { InstructorCard } from "@/lib/services/discovery";

/**
 * One instructor in the Instrutores list (deck 08 "Escolas" rows): avatar,
 * name + verified mark, zones, level, the week at a glance, and a
 * bookmark toggle.
 *
 * The whole card opens the profile through a stretched link on the name
 * (its ::after covers the card); the bookmark button sits above it
 * (z-10), so no control is nested inside the link.
 *
 * Phones: avatar · text · bookmark, the week strip on its own line.
 * From md: avatar · text · week strip · bookmark · chevron, one line.
 */
export function InstructorRow({
  instructor,
  verified,
  focusAfterUnsave,
}: {
  instructor: InstructorCard;
  verified: boolean;
  /** Guardados: unsaving drops the row, so focus goes to this id. */
  focusAfterUnsave?: string;
}) {
  const href = `/school/discovery/${instructor.userId}`;
  return (
    <li
      data-slot="instructor-row"
      className="relative flex flex-wrap items-center gap-x-3 gap-y-4 rounded-card border bg-card p-card text-card-foreground shadow-card transition-colors duration-(--duration-fast) ease-move hover:bg-accent/50 md:flex-nowrap md:gap-x-4"
    >
      <Avatar name={instructor.displayName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <Link
            href={href}
            className="truncate text-label text-foreground outline-none after:absolute after:inset-0 after:rounded-card after:transition-shadow focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
          >
            {instructor.displayName}
          </Link>
          {verified && <VerifiedMark />}
        </span>
        {instructor.locations.length > 0 && (
          <span className="mt-0.5 line-clamp-2 text-meta text-muted-foreground">
            {instructor.locations.join(", ")}
          </span>
        )}
        <span className="mt-1.5 flex">
          <LevelBadge level={instructor.experienceLevel} />
        </span>
      </div>
      <WeekStrip
        days={instructor.availableDays}
        className="max-md:order-last max-md:basis-full md:w-64 md:shrink-0"
      />
      <BookmarkToggle
        instructorId={instructor.userId}
        name={instructor.displayName}
        bookmarked={instructor.bookmarked}
        focusAfterUnsave={focusAfterUnsave}
      />
      <ChevronRight
        aria-hidden
        strokeWidth={1.75}
        className="size-5 shrink-0 text-muted-foreground max-md:hidden"
      />
    </li>
  );
}
