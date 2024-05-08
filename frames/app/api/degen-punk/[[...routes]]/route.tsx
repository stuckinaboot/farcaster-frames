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
import { logEvent } from "../../logging.ts";

const client = createPublicClient({
  chain: degen,
  transport: http(),
});

const IS_TESTNETS = false;
const CONTRACT_ADDRESS = IS_TESTNETS
  ? "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9"
  : "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9";
// IDs https://docs.simplehash.com/reference/supported-chains-testnets
const CHAIN = IS_TESTNETS ? "eip155:666666666" : "eip155:666666666";

const FRAME_LOGGING_ID = "degen-punks";

// UI
const TITLE = "Degen Punks";
const DESCRIPTION =
  "Degen punks are taking over the degen chain. View degen punk stats and place bids on degen punks.";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api/degen-punk",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/bid", async (c) => {
  await logEvent({ route: "bid" }, FRAME_LOGGING_ID);

  const { inputText } = c;
  let bidAmountString = inputText;
  if (bidAmountString == null) {
    const highestBid = await getBestBid();
    // Increase highest bid by 1
    bidAmountString = (+highestBid + 1).toString();
  }

  // Contract transaction response.
  return c.contract({
    abi,
    chainId: CHAIN,
    functionName: "placeBid",
    args: [],
    to: CONTRACT_ADDRESS,
    value: parseEther(bidAmountString),
  });
});

async function getLatestPrice() {
  const data = await client.call({
    to: CONTRACT_ADDRESS,
    data: "0xa74a7b78",
  });
  const res = formatEther(BigInt(data.data as string));
  return res;
}

async function getTotalSales() {
  const data = await client.call({
    to: CONTRACT_ADDRESS,
    data: "0x80104403",
  });
  return parseInt(data.data as string, 16);
}

async function getBestBid() {
  const data = await client.call({
    to: CONTRACT_ADDRESS,
    data: "0xd57bde79",
  });
  return formatEther(BigInt(data.data as string));
}

async function getBestBidder() {
  const data = await client.call({
    to: CONTRACT_ADDRESS,
    data: "0x91f90157",
  });
  const address = "0x" + (data.data as string).substring(26);
  const checkSummedAddress = getAddress(address);
  return truncateEthAddress(checkSummedAddress);
}

app.frame("/stats", async (c) => {
  await logEvent({ route: "stats" }, FRAME_LOGGING_ID);

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
      <TextInput placeholder="Enter bid in DEGEN" />,
      <Button.Transaction target="/bid">Place Bid</Button.Transaction>,
      <Button action="/stats">Refresh Stats</Button>,
    ],
  });
});

app.frame("/", (c) => {
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
    intents: [<Button action="/stats">Enter</Button>],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
