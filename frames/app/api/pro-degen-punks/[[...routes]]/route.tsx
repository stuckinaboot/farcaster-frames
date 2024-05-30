/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { Address, createPublicClient, http } from "viem";
import { formatEther } from "viem";
import { truncate } from "truncate-ethereum-address";

import { abi } from "./abi.ts";
import { degen } from "viem/chains";
import { logEvent } from "../../logging.ts";

const client = createPublicClient({
  chain: degen,
  transport: http(),
});

const CONTRACTS: { address: Address; name: string }[] = [
  { address: "0x5d2DE0ff02AAA0cce55Af669DF4b38c7dd437Dce", name: "floor" },
  { address: "0xf88C2F983e1a4C9A01671965d458799bbbe04352", name: "eyes" },
  { address: "0xd61EA851119eb8312f8fA3455a3f41277f7A748C", name: "hat" },
  { address: "0x6FF7D9938E70F61e4B1B9b5D36a9cAc906129C66", name: "hoodie" },
  { address: "0xFc4086744F5c72CeCd8139915ED3e68c54fA3b21", name: "zombie" },
  { address: "0x442036ba5BD6364dE7813bC8480B299FcBeDf452", name: "ape" },
  { address: "0xB11b81143F5D6a7Ebecf664967281cf348636f6e", name: "alien" },
];

// IDs https://docs.simplehash.com/reference/supported-chains-testnets
const CHAIN = "eip155:666666666";

const FRAME_LOGGING_ID = "degen-punks";
const NEXT_ARROW = "→";
const PREV_ARROW = "←";

// UI
const TITLE = "Degen Punks - Pro Edition";
const DESCRIPTION =
  "Degen punks are taking over the degen chain. View degen punk stats and place bids on degen punks.";

type State = { contractIndex: number };

const app = new Frog<{ State: State }>({
  assetsPath: "/",
  basePath: "/api/pro-degen-punks",
  initialState: { contractIndex: 0 },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/bid", async (c) => {
  const { buttonValue, previousState } = c;
  await logEvent(
    { route: "bid", address: c.frameData?.address },
    FRAME_LOGGING_ID
  );

  const { inputText } = c;
  let bidAmountString = inputText;
  if (!bidAmountString) {
    const highestBid = await getBestBid("todo" as any);
    // Increase highest bid by 1
    bidAmountString = (+highestBid + 1).toString();
  }

  // Contract transaction response.
  return c.contract({
    abi,
    chainId: CHAIN,
    functionName: "placeBid",
    args: [],
    to: CONTRACTS[previousState.contractIndex].address,
    value: parseEther(bidAmountString),
  });
});

async function getLatestPrice(contractAddress: Address) {
  try {
    const data = await client.readContract({
      address: contractAddress,
      abi,
      functionName: "lastSale",
    });
    const res = formatEther(BigInt(data as string));
    return res;
  } catch (e) {
    return 0;
  }
}

async function getTotalSales(contractAddress: Address) {
  try {
    const data = await client.readContract({
      address: contractAddress,
      abi,
      functionName: "acceptedBidCount",
    });
    return parseInt(data as string, 16);
  } catch (e) {
    return 0;
  }
}

async function getBestBid(contractAddress: Address) {
  try {
    const data = await client.readContract({
      address: contractAddress,
      abi,
      functionName: "highestBid",
    });
    return formatEther(BigInt(data as string));
  } catch (e) {
    return 0;
  }
}

async function getBestBidder(contractAddress: Address) {
  try {
    const data = (await client.readContract({
      address: contractAddress,
      abi,
      functionName: "highestBidder",
    })) as Address;
    const truncated = truncate(data, { nPrefix: 2, nSuffix: 4 }).replaceAll(
      "…",
      ".."
    );
    return truncated;
  } catch (e) {
    return "None";
  }
}

app.frame("/stats", async (c) => {
  const { buttonValue, deriveState } = c;
  const state = deriveState((previousState: State) => {
    if (buttonValue === NEXT_ARROW) {
      previousState.contractIndex++;
      if (previousState.contractIndex >= CONTRACTS.length) {
        previousState.contractIndex = 0;
      }
    }
    if (buttonValue === PREV_ARROW) {
      previousState.contractIndex--;
      if (previousState.contractIndex < 0) {
        previousState.contractIndex = CONTRACTS.length - 1;
      }
    }
  });

  await logEvent(
    { route: "stats", address: c.frameData?.address },
    FRAME_LOGGING_ID
  );

  const contractToStats = await Promise.all(
    CONTRACTS.map(async (contract) => {
      const totalSales = await getTotalSales(contract.address);
      const latestSalePrice = await getLatestPrice(contract.address);
      const bestBidPrice = await getBestBid(contract.address);
      const bestBidder = await getBestBidder(contract.address);
      return {
        contract,
        stats: { totalSales, latestSalePrice, bestBidPrice, bestBidder },
      };
    })
  );

  const contractStatStrings = contractToStats.map(({ contract, stats }) => {
    return `${
      contract.name.substring(0, 1).toUpperCase() +
      contract.name.substring(1).toLowerCase()
    } | Top Bid: ${stats.bestBidPrice}, ${stats.bestBidder} | Last Sale: ${
      stats.latestSalePrice
    } | # Sales: ${stats.totalSales}`;
  });

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          width: "100%",
          color: "white",
          backgroundColor: "#8506FC",
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        {contractStatStrings.map((str) => (
          <div
            style={{
              color: "white",
              fontSize: 34,
              fontFamily: "Courier New, Courier, monospace",
              letterSpacing: "-0.025em",
              lineHeight: 2,
              marginTop: 30,
              padding: "0 50px",
              whiteSpace: "pre-wrap",
              textAlign: "center",
              backgroundColor: "black",
              width: "100%",
            }}
          >
            {str}
          </div>
        ))}
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter bid in DEGEN" />,
      <Button.Transaction target="/bid">
        {CONTRACTS[state.contractIndex].name} bid
      </Button.Transaction>,
      <Button action="/stats">Refresh</Button>,
      <Button action="/stats" value={PREV_ARROW}>
        {PREV_ARROW}
      </Button>,
      <Button action="/stats" value={NEXT_ARROW}>
        {NEXT_ARROW}
      </Button>,
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
    intents: [<Button action="/stats?contractIndex=0">Enter</Button>],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
