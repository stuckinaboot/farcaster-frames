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

const CONTRACTS: { address: Address; name: string }[] = [
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
  const contractIndexStr = c.req.query("contractIndex");
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
    to: CONTRACTS[parseInt(contractIndexStr || "0")].address,
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
    return truncateEthAddress(data);
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
    } | Top Bid: ${stats.bestBidPrice} DEGEN, ${
      stats.bestBidder
    } | Last Sale: ${stats.latestSalePrice} DEGEN | # Sales: ${
      stats.totalSales
    }`;
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
        }}
      >
        <img
          src={"/assets/degen-punks-image.png"}
          style={{
            position: "absolute",
          }}
        />
        {/* <div
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
        </div> */}
        <br />
        {contractStatStrings.map((str) => (
          <div
            style={{
              color: "white",
              fontSize: 30,
              fontFamily: "Courier New, Courier, monospace",
              letterSpacing: "-0.025em",
              lineHeight: 2,
              marginTop: 30,
              padding: "0 10px",
              whiteSpace: "pre-wrap",
              textAlign: "left",
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
