// Serves /ads.txt for Google AdSense. The file authorizes Google to sell ad
// inventory for this domain — AdSense flags accounts whose ads.txt is missing
// or wrong. We derive it from NEXT_PUBLIC_ADSENSE_CLIENT so there's a single
// source of truth; until that's set, /ads.txt 404s (correct — there's nothing
// to authorize yet).
//
// ads.txt wants the publisher id as "pub-XXXX" (the AdSense client id is
// "ca-pub-XXXX", so we strip the leading "ca-"). f08c47fec0942fa0 is Google's
// fixed certification-authority id, identical for every AdSense publisher.

export const dynamic = "force-static";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function GET() {
  if (!ADSENSE_CLIENT) {
    return new Response("Not found", { status: 404 });
  }

  const publisherId = ADSENSE_CLIENT.replace(/^ca-/, "");
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
