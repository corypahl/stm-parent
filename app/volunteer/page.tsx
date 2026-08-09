import type { Metadata } from "next";
import { SignUpsPage } from "../components/Pages";

export const metadata: Metadata = { title: "Sign Ups" };
export const dynamic = "force-static";
export default function Page() { return <SignUpsPage />; }
