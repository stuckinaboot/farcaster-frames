import { getFrameMetadata } from "frog/next";
import type { Metadata } from "next";

import styles from "./page.module.css";
import { Button, Grid, TextField, Typography } from "@mui/material";

export async function generateMetadata(): Promise<Metadata> {
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || "http://localhost:3000"}/api`
  );
  return {
    other: frameTags,
  };
}

export default function Home() {
  let val;
  let frameLink;
  return (
    <main className={styles.main} style={{ width: "100%" }}>
      <Grid container justifyContent={"center"} spacing="4">
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Typography variant="h4">Generate Floor Store Frame</Typography>
        </Grid>
        <Grid container item xs={12} justifyContent={"center"}>
          <Grid item xs={10} sm={6}>
            <TextField
              variant="standard"
              label="OpenSea Collection URL"
              fullWidth
              onChange={(e) => {
                val = e.target.value;
                frameLink = e.target.value;
              }}
            />
          </Grid>
        </Grid>
        <Grid container item xs={12} justifyContent={"center"}>
          <Grid item>
            <Button variant="contained">Generate Floor Store frame</Button>
          </Grid>
        </Grid>
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Typography>Link to your frame:</Typography>
          <Typography>
            <a href={frameLink}>{frameLink}</a>
          </Typography>
        </Grid>
      </Grid>
    </main>
  );
}
