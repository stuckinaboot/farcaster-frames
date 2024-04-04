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

console.log("KEY!", process.env.OS_API_KEY);
sdk.auth(process.env.OS_API_KEY);

const IS_TESTNETS = false;
const CONTRACT_ADDRESS = IS_TESTNETS
  ? "0xB86C967684dF99fb5De26dFEBba81ff5F83D99F1"
  : "0x80ad4e5c5ae9d6c6bff364b1e672b5e144751e92";
// IDs https://docs.simplehash.com/reference/supported-chains-testnets
// Base: eip155:8453, Base Sepolia: "eip155:84532"
const CHAIN = IS_TESTNETS ? "eip155:84532" : "eip155:8453";

// UI
const COLLECTION_NAME = "Based Moon";
const TITLE = `Floor Store: ${COLLECTION_NAME}`;
const BACKGROUND_IMG_SRC = "/assets/moon.png";
const DESCRIPTION =
  "Based Moons are onchain interactive moon NFTs with art updating in real-time to closely reflect the phase of the real world moon";

async function getFloorListing(slug: string) {
  const bestListings = await sdk.get_best_listings_on_collection_v2({
    collection_slug: slug,
  });
  const bestListing = bestListings?.data?.listings[0];
  return bestListing;
}

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.transaction("/mint", async (c) => {
  const { inputText } = c;
  const amtToMint = parseInt(inputText || "1") || 1;

  const floorListing = await getFloorListing("mushroom-pixel-5557");

  const hash = floorListing.order_hash;
  const chain = "base";
  const protocol = "0x0000000000000068f116a894984e2db1123eb395";
  const listing = { hash, chain, protocol };
  // TODO use address
  const fulfiller = { address: "0xaf708ad676a9558206e108afc07bd798dda0dafd" };

  try {
    const data = await sdk.generate_listing_fulfillment_data_v2({
      listing,
      fulfiller,
    });
    const fulfillmentData = data.data.fulfillment_data;
    console.log(
      "DATA!"
      // fulfillmentData,
      // fulfillmentData.transaction.input_data.
    );

    console.log("HIT ME!", fulfillmentData.transaction.input_data.parameters);
    const encoded = encodeFunctionData({
      abi: abi,
      functionName: "fulfillBasicOrder_efficient_6GL6yc",
      args: [fulfillmentData.transaction.input_data.parameters],
    });

    console.log("WOAH!!", encoded);

    // Contract transaction response.
    return c.contract({
      abi: abi,
      functionName: "fulfillBasicOrder_efficient_6GL6yc",
      args: [fulfillmentData.transaction.input_data.parameters],
      chainId: CHAIN,
      to: protocol,
      value: fulfillmentData.transaction.value,
    });
  } catch (e) {
    console.log("Error", e);
  }
  // return c.contract({
  //   abi,
  //   chainId: CHAIN,
  //   functionName: "mintPublic",
  //   args: [amtToMint],
  //   to: CONTRACT_ADDRESS,
  //   value: parseEther((price * amtToMint).toString()),
  // });
});

app.frame("/", async (c) => {
  const { status } = c;

  const floorListing = await getFloorListing("mushroom-pixel-5557");
  const price = floorListing?.price?.current?.value;
  const currency = floorListing?.price?.current?.currency;
  const parsedPrice = formatEther(price);
  console.log("KEY", floorListing, parsedPrice);

  const description = `Purchase via Frame\nPrice: ${parsedPrice} ${currency}`;

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
        <img
          src={BACKGROUND_IMG_SRC}
          style={{ position: "absolute", width: 1600 }}
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
