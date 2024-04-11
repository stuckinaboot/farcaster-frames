import fetch from "node-fetch";

export async function logEvent(event: any) {
  const payload = {
    api_key: "30ee0054-5f4a-4f57-b12f-68f3531aab65",
    collection: "farcaster-frame-floor",
    json: JSON.stringify({ ...event, url: process.env.NEXT_PUBLIC_VERCEL_URL }),
    timestamp: Math.floor(new Date().getTime() / 1000),
  };

  await fetch("https://api.graphjson.com/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
