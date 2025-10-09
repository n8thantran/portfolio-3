import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nathan Tran",
  description: "CS @ SJSU — personal landing page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (function () {
      const storageKey = "theme";
      const stored = window.localStorage.getItem(storageKey);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = stored || (prefersDark ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
        {children}
      </body>
    </html>
  );
}
