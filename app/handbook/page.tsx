import type { Metadata } from "next";
import { HandbookPage } from "../components/Pages";

export const metadata: Metadata = { title: "Handbook Search" };
export const dynamic = "force-static";
export default function Page() { return <HandbookPage />; }
