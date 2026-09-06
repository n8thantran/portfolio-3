import Link from "next/link";
import type { Metadata } from "next";
import { Backdrop } from "../backdrop";
import { ThemeToggle } from "../theme";
import { awardCount, wins } from "./hackathons";

export const metadata: Metadata = {
  title: "Trophies · Nathan Tran",
  description: "Hackathon wins.",
};

const link =
  "underline decoration-muted/40 underline-offset-[5px] transition-[color,text-decoration-color] duration-200 hover:text-foreground hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current";

// Same shape the home page uses: content flush left, meta flush right.
const row = "flex flex-nowrap items-baseline justify-between gap-6";

export default function Trophies() {
  return (
    <>
      <Backdrop />
      <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-[38rem] flex-col px-6 py-8 sm:px-8 sm:py-10">
        <header className={row}>
          <h1 className="text-[17px] font-medium tracking-[-0.015em]">Trophies</h1>
          <ThemeToggle />
        </header>

        <p className="mt-2 font-mono text-[11px] text-muted">
          {wins.length} hackathons · {awardCount} awards
        </p>

        <section className="mt-12 flex flex-1 flex-col gap-8">
          {wins.map((win) => (
            <article key={win.event} className="group">
              <div className={row}>
                <h2 className="min-w-0 text-[15px] leading-6 font-medium tracking-[-0.01em] text-balance">
                  {win.event}
                </h2>
                <p className="shrink-0 font-mono text-[10.5px] text-muted transition-colors duration-300 group-hover:text-foreground/70">
                  {win.when}
                </p>
              </div>

              <p className="mt-0.5 text-[13px] leading-6 text-muted">
                {[win.project, win.location].filter(Boolean).join(" · ")}
              </p>

              <ul className="mt-1.5 flex flex-col border-l border-muted/30 pl-3">
                {win.awards.map((award) => (
                  <li
                    key={award}
                    className="text-[13px] leading-6 text-foreground/85"
                  >
                    {award}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">
                {win.note}
              </p>

              <p className="mt-2 flex flex-wrap gap-x-3 font-mono text-[11px]">
                {win.links.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted ${link}`}
                  >
                    {item.label}
                  </a>
                ))}
              </p>
            </article>
          ))}
        </section>

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
