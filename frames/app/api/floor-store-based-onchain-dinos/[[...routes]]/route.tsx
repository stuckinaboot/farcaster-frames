/** @jsxImportSource frog/jsx */

import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import {
  ChainId,
  generateFloorStoreApp,
} from "../../floorStoreFrameGenerator.tsx";

const app = generateFloorStoreApp({
  collectionName: "Based Onchain Dinos",
  slug: "based-onchain-dinos",
  description: ({ price, currency }) =>
    `Purchase via Frame\nPrice: ${price} ${currency}`,
  chainId: ChainId.BASE,
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
