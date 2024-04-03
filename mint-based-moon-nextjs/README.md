# Mint Based Moon

## Quickstart

### Set up

```
cd mint-based-moon-nextjs
# install node modules
yarn
```

### Development

```
# run local server
yarn dev
```

To use the frame locally, visit `http://localhost:3000/api/dev`

### Deployment

1. Fork this repo
2. Sign up or sign into Vercel: https://vercel.com
3. Create a new project on vercel and point the project to the `mint-based-moon-nextjs` directory in your fork. Vercel should automatically detect that this is a NextJS project
4. Follow Vercel's remaining steps to deploy
5. After deploying, Vercel will generate a link for your hosted site (frame). The frame url is url vercel generates with `/api` appended to the end. For example, the URL to a frame would look like the following: `http://some-link.vercel.app/api`

### Usage on Farcaster

#### Validating via Warpcast frame debugger

1. Visit https://warpcast.com/~/developers/frames
2. Paste the link to your frame, which you generated in the "Deployment" step, in the url box
3. If all is working properly, you should be able to interact with your frame on the frame debugger

#### Sharing via a cast

1. Paste the link to your frame, which you generated in the "Deployment" step, in a cast
2. That's it! Anybody can now interact with your frame!

### Adapting the frame to your own project

## Understanding this project

1. Route (`app/api/[[...routes]]/route.tsx`): contains all frame logic
2. Abi (`app/api/[[...routes]]/abi.ts`): contains abi of the contract we will interact with
3. Moon image (`public/assets/moon.png`): contains the background image to display

## Adapting the framae

### UI

1. Update the `<img src="..." />` in `route.tsx` to point to your image. You can add your image to the `public/assets/` directory
2. Update the title in `route.tsx` with the name of the NFT that users will mint
3. Update the description in `route.tsx` with any additional information about the NFT

### Transaction-related fields

1. Update the `CONTRACT_ADDRESS` constant in `route.tsx` to point to your smart contract
2. Update the `functionName` in `route.tsx` to be the name of the mint function on your smart contract
3. Update the `args` and `value` to be the arguments and value your smart contract expects to take in

If you would like to use a chain other than Base, you can update the `CHAIN` constant to the cross-chain ID for your chain of choice
