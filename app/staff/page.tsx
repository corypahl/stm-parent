import type { Metadata } from "next";
import { StaffPage } from "../components/Pages";

export const metadata: Metadata = { title: "School Staff" };
export const dynamic = "force-static";
export default function Page() { return <StaffPage />; }
