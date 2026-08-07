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
