import type { Metadata } from "next";
import { ArchivePage } from "../components/Pages";

export const metadata: Metadata = { title: "Newsletter Archive" };
export default function Page() { return <ArchivePage />; }
