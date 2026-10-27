import type { LucideIcon } from "lucide-react";
import { CalendarCheck, House, UserRound, UsersRound } from "lucide-react";
import type { ComponentType } from "react";
import { CalendarWave } from "@/components/brand/icons";
import type { UserType } from "@/lib/auth/session";

/**
 * The signed-in information architecture (BRIEF "Information
 * architecture"): the same items, same order, on the mobile tab bar and
 * the desktop top bar. Labels are keys in the "Nav" namespace.
 */
export type NavItem = {
  key: string;
  href: string;
  /** Message key in the "Nav" namespace. */
  label: string;
  icon: LucideIcon | ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Active for this pathname? */
  match: (pathname: string) => boolean;
  /** Shown as a desktop top-bar link (false: reached via the account menu). */
  desktop: boolean;
};

const exact = (path: string) => (pathname: string) => pathname === path;
const under =
  (...paths: string[]) =>
  (pathname: string) =>
    paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const INSTRUCTOR: NavItem[] = [
  { key: "home", href: "/instructor", label: "instructor.home", icon: House, match: exact("/instructor"), desktop: true },
  { key: "bookings", href: "/instructor/bookings", label: "instructor.bookings", icon: CalendarCheck, match: under("/instructor/bookings"), desktop: true },
  { key: "availability", href: "/instructor/availability", label: "instructor.availability", icon: CalendarWave, match: under("/instructor/availability"), desktop: true },
  // Conta (/account) lives under Perfil in this IA.
  { key: "profile", href: "/instructor/profile", label: "instructor.profile", icon: UserRound, match: under("/instructor/profile", "/account"), desktop: true },
];

const SCHOOL: NavItem[] = [
  { key: "home", href: "/school", label: "school.home", icon: House, match: exact("/school"), desktop: true },
  { key: "discovery", href: "/school/discovery", label: "school.discovery", icon: UsersRound, match: under("/school/discovery"), desktop: true },
  { key: "bookings", href: "/school/bookings", label: "school.bookings", icon: CalendarCheck, match: under("/school/bookings"), desktop: true },
  // On desktop, Conta is in the account menu.
  { key: "account", href: "/account", label: "school.account", icon: UserRound, match: under("/account"), desktop: false },
];

export function navItemsFor(type: UserType): NavItem[] {
  return type === "instructor" ? INSTRUCTOR : SCHOOL;
}

export function homeHrefFor(type: UserType): string {
  return type === "instructor" ? "/instructor" : "/school";
}
