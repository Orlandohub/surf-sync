"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu } from "@base-ui/react/menu";
import { LogOut, UserRoundCog } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ShellUser } from "@/lib/auth/session";

const itemClass =
  "flex h-11 cursor-pointer items-center gap-3 rounded-control px-2.5 text-body text-foreground outline-none select-none " +
  "transition-colors duration-(--duration-fast) data-highlighted:bg-accent " +
  "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/**
 * Avatar button → menu with who is signed in, Conta and Terminar sessão
 * (destructive, last, in its own group). Used on desktop and mobile.
 */
export function AccountMenu({ user }: { user: ShellUser }) {
  const t = useTranslations("Nav");

  async function signOut() {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(t("signOutError"));
      return;
    }
    // Full navigation so the server-rendered shell drops the session.
    window.location.assign("/");
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t("accountMenu", { name: user.name || user.email })}
        className="tap flex size-9 cursor-pointer items-center justify-center rounded-full outline-none transition-[box-shadow] duration-(--duration-fast) hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-popup-open:ring-2 data-popup-open:ring-border"
      >
        <Avatar name={user.name || user.email} size={32} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="z-50 outline-none">
          <Menu.Popup className="w-72 max-w-(--available-width) origin-(--transform-origin) rounded-card border bg-popover p-1.5 text-popover-foreground shadow-float outline-none transition-[opacity,scale] duration-(--duration-base) ease-enter data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-(--duration-fast) data-ending-style:ease-exit data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-center gap-3 px-2.5 pt-2 pb-2.5">
              <Avatar name={user.name || user.email} size={44} />
              <div className="flex min-w-0 flex-col">
                {user.name && <span className="truncate text-label">{user.name}</span>}
                <span className="truncate text-meta text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />
            <Menu.LinkItem closeOnClick render={<Link href="/account" />} className={itemClass}>
              <UserRoundCog aria-hidden strokeWidth={1.75} />
              {t("account")}
            </Menu.LinkItem>
            <Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />
            <Menu.Item onClick={signOut} className={cn(itemClass, "text-destructive [&_svg]:text-destructive")}>
              <LogOut aria-hidden strokeWidth={1.75} />
              {t("signOut")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
