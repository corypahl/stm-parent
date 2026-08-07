import type { Metadata } from "next";
import { LunchPage } from "../components/Pages";

export const metadata: Metadata = { title: "Lunch Menu" };
export const dynamic = "force-static";
export default function Page() { return <LunchPage />; }
