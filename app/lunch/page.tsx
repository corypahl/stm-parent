import type { Metadata } from "next";
import { LunchPage } from "../components/Pages";

export const metadata: Metadata = { title: "Lunch Menu" };
export default function Page() { return <LunchPage />; }
