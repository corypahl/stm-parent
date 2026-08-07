import type { Metadata } from "next";
import { EventsPage } from "../components/Pages";

export const metadata: Metadata = { title: "Events" };
export default function Page() { return <EventsPage />; }
