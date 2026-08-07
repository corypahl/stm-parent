import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteShell } from "./components/SiteShell";

export const dynamic = "force-static";

const description = "An unofficial parent-created companion for St. Martha School news, events, deadlines, lunch, documents, and handbook search.";
const imageUrl = "https://corypahl.github.io/stm-parent/og.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://corypahl.github.io/stm-parent/"),
  title: {
    default: "St. Martha School · Unofficial Parent Site",
    template: "%s · St. Martha School Unofficial Parent Site",
  },
  description,
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
