/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { Address, createPublicClient, http } from "viem";
import { formatEther, getAddress } from "viem";
import truncateEthAddress from "truncate-eth-address";

import { abi } from "./abi.ts";
import { degen } from "viem/chains";
import { logEvent } from "../../logging.ts";

const client = createPublicClient({
  chain: degen,
  transport: http(),
});

const CONTRACTS = [
  { address: "0x7A1DBB83DbB1D4E3e692455533BA18F2Fdf19dc9", name: "floor" },
  { address: "0xdc9A711324a7e90426cB37a5C0359418A76C102f", name: "hat" },
  { address: "0x8593606796E2B58AF3A39e235C69f47399683b77", name: "eye" },
  { address: "0xe53fE3c329Cef59EeC985BA2bf19a85A1a8b97cd", name: "hoodie" },
  { address: "0xFB0564B26c45fb8aBb768F27ea3724EffE827207", name: "zombie" },
  { address: "0x461b82a5EAA3a8ef31aB1B2c448a61Ac33C50F30", name: "ape" },
  { address: "0x0d65e0ed1F1Db5DaB3fC126cF95600061E909FFD", name: "alien" },
];

// IDs https://docs.simplehash.com/reference/supported-chains-testnets
const CHAIN = "eip155:666666666";

const FRAME_LOGGING_ID = "degen-punks";

// UI
const TITLE = "Degen Punks";
const DESCRIPTION =
  "Degen punks are taking over the degen chain. View degen punk stats and place bids on degen punks.";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api/degen-punks",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/bid", async (c) => {
  await logEvent(
    { route: "bid", address: c.frameData?.address },
    FRAME_LOGGING_ID
  );

  const { inputText } = c;
  let bidAmountString = inputText;
  if (!bidAmountString) {
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

async function getLatestPrice(contractAddress: Address) {
  const data = await client.call({
    to: contractAddress,
    data: "0xa74a7b78",
  });
  const res = formatEther(BigInt(data.data as string));
  return res;
}

async function getTotalSales(contractAddress: Address) {
  const data = await client.call({
    to: contractAddress,
    data: "0x80104403",
  });
  return parseInt(data.data as string, 16);
}

async function getBestBid(contractAddress: Address) {
  const data = await client.call({
    to: contractAddress,
    data: "0xd57bde79",
  });
  return formatEther(BigInt(data.data as string));
}

async function getBestBidder(contractAddress: Address) {
  const data = await client.call({
    to: contractAddress,
    data: "0x91f90157",
  });
  const address = "0x" + (data.data as string).substring(26);
  const checkSummedAddress = getAddress(address);
  return truncateEthAddress(checkSummedAddress);
}

app.frame("/stats", async (c) => {
  await logEvent(
    { route: "stats", address: c.frameData?.address },
    FRAME_LOGGING_ID
  );

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
        <img
          src={"/assets/degen-punks-image.png"}
          style={{
            position: "absolute",
          }}
        />
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
            lineHeight: 2,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
            backgroundColor: "black",
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
            lineHeight: 2,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
            backgroundColor: "black",
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
            lineHeight: 2,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
            backgroundColor: "black",
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
            lineHeight: 2,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
            backgroundColor: "black",
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

app.frame("/", async (c) => {
  await logEvent(
    { route: "root", address: c.frameData?.address },
    FRAME_LOGGING_ID
  );
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
        <img
          src={"/assets/degen-punks-image.png"}
          style={{
            position: "absolute",
          }}
        />
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
            backgroundColor: "black",
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
