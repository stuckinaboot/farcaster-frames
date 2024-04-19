/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";

import { abi } from "./abi.ts";

const IS_TESTNETS = true;
const CONTRACT_ADDRESS = IS_TESTNETS
  ? "0x0646ea2255b51156c6ac7c2f375d5ee1dac41f65"
  : "0x80ad4e5c5ae9d6c6bff364b1e672b5e144751e92";
// IDs https://docs.simplehash.com/reference/supported-chains-testnets
// Base: eip155:8453, Base Sepolia: "eip155:84532"
const CHAIN = IS_TESTNETS ? "eip155:84532" : "eip155:8453";

// UI
const TITLE = "Mint and Pass a Note";
const DESCRIPTION =
  "When you mint a note, you'll receive ('be passed') a note with a message written by the previous minter. Whoever mints next will receive a note NFT with your message.";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api/pass-a-note",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/mint", (c) => {
  const { inputText } = c;

  const price = 0.0005;

  // Contract transaction response.
  return c.contract({
    abi,
    chainId: CHAIN,
    functionName: "mintPublic",
    args: [inputText],
    to: CONTRACT_ADDRESS,
    value: parseEther(price.toString()),
  });
});

app.frame("/", (c) => {
  const { status } = c;
  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background:
            status === "response"
              ? "linear-gradient(to right, #432889, #17101F)"
              : "black",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            backgroundColor: "black",
            textAlign: "center",
          }}
        >
          {TITLE}
        </div>
        <br />
        <div
          style={{
            color: "white",
            fontSize: 30,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
          }}
        >
          {DESCRIPTION}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter a note... (max 33 chars)" />,
      <Button.Transaction target="/mint">Mint</Button.Transaction>,
    ],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
