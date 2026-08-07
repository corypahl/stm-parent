import type { Metadata } from "next";
import { EventsPage } from "../components/Pages";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-static";
export default function Page() { return <EventsPage />; }
