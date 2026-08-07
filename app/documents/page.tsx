import type { Metadata } from "next";
import { DocumentsPage } from "../components/Pages";

export const metadata: Metadata = { title: "Documents & Links" };
export const dynamic = "force-static";
export default function Page() { return <DocumentsPage />; }
