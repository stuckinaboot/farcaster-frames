/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { encodeAbiParameters, encodeFunctionData, formatEther } from "viem";
import api from "api";

import { abi } from "./abi.ts";
const sdk = api("@opensea/v2.0#27kiuuluk3ys90");
sdk.server("https://api.opensea.io");

sdk.auth(process.env.OS_API_KEY);

const SEAPORT_PROTOCOL_ADDRESS = "0x0000000000000068f116a894984e2db1123eb395";

const IS_TESTNETS = false;
// IDs https://docs.simplehash.com/reference/supported-chains-testnets
// Base: eip155:8453, Base Sepolia: "eip155:84532"
const CHAIN_NAME = "base";
const CHAIN = IS_TESTNETS ? "eip155:84532" : "eip155:8453";

// UI
const SLUG = "basepaint";
const COLLECTION_NAME = "BasePaint";
const TITLE = `Floor Store: ${COLLECTION_NAME}`;

async function getFloorListing(slug: string) {
  const bestListings = await sdk.get_best_listings_on_collection_v2({
    collection_slug: slug,
  });
  const bestListing = bestListings?.data?.listings[0];
  return bestListing;
}

async function getNft(params: {
  chain: string;
  address: string;
  identifier: string;
}) {
  const response = await sdk.get_nft(params);
  return response?.data?.nft;
}

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/mint", async (c) => {
  const floorListing = await getFloorListing(SLUG);

  const listing = {
    hash: floorListing.order_hash,
    chain: CHAIN_NAME,
    protocol: SEAPORT_PROTOCOL_ADDRESS,
  };
  const fulfiller = { address: c.address };

  try {
    const data = await sdk.generate_listing_fulfillment_data_v2({
      listing,
      fulfiller,
    });
    const fulfillmentData = data.data.fulfillment_data;

    return c.contract({
      abi: abi,
      functionName: "fulfillBasicOrder_efficient_6GL6yc",
      args: [fulfillmentData.transaction.input_data.parameters],
      chainId: CHAIN,
      to: SEAPORT_PROTOCOL_ADDRESS,
      value: fulfillmentData.transaction.value,
    });
  } catch (e) {
    throw new Error("Failed to purchase");
  }
});

app.frame("/", async (c) => {
  const { status } = c;

  const floorListing = await getFloorListing(SLUG);
  const price = floorListing?.price?.current?.value;
  const currency = floorListing?.price?.current?.currency;
  const parsedPrice = formatEther(price);

  const firstOfferItem = floorListing.protocol_data.parameters.offer[0];
  const { token, identifierOrCriteria } = firstOfferItem;

  const nft = await getNft({
    chain: CHAIN_NAME,
    address: token,
    identifier: identifierOrCriteria,
  });

  const description = `Purchase via Frame\nPrice: ${parsedPrice} ${currency}`;
  const imgSrc = nft?.image_url;

  // NOTE: svg image urls don't seem to work properly

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
        <img src={imgSrc} style={{ position: "absolute", width: 1600 }} />
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
            backgroundColor: "black",
            textAlign: "center",
          }}
        >
          {description}
        </div>
      </div>
    ),
    intents: [<Button.Transaction target="/mint">Buy now</Button.Transaction>],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
