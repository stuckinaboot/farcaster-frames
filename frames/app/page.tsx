import { getFrameMetadata } from "frog/next";
import type { Metadata } from "next";

import styles from "./page.module.css";
import FloorStoreFrameGenerator from "./components/FloorStoreFrameGenerator";

export async function generateMetadata(): Promise<Metadata> {
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || "http://localhost:3000"}/api`
  );
  return {
    other: frameTags,
  };
}

export default function Home() {
  return (
    <main className={styles.main} style={{ width: "100%" }}>
      <FloorStoreFrameGenerator />
    </main>
  );
}
