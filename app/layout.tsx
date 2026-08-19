import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteShell } from "./components/SiteShell";

export const dynamic = "force-static";

const description = "An unofficial parent-created companion for St. Martha School news, events, deadlines, lunch, documents, and handbook search.";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const imageUrl = `${siteUrl}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: "St. Martha School · Unofficial Parent Site",
    template: "%s · St. Martha School Unofficial Parent Site",
  },
  description,
  icons: {
    icon: [
      { url: `${siteUrl}/favicon.ico`, sizes: "any" },
      { url: `${siteUrl}/favicon-32.png`, type: "image/png", sizes: "32x32" },
      { url: `${siteUrl}/favicon-192.png`, type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: `${siteUrl}/apple-touch-icon.png`, type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "St. Martha School · Unofficial Parent Site",
    description,
    type: "website",
    images: [{ url: imageUrl, width: 1536, height: 1024, alt: "St. Martha School Unofficial Parent Site — Your school week, made simpler." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "St. Martha School · Unofficial Parent Site",
    description,
    images: [imageUrl],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
