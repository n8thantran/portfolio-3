import Link from "next/link";
import type { Metadata } from "next";
import { Backdrop } from "../backdrop";
import { ThemeToggle } from "../theme";
import { ResumeViewer } from "./viewer";

export const metadata: Metadata = {
  title: "Resume · Nathan Tran",
  description: "Nathan Tran's resume.",
};

const link =
  "underline decoration-muted/40 underline-offset-[5px] transition-[color,text-decoration-color] duration-200 hover:text-foreground hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current";

export default function Resume() {
  return (
    <>
      <Backdrop />
      <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-[38rem] flex-col px-6 py-8 sm:px-8 sm:py-10">
        <header className="flex flex-nowrap items-baseline justify-between gap-6">
          <h1 className="text-[17px] font-medium tracking-[-0.015em]">Resume</h1>
          <ThemeToggle />
        </header>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
          <a
            href="/api/resume"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            open full size
          </a>
          <a href="/api/resume" download className={link}>
            download
          </a>
        </p>

        <div className="mt-8 flex-1">
          <ResumeViewer />
        </div>

        <footer className="relative mt-12 flex flex-nowrap items-baseline justify-between gap-6 pt-12 font-mono text-[10.5px] whitespace-nowrap text-muted">
          <Link
            href="/"
            className="shrink-0 underline decoration-muted/45 underline-offset-4 transition-colors duration-200 hover:text-foreground hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            back
          </Link>
        </footer>
      </main>
    </>
  );
}
