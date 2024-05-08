/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { createPublicClient, http } from "viem";
import { formatEther, getAddress } from "viem";
import truncateEthAddress from "truncate-eth-address";

import { abi } from "./abi.ts";
import { degen } from "viem/chains";

const client = createPublicClient({
  chain: degen,
  transport: http(),
});

const IS_TESTNETS = false;
const CONTRACT_ADDRESS = IS_TESTNETS
  ? "0x5dDd8a93B92a2ee485588dECaAc397785d8a332b"
  : "0x7F2bbaC3AA23165388301476Cf5944F541096cF6";
// IDs https://docs.simplehash.com/reference/supported-chains-testnets
// Base: eip155:8453, Base Sepolia: "eip155:84532"
const CHAIN = IS_TESTNETS ? "eip155:666666666" : "eip155:666666666";

// UI
const TITLE = "Degen Punk Bid";
const DESCRIPTION = "Bid on a degen punk.";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api/degen-punk",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/bid", (c) => {
  const { inputText } = c;

  // Contract transaction response.
  return c.contract({
    abi,
    chainId: CHAIN,
    functionName: "mintPublic",
    args: [inputText],
    to: CONTRACT_ADDRESS,
    value: parseEther(inputText as string),
  });
});

async function getFoo() {
  const data = await client.call({
    to: "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9",
    data: "0xc99a3d9b",
  });
  const res = formatEther(BigInt(data.data as string));
  return res;
}

async function getLatestPrice() {
  const data = await client.call({
    to: "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9",
    data: "0xa74a7b78",
  });
  const res = formatEther(BigInt(data.data as string));
  return res;
}

async function getTotalSales() {
  const data = await client.call({
    to: "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9",
    data: "0x80104403",
  });
  return parseInt(data.data as string, 16);
}

async function getBestBid() {
  const data = await client.call({
    to: "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9",
    data: "0xd57bde79",
  });
  return formatEther(BigInt(data.data as string));
}

async function getBestBidder() {
  const data = await client.call({
    to: "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9",
    data: "0x91f90157",
  });
  const address = "0x" + (data.data as string).substring(26);
  const checkSummedAddress = getAddress(address);
  return truncateEthAddress(checkSummedAddress);
}

app.frame("/stats", async (c) => {
  const totalSales = await getTotalSales();
  const latestSalePrice = await getLatestPrice();
  const bestBidPrice = await getBestBid();
  const bestBidder = await getBestBidder();

  const totalSalesStat = `Number of Sales: ${totalSales.toString()}`;
  const latestSaleStat = `Latest Sale Price: ${latestSalePrice.toString()} DEGEN`;
  const currentBidStat = `Current Bid: ${bestBidPrice.toString()} DEGEN`;
  const bestBidderStat = `Highest Bidder: ${bestBidder}`;

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(to right, #432889, #17101F)",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
          color: "white",
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
          {totalSalesStat}
        </div>
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
          {latestSaleStat}
        </div>
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
          {currentBidStat}
        </div>
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
          {bestBidderStat}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter a bid... (in DEGEN)" />,
      <Button action="/bid">Bid</Button>,
      <Button action="/stats">Refresh Stats</Button>,
    ],
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
      <Button action="/stats">Refresh Stats</Button>,
    ],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
