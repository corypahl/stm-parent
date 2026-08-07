import type { Metadata } from "next";
import { StaffPage } from "../components/Pages";

export const metadata: Metadata = { title: "Contacts" };
export const dynamic = "force-static";
export default function Page() { return <StaffPage />; }
