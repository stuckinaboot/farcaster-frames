import fetch from "node-fetch";

export async function logEvent(event: any) {
  const payload = {
    api_key: "30ee0054-5f4a-4f57-b12f-68f3531aab65",
    collection: "farcaster-frame-floor",
    json: JSON.stringify(event),
    timestamp: Math.floor(new Date().getTime() / 1000),
    url: process.env.VERCEL_URL,
  };

  await fetch("https://api.graphjson.com/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
