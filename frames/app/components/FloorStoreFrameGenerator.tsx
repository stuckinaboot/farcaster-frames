"use client";

import { Button, Divider, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import StyledLink from "./Link";
import copy from "copy-to-clipboard";
import cogoToast from "cogo-toast";

export default function FloorStoreFrameGenerator() {
  const [collectionUrl, setCollectionUrl] = useState("");

  function slugFromCollectionUrl(url: string) {
    const lastIdx = url.lastIndexOf("/");
    return url.slice(lastIdx + 1);
  }

  const frameLink = `${
    process.env.VERCEL_URL || "http://localhost:3000"
  }/api/floor-store/${slugFromCollectionUrl(collectionUrl)}`;

  return (
    <Grid item container xs={12} justifyContent={"center"} spacing="8">
      <Grid item xs={12} style={{ textAlign: "center" }}>
        <Typography variant="h3">Generate Floor Store Frame</Typography>
        <Typography variant="body1">
          Create a farcaster frame that allows people to buy the floor NFT in
          any collection with one tap. No code required.
        </Typography>
      </Grid>
      <Grid
        container
        item
        xs={12}
        justifyContent={"center"}
        style={{ textAlign: "center" }}
        spacing={3}
      >
        <Grid container item xs={12} justifyContent={"center"}>
          <Grid item xs={12}>
            <Typography variant="h6">
              Step 1: Enter an OpenSea collection URL (ex.{" "}
              <StyledLink url="https://opensea.io/collection/oviators">
                https://opensea.io/collection/oviators
              </StyledLink>
              )
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              variant="standard"
              label="OpenSea Collection URL"
              fullWidth
              value={collectionUrl}
              onChange={(e) => setCollectionUrl(e.target.value)}
              placeholder="https://opensea.io/collection/oviators"
            />
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">
            Step 2: Copy the link to your frame{" "}
            <Button
              onClick={() => {
                copy(frameLink);
                cogoToast.success("Copied frame link successfully");
              }}
              variant="contained"
            >
              Copy
            </Button>{" "}
            <StyledLink url={frameLink}>{frameLink}</StyledLink>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">
            Step 3: Create a farcaster cast, paste your frame link, and share!
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Divider style={{ width: "100%" }} />
          <Typography variant="body1">
            <b>Running into issues?</b>
          </Typography>
          <Typography variant="body2">
            1. No background image displays on the frame: Frame generation
            relies on a PNG/JPEG collection image existing for the particular
            NFT collection on OpenSea. If this does not exist on OpenSea, no
            background image will display.
            <br />
            2. "No collection found" displays on the frame: This frame only
            works for collections public exposed via the OpenSea API. If the
            OpenSea collection URL does not point to a valid collection viewable
            on OpenSea, the frame generation will not work properly and you will
            see the no collection found error.
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          container
          justifyContent={"center"}
          style={{ textAlign: "center" }}
        >
          <Grid item xs={12} sm={8}>
            <Typography variant="caption">
              This project was created and is provided open-source by Aspyn (
              <StyledLink url={"https://warpcast.com/aspyn"}>
                warpcast
              </StyledLink>
              ,{" "}
              <StyledLink url={"https://twitter.com/AspynPalatnick"}>
                twitter
              </StyledLink>
              ). The source code for this project can be found on{" "}
              <StyledLink
                url={"https://github.com/stuckinaboot/farcaster-frames"}
              >
                GitHub
              </StyledLink>
              . Use this project at your own risk and discretion. While this
              project is powered by the public OpenSea API, this is not an
              official OpenSea tool.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
