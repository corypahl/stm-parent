import type { Metadata } from "next";
import { CalendarPage } from "../components/Pages";

export const metadata: Metadata = { title: "2026–27 Academic Calendar" };
export const dynamic = "force-static";
export default function Page() { return <CalendarPage />; }
