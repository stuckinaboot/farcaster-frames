/** @jsxImportSource frog/jsx */

import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import {
  ChainId,
  generateFloorStoreApp,
} from "../../floorStoreFrameGenerator.tsx";

const app = generateFloorStoreApp({
  collectionName: "Based Nouns",
  slug: "based-nouns",
  chainId: ChainId.BASE,
  overrideImgSrc:
    "https://i.seadn.io/s/primary-drops/0xbf57d0535e10e7033447174404b9bed3d9ef4c88/31137371:about:media:c0a8682a-7b83-4fa6-b5ed-59c17c97f90e.jpeg?auto=format&dpr=1&w=3840",
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
