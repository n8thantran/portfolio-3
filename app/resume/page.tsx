import Link from "next/link";
import type { Metadata } from "next";
import { Backdrop } from "../backdrop";
import { ThemeToggle } from "../theme";

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

        {/* An <object> rather than an <iframe> so there is somewhere to put a
            fallback: a phone that refuses to embed a pdf shows the link
            instead of an empty grey box. The hash hides the viewer's own
            toolbar and thumbnail rail, which are chrome from a different
            design, leaving just the document. */}
        <div className="mt-8 flex-1">
          <object
            data="/api/resume#toolbar=0&navpanes=0&view=FitH"
            type="application/pdf"
            aria-label="Nathan Tran's resume"
            className="aspect-[8.5/11] w-full rounded-md border border-muted/25 bg-foreground/[0.03]"
          >
            <p className="p-6 text-[14px] leading-relaxed text-muted">
              This browser will not show the pdf inline.{" "}
              <a
                href="/api/resume"
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                Open it in a new tab
              </a>
              .
            </p>
          </object>
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
