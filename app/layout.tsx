import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteShell } from "./components/SiteShell";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  const description = "An unofficial parent-created companion for St. Martha School news, events, deadlines, lunch, documents, and handbook search.";

  return {
    title: {
      default: "St. Martha Parent Companion",
      template: "%s · St. Martha Parent Companion",
    },
    description,
    openGraph: {
      title: "St. Martha Parent Companion",
      description,
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "St. Martha Parent Companion — Your school week, made simpler." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "St. Martha Parent Companion",
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
