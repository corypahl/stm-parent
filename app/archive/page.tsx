import type { Metadata } from "next";
import { NewslettersPage } from "../components/Pages";

export const metadata: Metadata = { title: "Newsletters" };
export const dynamic = "force-static";
export default function Page() { return <NewslettersPage />; }
