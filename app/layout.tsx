import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteShell } from "./components/SiteShell";

export const dynamic = "force-static";

const description = "An unofficial parent-created companion for St. Martha School news, events, deadlines, lunch, documents, and handbook search.";
const imageUrl = "https://corypahl.github.io/stm-parent/og.png";
const assetUrl = "https://corypahl.github.io/stm-parent";

export const metadata: Metadata = {
  metadataBase: new URL("https://corypahl.github.io/stm-parent/"),
  title: {
    default: "St. Martha School · Unofficial Parent Site",
    template: "%s · St. Martha School Unofficial Parent Site",
  },
  description,
  icons: {
    icon: [
      { url: `${assetUrl}/favicon.ico`, sizes: "any" },
      { url: `${assetUrl}/favicon-32.png`, type: "image/png", sizes: "32x32" },
      { url: `${assetUrl}/favicon-192.png`, type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: `${assetUrl}/apple-touch-icon.png`, type: "image/png", sizes: "180x180" }],
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
