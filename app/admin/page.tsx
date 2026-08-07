import type { Metadata } from "next";
import { AdminPage } from "../components/Pages";

export const metadata: Metadata = { title: "Admin Preview" };
export const dynamic = "force-static";
export default function Page() { return <AdminPage />; }
