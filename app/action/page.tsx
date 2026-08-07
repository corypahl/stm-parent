import type { Metadata } from "next";
import { ActionPage } from "../components/Pages";

export const metadata: Metadata = { title: "Needs Action" };
export default function Page() { return <ActionPage />; }
