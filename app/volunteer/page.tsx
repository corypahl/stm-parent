import type { Metadata } from "next";
import { VolunteerPage } from "../components/Pages";

export const metadata: Metadata = { title: "Volunteer" };
export const dynamic = "force-static";
export default function Page() { return <VolunteerPage />; }
