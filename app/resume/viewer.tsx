"use client";

import { useEffect, useRef, useState } from "react";

const SOURCE = "/api/resume";

// Rendered here rather than handed to the browser's own pdf viewer. Every
// browser ships a different one: Chrome honours #toolbar=0, Firefox's pdf.js
// ignores it and opens a document outline over the page, Safari does its own
// thing again. Drawing the page ourselves is the only way the resume looks the
// same everywhere, and the same as the rest of the site.
export function ResumeViewer() {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [ratio, setRatio] = useState(11 / 8.5);

  useEffect(() => {
    let cancelled = false;
    // the running render, so a resize mid render can cancel it rather than
    // racing another one onto the same canvas
    let task: { cancel: () => void; promise: Promise<void> } | null = null;

    const run = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const doc = await pdfjs.getDocument({ url: SOURCE }).promise;
        if (cancelled) return;

        const page = await doc.getPage(1);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        setRatio(base.height / base.width);

        const draw = async () => {
          const target = canvas.current;
          const width = frame.current?.clientWidth ?? 0;
          if (!target || width === 0) return;

          task?.cancel();

          // Render at the device's real pixel density so the text is crisp on
          // a retina screen instead of being upscaled from css pixels.
          const dpr = Math.min(window.devicePixelRatio || 1, 3);
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });

          target.width = Math.floor(viewport.width);
          target.height = Math.floor(viewport.height);
          target.style.width = "100%";
          target.style.height = "auto";

          // v6 takes the canvas itself; canvasContext is the legacy path and
          // the two are not meant to be passed together
          task = page.render({ canvas: target, viewport });
          await task.promise;
          if (!cancelled) setState("ready");
        };

        await draw();

        // Re-render on width changes so it stays sharp when the window moves,
        // debounced because a drag fires this continuously.
        let pending: ReturnType<typeof setTimeout>;
        let last = frame.current?.clientWidth ?? 0;
        const observer = new ResizeObserver(() => {
          const width = frame.current?.clientWidth ?? 0;
          if (width === last) return;
          last = width;
          clearTimeout(pending);
          pending = setTimeout(() => {
            void draw().catch(() => {});
          }, 150);
        });
        if (frame.current) observer.observe(frame.current);

        return () => {
          clearTimeout(pending);
          observer.disconnect();
        };
      } catch {
        // the pdf did not load or the worker could not start; the links above
        // still work, so say so rather than leaving an empty box
        if (!cancelled) setState("failed");
      }
    };

    const cleanup = run();

    return () => {
      cancelled = true;
      task?.cancel();
      void cleanup.then((fn) => fn?.());
    };
  }, []);

  if (state === "failed") {
    return (
      <p className="text-[14px] leading-relaxed text-muted">
        The resume could not be displayed here.{" "}
        <a
          href={SOURCE}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-muted/40 underline-offset-[5px] transition-[color,text-decoration-color] duration-200 hover:text-foreground hover:decoration-current"
        >
          Open the pdf
        </a>
        .
      </p>
    );
  }

  return (
    <div
      ref={frame}
      style={{ aspectRatio: state === "ready" ? undefined : `1 / ${ratio}` }}
      className="w-full overflow-hidden rounded-md border border-muted/25 bg-foreground/[0.03]"
    >
      <canvas
        ref={canvas}
        aria-label="Nathan Tran's resume"
        role="img"
        className={`block transition-opacity duration-500 ${
          state === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
