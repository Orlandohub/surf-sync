"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Minimal top-nav with per-type links (DS: connect quietly — the rope,
 * not the show).
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

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-5 px-6 py-4 text-sm">
        <Link href="/" aria-label="SurfSync — início">
          <Wordmark height={22} />
        </Link>
        <div className="flex-1" />
        {session?.type === "instructor" && (
          <>
            <Link href="/instructor" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Painel</Link>
            <Link href="/instructor/bookings" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Aulas</Link>
          </>
        )}
        {session?.type === "school_staff" && (
          <>
            <Link href="/school" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Escola</Link>
            <Link href="/school/discovery" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Instrutores</Link>
            <Link href="/school/bookings" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Reservas</Link>
          </>
        )}
        {session ? (
          <>
            <Link href="/account" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Conta</Link>
            <button onClick={signOut} className="text-muted-foreground transition-colors duration-[220ms] hover:text-[var(--ss-danger)]">Sair</button>
          </>
        ) : (
          session === null && (
            <>
              <Link href="/sign-in" className="text-muted-foreground transition-colors duration-[220ms] hover:text-teal-400">Entrar</Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition-all duration-[140ms] hover:bg-teal-400 hover:shadow-[var(--ss-shadow-glow)] active:translate-y-px"
              >
                Criar conta
              </Link>
            </>
          )
        )}
      </nav>
    </header>
  );
}
