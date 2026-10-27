import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { getSession, toShellUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/shell/site-header";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
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

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${bdSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-(--bottom-chrome)">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#conteudo"
            className="sr-only z-50 rounded-control bg-card px-4 py-3 text-label text-foreground shadow-float focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader user={user} />
          <div id="conteudo" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </div>
          {user && <BottomTabBar type={user.type} />}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
