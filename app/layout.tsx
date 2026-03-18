import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";

const fontVariables = {
  "--font-geist-sans":
    '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  "--font-geist-mono":
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
} as CSSProperties;

export const metadata: Metadata = {
  title: "Nathan Tran",
  description: "CS @ SJSU — personal landing page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
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
      <body className="antialiased" style={fontVariables}>
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
