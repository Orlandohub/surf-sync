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
 * The row is a size container and lays itself out by its own width (in
 * rem, so larger text counts), never by the viewport's:
 * - 42rem and up (desktop): avatar · text · week strip · bookmark ·
 *   chevron, one line.
 * - Below (phones, tablets, large text): avatar · text · bookmark, the
 *   week strip on its own line.
 * - Below 16rem (a phone at 125% text and more): avatar and bookmark on
 *   the first line and the text under them at full width, so the name
 *   always has room. Names wrap; they are never cut.
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
      className="@container relative rounded-card border bg-card p-card text-card-foreground shadow-card transition-colors duration-(--duration-fast) ease-move hover:bg-accent/50"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-4 @2xl:flex-nowrap @2xl:gap-x-4">
        <Avatar name={instructor.displayName} />
        <div className="flex min-w-0 flex-1 flex-col @max-3xs:order-2 @max-3xs:basis-full">
          <span className="flex flex-wrap items-center gap-x-1.5">
            <Link
              href={href}
              className="min-w-0 text-label break-words text-foreground outline-none after:absolute after:inset-0 after:rounded-card after:transition-shadow focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
            >
              {instructor.displayName}
            </Link>
            {verified && <VerifiedMark />}
          </span>
          {instructor.locations.length > 0 && (
            <span className="mt-0.5 line-clamp-2 text-meta break-words text-muted-foreground">
              {instructor.locations.join(", ")}
            </span>
          )}
          <span className="mt-1.5 flex">
            <LevelBadge level={instructor.experienceLevel} />
          </span>
        </div>
        <WeekStrip
          days={instructor.availableDays}
          className="order-last basis-full @2xl:order-none @2xl:w-64 @2xl:shrink-0 @2xl:basis-auto"
        />
        <BookmarkToggle
          instructorId={instructor.userId}
          name={instructor.displayName}
          bookmarked={instructor.bookmarked}
          focusAfterUnsave={focusAfterUnsave}
          className="@max-3xs:order-1 @max-3xs:ml-auto"
        />
        <ChevronRight
          aria-hidden
          strokeWidth={1.75}
          className="size-5 shrink-0 text-muted-foreground @max-2xl:hidden"
        />
      </div>
    </li>
  );
}
