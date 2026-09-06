"use client";

/**
 * Two state light/dark toggle. Appearance is driven entirely by CSS off the
 * `data-theme` attribute, so nothing here depends on client state and there is
 * no hydration mismatch and no first paint flash.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    const next = current === "dark" ? "light" : "dark";

    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // private mode or blocked storage: the choice just does not persist
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      className="text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
        <g className="theme-icon origin-center">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
        </g>
      </svg>
    </button>
  );
}
