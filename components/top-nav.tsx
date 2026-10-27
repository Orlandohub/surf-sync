"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { LogoLockup } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/**
 * Top navigation — glass bar (content scrolls under it), mark + wordmark
 * lockup, per-type links. Links stay quiet: muted until hovered.
 */
export function TopNav() {
  const [session, setSession] = useState<
    { type: string } | null | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await authClient.getSession();
      if (cancelled) return;
      setSession(data?.session ? { type: (data.user?.type as string) ?? "" } : null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await authClient.signOut();
    setSession(null);
    window.location.href = "/";
  }

  const link =
    "text-meta text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 glass">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-5 px-gutter py-3">
        <Link href="/" aria-label="surfsync — início">
          <LogoLockup height={26} className="text-foreground" />
        </Link>
        <div className="flex-1" />
        {session?.type === "instructor" && (
          <>
            <Link href="/instructor" className={link}>Painel</Link>
            <Link href="/instructor/bookings" className={link}>Aulas</Link>
          </>
        )}
        {session?.type === "school_staff" && (
          <>
            <Link href="/school" className={link}>Escola</Link>
            <Link href="/school/discovery" className={link}>Instrutores</Link>
            <Link href="/school/bookings" className={link}>Reservas</Link>
          </>
        )}
        {session ? (
          <>
            <Link href="/account" className={link}>Conta</Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sair
            </Button>
          </>
        ) : (
          session === null && (
            <>
              <Link href="/sign-in" className={link}>Entrar</Link>
              <Button size="sm" onClick={() => { window.location.href = "/sign-up"; }}>
                Criar conta
              </Button>
            </>
          )
        )}
      </nav>
    </header>
  );
}
