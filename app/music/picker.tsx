"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Deliberately not imported from lib/lastfm: that module is server only, and
// pulling it in here would drag the api key and every fetch helper into the
// client bundle for the sake of one line of string formatting.
const keyOf = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const yearOf = (key: string) => Number(key.slice(0, 4));

type Option = { value: number; label: string; disabled?: boolean };

/**
 * The month label doubles as the control: two dropdowns painted to look like
 * the line of text they sit in. Built rather than left as a native select,
 * which renders as an opaque system menu in the system's own colours and opens
 * wherever it likes, usually upward over the page.
 */
export function MonthPicker({
  year,
  month,
  first,
  last,
}: {
  year: number;
  month: number;
  /** Oldest month with anything in it, "YYYY-MM". */
  first: string;
  /** The current month, "YYYY-MM". */
  last: string;
}) {
  const router = useRouter();

  const exists = (y: number, m: number) => {
    const key = keyOf(y, m);
    return key >= first && key <= last;
  };

  // Landing on a month that does not exist would 404, so the edges of the
  // archive clamp instead: pick january of the first year and you get its
  // first real month.
  const go = (y: number, m: number) => {
    const key = exists(y, m) ? keyOf(y, m) : keyOf(y, m) < first ? first : last;
    if (key !== keyOf(year, month)) router.push(`/music/${key}`);
  };

  const years: number[] = [];
  for (let y = yearOf(first); y <= yearOf(last); y++) years.push(y);

  return (
    <span className="inline-flex items-center gap-1">
      <Dropdown
        label="Month"
        value={month}
        onSelect={(value) => go(year, value)}
        options={MONTHS.map((name, i) => ({
          value: i + 1,
          label: name,
          disabled: !exists(year, i + 1),
        }))}
      />

      <Dropdown
        label="Year"
        value={year}
        onSelect={(value) => go(value, month)}
        options={years.map((y) => ({ value: y, label: String(y) }))}
      />
    </span>
  );
}

function Dropdown({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: number;
  options: Option[];
  onSelect: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const id = useId();
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-${i}`;
  const current = options.find((option) => option.value === value);
  const selected = options.findIndex((option) => option.value === value);

  // A pointer anywhere outside closes it. pointerdown rather than click so the
  // menu is gone before the page underneath reacts.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // The list scrolls once it is taller than the cap, so the highlighted row has
  // to be kept in view as the arrows move it.
  useEffect(() => {
    if (!open) return;
    list.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    setActive(selected < 0 ? 0 : selected);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  // Disabled months are skipped rather than landed on and rejected.
  const step = (delta: number) =>
    setActive((from) => {
      let next = from;
      for (let n = 0; n < options.length; n++) {
        next = (next + delta + options.length) % options.length;
        if (!options[next].disabled) return next;
      }
      return from;
    });

  // First or last option that is actually selectable.
  const edge = (direction: 1 | -1) => {
    const order =
      direction === 1
        ? options.map((_, i) => i)
        : options.map((_, i) => options.length - 1 - i);
    return order.find((i) => !options[i].disabled) ?? 0;
  };

  const choose = (i: number) => {
    const option = options[i];
    if (!option || option.disabled) return;
    setOpen(false);
    button.current?.focus();
    onSelect(option.value);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        if (open) close();
        return;
      case "ArrowDown":
        event.preventDefault();
        if (open) step(1);
        else show();
        return;
      case "ArrowUp":
        event.preventDefault();
        if (open) step(-1);
        else show();
        return;
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActive(edge(event.key === "Home" ? 1 : -1));
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(active);
        else show();
        return;
      case "Tab":
        setOpen(false);
        return;
    }
  };

  return (
    <span ref={root} className="relative inline-flex items-center">
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-[3px] px-1 py-1 font-mono text-[11px] text-foreground transition-colors duration-200 hover:bg-foreground/[0.07] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-current sm:py-0.5"
      >
        {current?.label ?? "—"}
        <span
          aria-hidden
          className={`text-[7px] text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open ? (
        // Pinned under the trigger on purpose. The native menu opened upward
        // over the heading, which is the thing this replaces.
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 z-30 mt-1.5 max-h-[min(21rem,55vh)] max-w-[calc(100vw-3rem)] min-w-[7.5rem] overflow-y-auto overscroll-contain rounded-md border border-muted/25 bg-background py-1 shadow-lg shadow-black/25"
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={optionId(i)}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              data-active={i === active}
              onPointerEnter={() => !option.disabled && setActive(i)}
              onClick={() => choose(i)}
              className={[
                "px-3 py-2 font-mono text-[11px] whitespace-nowrap transition-colors duration-150 sm:py-1.5",
                option.disabled
                  ? "cursor-default text-muted/30"
                  : "cursor-pointer",
                !option.disabled && i === active
                  ? "bg-foreground/10 text-foreground"
                  : "",
                !option.disabled && i !== active
                  ? option.value === value
                    ? "text-foreground"
                    : "text-muted"
                  : "",
              ].join(" ")}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}
