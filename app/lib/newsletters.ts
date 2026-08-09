import type { ContentItem } from "../types/content";

export function isVolunteerSignupUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "signupgenius.com" ||
      hostname.endsWith(".signupgenius.com") ||
      hostname === "forms.gle" ||
      (hostname === "docs.google.com" && url.pathname.startsWith("/forms/"))
    );
  } catch {
    return false;
  }
}

export function getLatestNewsletterDate(items: ContentItem[]) {
  return items.reduce<string | undefined>((latest, item) => {
    if (!item.newsletterDate) return latest;
    return !latest || item.newsletterDate > latest ? item.newsletterDate : latest;
  }, undefined);
}

export function smoreEmbedUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "smore.com" && !hostname.endsWith(".smore.com")) return undefined;
    if (!/^\/n\/[a-z0-9-]+\/?$/i.test(url.pathname)) return undefined;
    return `https://secure.smore.com${url.pathname.replace(/\/$/, "")}?embed=1`;
  } catch {
    return undefined;
  }
}
