"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

/**
 * Minimal top-nav with per-type links. Session state fetched once on
 * mount; sign-out clears to the public state.
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
    <nav className="flex items-center gap-4 px-6 py-3 text-sm">
      <Link href="/" className="font-semibold">SurfSync</Link>
      <div className="flex-1" />
      {session?.type === "instructor" && (
        <>
          <Link href="/instructor" className="text-muted-foreground hover:text-foreground">Painel</Link>
          <Link href="/instructor/bookings" className="text-muted-foreground hover:text-foreground">Aulas</Link>
        </>
      )}
      {session?.type === "school_staff" && (
        <>
          <Link href="/school" className="text-muted-foreground hover:text-foreground">Escola</Link>
          <Link href="/school/discovery" className="text-muted-foreground hover:text-foreground">Instrutores</Link>
          <Link href="/school/bookings" className="text-muted-foreground hover:text-foreground">Reservas</Link>
        </>
      )}
      {session ? (
        <>
          <Link href="/account" className="text-muted-foreground hover:text-foreground">Conta</Link>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground">Sair</button>
        </>
      ) : (
        session === null && (
          <>
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">Entrar</Link>
            <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">Criar conta</Link>
          </>
        )
      )}
    </nav>
  );
}
