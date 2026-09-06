// The resume is a pdf living in its own repo, so it can be updated by pushing
// there rather than by redeploying this site.
//
// It is proxied rather than linked: the viewer gets a same origin url (so the
// browser's own pdf viewer will embed it), the response is cached here instead
// of hitting github on every view, and the source repo and branch stay a
// server side detail.

const SOURCE =
  "https://raw.githubusercontent.com/n8thantran/resume/SWE/main.pdf";

const FILENAME = "nathan-tran-resume.pdf";

// Next only accepts a literal here, so the value is declared as the export and
// the constant is derived from it rather than the other way round.
export const revalidate = 3600;
const REVALIDATE_S = revalidate;

export async function GET() {
  try {
    const upstream = await fetch(SOURCE, {
      next: { revalidate: REVALIDATE_S },
    });

    if (!upstream.ok) {
      return new Response("Resume is unavailable right now.", { status: 502 });
    }

    const pdf = await upstream.arrayBuffer();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        // inline so it renders in the page rather than prompting a save; the
        // filename is still used when someone does choose to download it
        "Content-Disposition": `inline; filename="${FILENAME}"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE_S}, stale-while-revalidate=86400`,
      },
    });
  } catch {
    // github unreachable, or the branch or file moved
    return new Response("Resume is unavailable right now.", { status: 502 });
  }
}
