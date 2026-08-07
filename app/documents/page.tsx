import type { Metadata } from "next";
import { DocumentsPage } from "../components/Pages";

export const metadata: Metadata = { title: "Documents & Links" };
export default function Page() { return <DocumentsPage />; }
