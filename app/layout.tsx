import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { getSession, toShellUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/services/notifications";
import { SiteHeader } from "@/components/shell/site-header";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { FocusReveal } from "@/components/shell/focus-reveal";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bdSans = localFont({
  src: [{ path: "./fonts/BDSans-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-bd-sans",
  display: "block",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: {
      default: "surfsync",
      template: "%s · surfsync",
    },
    description: t("description"),
  };
}

// viewport-fit=cover so the tab bar can sit on the home-indicator inset
// (env(safe-area-inset-bottom) is 0 without it).
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Session is read on the server so the nav is right on first paint.
  const [locale, messages, session, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getSession(),
    getTranslations("Nav"),
  ]);
  const user = toShellUser(session);
  // One cheap count for the nav badge. Pages that mark notifications read
  // call router.refresh(), which re-renders this layout too.
  const unread = session ? await unreadCount(session.user.id) : 0;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${bdSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-(--bottom-clearance)">
        <NextIntlClientProvider messages={messages}>
          {/* Off-screen until focused (not sr-only: its focus:not-sr-only
              resets the padding to 0). */}
          <a
            href="#conteudo"
            className="fixed top-3 left-3 z-50 -translate-y-24 rounded-control bg-card px-4 py-3 text-label text-foreground shadow-float focus:translate-y-0"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader user={user} unread={unread} />
          <div id="conteudo" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </div>
          {user && <BottomTabBar type={user.type} unread={unread} />}
          <Toaster />
          <FocusReveal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
