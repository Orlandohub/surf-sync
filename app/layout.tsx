import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { TopNav } from "@/components/top-nav";
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

export const metadata: Metadata = {
  title: {
    default: "surfsync",
    template: "%s · surfsync",
  },
  description:
    "A staffing marketplace for surf schools and verified instructors.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="pt"
      className={`${inter.variable} ${bdSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <TopNav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
