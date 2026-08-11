import type { UnifiedSearchResult } from "./unified-search";

export type AiSearchCitation = {
  id: string;
  title: string;
  subtitle: string;
  kindLabel: string;
  href: string;
};

export type AiSearchAnswer = {
  answer: string;
  citations: AiSearchCitation[];
  insufficientEvidence: boolean;
  model: string;
};

const parentSiteApiUrl = process.env.NEXT_PUBLIC_PARENT_SITE_API_URL?.trim() ?? "";

export function absoluteSourceHref(href: string, origin: string): string {
  return new URL(href, origin).href;
}

export async function askParentSiteAi(
  question: string,
  results: UnifiedSearchResult[],
  resultHref: (result: UnifiedSearchResult) => string,
): Promise<AiSearchAnswer> {
  if (!parentSiteApiUrl) throw new Error("AI answers are not configured yet. The matching sources below are still available.");

  const sourceResults = results.slice(0, 8);
  if (!sourceResults.length) {
    return {
      answer: "I couldn't find enough information in the newsletters, handbook, or calendar to answer that question.",
      citations: [],
      insufficientEvidence: true,
      model: "local-search",
    };
  }

  const citations = sourceResults.map((result, index) => ({
    id: `S${index + 1}`,
    title: result.title,
    subtitle: result.subtitle,
    kindLabel: result.kindLabel,
    href: resultHref(result),
  }));
  const sourceOrigin = window.location.origin;
  const response = await fetch(parentSiteApiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      action: "answerSearch",
      question: question.trim(),
      sources: sourceResults.map((result, index) => ({
        id: `S${index + 1}`,
        type: result.kindLabel,
        title: result.title,
        subtitle: result.subtitle,
        url: absoluteSourceHref(resultHref(result), sourceOrigin),
        text: result.context,
      })),
    }),
  });
  if (!response.ok) throw new Error("The AI answer service is temporarily unavailable. The matching sources below are still available.");

  let payload: {
    ok?: boolean;
    answer?: string;
    citations?: string[];
    insufficientEvidence?: boolean;
    model?: string;
    error?: string;
  };
  try {
    payload = await response.json();
  } catch {
    throw new Error("The AI answer service needs to be updated. The matching sources below are still available.");
  }
  if (!payload.ok || !payload.answer) {
    throw new Error(payload.error || "The AI answer service is temporarily unavailable. The matching sources below are still available.");
  }

  const citedIds = new Set(Array.isArray(payload.citations) ? payload.citations : []);
  return {
    answer: payload.answer,
    citations: citations.filter((citation) => citedIds.has(citation.id)),
    insufficientEvidence: Boolean(payload.insufficientEvidence),
    model: payload.model || "gemini-3.5-flash-lite",
  };
}
