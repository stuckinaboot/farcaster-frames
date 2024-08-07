/** @jsxImportSource frog/jsx */

import { Button, Frog } from "frog";
import { formatEther } from "viem";
import api from "api";
import { abi } from "./seaportAbi.ts";
import { logEvent } from "./logging.ts";
import { error } from "console";

const sdk = api("@opensea/v2.0#27kiuuluk3ys90");
sdk.server("https://api.opensea.io");

sdk.auth(process.env.OS_API_KEY);

const SEAPORT_PROTOCOL_ADDRESS = "0x0000000000000068f116a894984e2db1123eb395";

// IDs https://docs.simplehash.com/reference/supported-chains-testnets
// Base: eip155:8453, Base Sepolia: "eip155:84532"
export enum ChainId {
  BASE = "eip155:8453",
  BASE_SEPOLIA = "eip155:84532",
}

const CHAIN_ID_TO_CHAIN_NAME: Record<ChainId, string> = {
  [ChainId.BASE]: "base",
  [ChainId.BASE_SEPOLIA]: "base_sepolia",
};

function getShareFrameButton({ name, slug }: { name: string; slug: string }) {
  const coreText = `View and collect the floor ${name} NFT via frame`;
  const href = `https://warpcast.com/~/compose?text=${coreText}&embeds[]=https://farcaster-frames-theta.vercel.app/api/floor-store/${slug}`;
  return <Button.Link href={href}>Share</Button.Link>;
}

// UI

async function getFloorListing(slug: string) {
  const bestListings = await sdk.get_best_listings_on_collection_v2({
    collection_slug: slug,
  });

  // Get first listing with start amount and end amount art 1
  const bestListing = bestListings?.data?.listings.find((listing: any) => {
    const startAmt = +listing.protocol_data.parameters.offer[0].startAmount;
    const endAmt = +listing.protocol_data.parameters.offer[0].endAmount;
    return startAmt === 1 && endAmt === 1;
  });

  // const bestListing = bestListings?.data?.listings[0];
  return bestListing;
}

async function getCollection(slug: string) {
  const collection = await sdk.get_collection({
    collection_slug: slug,
  });
  return collection?.data;
}

async function getNft(params: {
  chain: string;
  address: string;
  identifier: string;
}) {
  const response = await sdk.get_nft(params);
  return response?.data?.nft;
}

export function generateFloorStoreApp(params: {
  collectionName?: string;
  description?: ({
    price,
    currency,
  }: {
    price: string;
    currency: string;
  }) => string;
  slug?: string;
  chainId: ChainId;
  overrideImgSrc?: string;
  noDescriptionBackgroundColor?: boolean;
}) {
  const app = new Frog({
    assetsPath: "/",
    basePath: params.slug
      ? `/api/floor-store-${params.slug}`
      : "/api/floor-store",
    hub:
      process.env.NODE_ENV === "development"
        ? undefined
        : {
            apiUrl: "https://hubs.airstack.xyz",
            fetchOptions: {
              headers: {
                "x-airstack-hubs": process.env.AIRSTACK_API_KEY as string,
              },
            },
          },
    // Supply a Hub to enable frame verification.
    // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  });

  function slugFromPathOrConfig(c: any) {
    const slugFromPath = c.req.param("slug");
    return params.slug || slugFromPath;
  }

  app.transaction("/buy/:slug", async (c) => {
    const slug = slugFromPathOrConfig(c);
    try {
      const floorListing = await getFloorListing(slug);

      const listing = {
        hash: floorListing.order_hash,
        chain: CHAIN_ID_TO_CHAIN_NAME[params.chainId],
        protocol: SEAPORT_PROTOCOL_ADDRESS,
      };
      const fulfiller = { address: c.address };

      const data = await sdk.generate_listing_fulfillment_data_v2({
        listing,
        fulfiller,
      });
      const fulfillmentData = data.data.fulfillment_data;
      const quantity =
        +floorListing.protocol_data.parameters.offer[0].startAmount;
      const price = floorListing?.price?.current?.value / quantity;

      const functionName = fulfillmentData.transaction.function.substring(
        0,
        fulfillmentData.transaction.function.indexOf("(")
      );

      const contractInteraction = c.contract({
        abi: abi,
        functionName: functionName,
        args: Object.values(fulfillmentData.transaction.input_data) as any,
        chainId: params.chainId,
        to: SEAPORT_PROTOCOL_ADDRESS,
        value: BigInt(price) as any,
      });
      await logEvent({ slug, route: "buy", price, success: true });
      return contractInteraction;
    } catch (e) {
      await logEvent({
        slug,
        route: "buy",
        success: false,
        error: (e as any)?.message,
      });
      throw new Error("Failed to purchase");
    }
  });

  app.frame("/:slug", async (c) => {
    const { status } = c;
    const slug = slugFromPathOrConfig(c);
    let collectionName;
    let collectionImage;
    if (params.collectionName) {
      collectionName = params.collectionName;
    }
    if (!params.slug) {
      try {
        const collection = await getCollection(slug);
        collectionName = collection.name;
        collectionImage = collection.image_url;
      } catch (e) {
        await logEvent({
          slug,
          route: "index",
          success: false,
          error: (e as any)?.message,
        });
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
                No collection found
              </div>
            </div>
          ),
        });
      }
    }

    const floorListing = await getFloorListing(slug);

    const firstOfferItem = floorListing.protocol_data.parameters.offer[0];
    const { token, identifierOrCriteria } = firstOfferItem;

    const nft = await getNft({
      chain: CHAIN_ID_TO_CHAIN_NAME[params.chainId],
      address: token,
      identifier: identifierOrCriteria,
    });

    let imgSrc: string = params.overrideImgSrc
      ? params.overrideImgSrc
      : nft?.image_url;
    if (imgSrc?.toLowerCase().indexOf(".svg") !== -1) {
      // SVG won't display properly so attempt to use collection image
      imgSrc = collectionImage;
    }

    // NOTE: svg image urls don't seem to work properly

    const title = `Floor Store: ${collectionName}`;

    return c.res({
      headers: { "cache-control": "max-age=15" },
      action: `/${slug}/view`,
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
            src={imgSrc}
            style={{
              position: "absolute",
              width: 1600,
            }}
          />
          <div
            style={{
              color: "white",
              fontSize: 56,
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
            {title}
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
              backgroundColor: params.noDescriptionBackgroundColor
                ? ""
                : "black",
              textAlign: "center",
            }}
          >
            Purchase the floor listing via frame
          </div>
          <br />
          <div
            style={{
              color: "white",
              fontSize: 30,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
              backgroundColor: params.noDescriptionBackgroundColor
                ? ""
                : "black",
              textAlign: "center",
            }}
          >
            (Powered by the OpenSea public API)
          </div>
        </div>
      ),
      intents: [
        <Button>View floor NFT</Button>,
        getShareFrameButton({ name: collectionName, slug }),
      ],
    });
  });

  app.frame("/:slug/view", async (c) => {
    const { status } = c;
    const slug = slugFromPathOrConfig(c);
    let collectionName;
    let collectionImage;
    if (params.collectionName) {
      collectionName = params.collectionName;
    }
    if (!params.slug) {
      try {
        const collection = await getCollection(slug);
        collectionName = collection.name;
        collectionImage = collection.image_url;
      } catch (e) {
        await logEvent({
          slug,
          route: "index",
          success: false,
          error: (e as any)?.message,
        });
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
                No collection found
              </div>
            </div>
          ),
        });
      }
    }

    const floorListing = await getFloorListing(slug);
    const quantity =
      +floorListing.protocol_data.parameters.offer[0].startAmount;
    const price = floorListing?.price?.current?.value / quantity;
    const currency = floorListing?.price?.current?.currency;
    const parsedPrice = formatEther(BigInt(price));

    const firstOfferItem = floorListing.protocol_data.parameters.offer[0];
    const { token, identifierOrCriteria } = firstOfferItem;

    const nft = await getNft({
      chain: CHAIN_ID_TO_CHAIN_NAME[params.chainId],
      address: token,
      identifier: identifierOrCriteria,
    });

    let imgSrc: string = params.overrideImgSrc
      ? params.overrideImgSrc
      : nft?.image_url;
    if (imgSrc?.toLowerCase().indexOf(".svg") !== -1) {
      // SVG won't display properly so attempt to use collection image
      imgSrc = collectionImage;
    }

    // NOTE: svg image urls don't seem to work properly

    const title = `Floor Store: ${collectionName}`;

    await logEvent({
      slug,
      route: "index",
      success: true,
      price,
    });
    return c.res({
      headers: { "cache-control": "max-age=15" },
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
            src={imgSrc}
            style={{
              position: "absolute",
              width: 1600,
            }}
          />
          <div
            style={{
              color: "white",
              fontSize: 56,
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
            {title}
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
              backgroundColor: params.noDescriptionBackgroundColor
                ? ""
                : "black",
              textAlign: "center",
            }}
          >
            {params.description != null
              ? params.description({ price: parsedPrice, currency })
              : `Purchase #${nft?.identifier} via Frame\nPrice: ${parsedPrice} ${currency}`}
          </div>
        </div>
      ),
      intents: [
        <Button.Transaction target={`/buy/${slug}`}>
          Buy now
        </Button.Transaction>,
        getShareFrameButton({ name: collectionName, slug }),
      ],
    });
  });
  return app;
}
