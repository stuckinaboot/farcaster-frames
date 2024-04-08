/** @jsxImportSource frog/jsx */

import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import {
  ChainId,
  generateFloorStoreApp,
} from "../../floorStoreFrameGenerator.tsx";

const app = generateFloorStoreApp({
  collectionName: "Based Moon",
  slug: "based-moon-nft",
  chainId: ChainId.BASE,
  overrideImgSrc: "/assets/moon-waning-crescent.png",
  noDescriptionBackgroundColor: true,
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
