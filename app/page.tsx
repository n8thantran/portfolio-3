import { experience, meta, stintRows, tenure } from "./experience";
import Link from "next/link";
import { Clock } from "./status";
import { ThemeToggle } from "./theme";
import { Backdrop } from "./backdrop";

const EMAIL = "nthntrn006@gmail.com";

const ELSEWHERE = [
  { label: "github", href: "https://github.com/n8thantran" },
  { label: "linkedin", href: "https://www.linkedin.com/in/nthntrn/" },
  { label: "x", href: "https://x.com/n8thantran" },
];

const link =
  "underline decoration-muted/40 underline-offset-[5px] transition-[color,text-decoration-color] duration-200 hover:text-foreground hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current";

// Every row in the page shares this shape: content flush left, meta flush right.
const row = "flex flex-nowrap items-baseline justify-between gap-6";

// A rolled scroll: curled at the top right and bottom left, which is what keeps
// it readable as paper rather than a rectangle once it is down at 13px.
function ScrollIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5.2 4.4h5.6v7.2H5.2z" />
      <path d="M5.2 4.4a1.15 1.15 0 0 1 1.15-1.15h5.6a1.15 1.15 0 0 0-1.15 1.15" />
      <path d="M10.8 11.6a1.15 1.15 0 0 1-1.15 1.15h-5.6a1.15 1.15 0 0 0 1.15-1.15" />
      <path d="M6.9 6.6h2.2" />
      <path d="M6.9 8.6h2.2" />
    </svg>
  );
}

// Drawn rather than set as an emoji: the footer is one muted colour and a colour
// emoji would be the only thing on the page that ignores the theme.
function TrophyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 2.5h6v3a3 3 0 0 1-6 0z" />
      <path d="M5 3.7H3.6a1.6 1.6 0 0 0 1.5 3" />
      <path d="M11 3.7h1.4a1.6 1.6 0 0 1-1.5 3" />
      <path d="M8 8.5v4.7" />
      <path d="M5.9 13.2h4.2" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Backdrop />
      <main
        data-fit-screen
        className="relative z-10 mx-auto flex min-h-svh w-full max-w-[38rem] flex-col px-6 py-8 sm:px-8 sm:py-10"
      >
      <div className="flex flex-1 flex-col justify-center">
        <header>
          <div className={row}>
            <h1 className="text-[17px] font-medium tracking-[-0.015em]">
              Nathan Tran
            </h1>
            <ThemeToggle />
          </div>
          <nav className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px]">
            <a href={`mailto:${EMAIL}`} className={`text-muted ${link}`}>
              {EMAIL}
            </a>
            {ELSEWHERE.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-muted ${link}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <section className="mt-12 flex flex-col gap-8">
          {experience.map((role) => (
            <article
              key={role.org}
              className="group"
            >
              <div className={row}>
                <h2 className="min-w-0 text-[15px] leading-6 font-medium tracking-[-0.01em] text-balance">
                  <a
                    href={role.orgHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-transparent decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-200 hover:decoration-current focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    {role.org}
                  </a>
                  <span
                    aria-hidden
                    className="ml-1 inline-block text-[11px] text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                  >
                    ↗
                  </span>
                </h2>

                <p className="shrink-0 font-mono text-[10.5px] text-muted transition-colors duration-300 group-hover:text-foreground/70">
                  {tenure(role)}
                </p>
              </div>

              <p className="mt-0.5 text-[13px] leading-6 text-muted">
                {meta(role)}
              </p>

              {stintRows(role).length ? (
                <ul className="mt-1.5 flex flex-col border-l border-muted/30 pl-3">
                  {stintRows(role).map((stint) => (
                    <li key={stint.period} className={row}>
                      <span className="min-w-0 text-[13px] leading-6 text-foreground/85">
                        {stint.label}
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-muted">
                        {stint.period}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">
                {role.note}
              </p>

              {role.link ? (
                <p className="mt-2 font-mono text-[11px]">
                  <a
                    href={role.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted ${link}`}
                  >
                    {role.link.label}
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </section>
      </div>

      <footer
        className={`relative flex flex-nowrap items-baseline justify-between gap-6 pt-12 font-mono text-[10.5px] whitespace-nowrap text-muted`}
      >
        <Clock />
        <span className="flex shrink-0 items-center gap-3.5 self-center">
          <Link
            href="/resume"
            aria-label="Resume"
            title="Resume"
            className="flex items-center leading-none transition-colors duration-200 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <ScrollIcon />
          </Link>
          <Link
            href="/trophies"
            aria-label="Trophies"
            title="Trophies"
            className="flex items-center leading-none transition-colors duration-200 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <TrophyIcon />
          </Link>
          <Link
            href="/music"
            aria-label="Music"
            title="Music"
            className="flex items-center text-[13px] leading-none transition-colors duration-200 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            ♪
          </Link>
        </span>
        </footer>
      </main>
    </>
  );
}
