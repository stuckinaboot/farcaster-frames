/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";

import { abi } from "./abi.ts";

const IS_TESTNETS = false;
const CONTRACT_ADDRESS = IS_TESTNETS
  ? "0x5dDd8a93B92a2ee485588dECaAc397785d8a332b"
  : "0x7F2bbaC3AA23165388301476Cf5944F541096cF6";
// IDs https://docs.simplehash.com/reference/supported-chains-testnets
// Base: eip155:8453, Base Sepolia: "eip155:84532"
const CHAIN = IS_TESTNETS ? "eip155:84532" : "eip155:8453";

// UI
const TITLE = "Mint and Pass a Note";
const DESCRIPTION =
  "When you mint a note, you'll receive ('be passed') a note with a message written by the previous minter. Whoever mints next will receive a note NFT with your message. After you mint, somebody else must mint the note you wrote before you can mint again. 0.0005 ETH to mint and pass a note.";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api/pass-a-note",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": process.env.AIRSTACK_API_KEY as string,
      },
    },
  },
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
