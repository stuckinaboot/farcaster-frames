import fetch from "node-fetch";

const DISABLE_LOGGING = true;

export async function logEvent(event: any, frameCollectionId?: string) {
  if (DISABLE_LOGGING) {
    return;
  }
  const payload = {
    api_key: process.env.GRAPHJSON_API_KEY,
    collection: frameCollectionId || "farcaster-frame-floor",
    json: JSON.stringify({ ...event, url: process.env.NEXT_PUBLIC_VERCEL_URL }),
    timestamp: Math.floor(new Date().getTime() / 1000),
  };

  await fetch("https://api.graphjson.com/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
