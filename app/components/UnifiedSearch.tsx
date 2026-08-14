"use client";

import { useMemo, useRef, useState } from "react";
import { askParentSiteAi, type AiSearchAnswer, type AiSearchCitation } from "../lib/ai-search";
import { sitePath } from "../lib/site-path";
import { searchUnifiedIndex, type UnifiedSearchEntry, type UnifiedSearchResult } from "../lib/unified-search";

type AnswerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "complete"; value: AiSearchAnswer }
  | { status: "error"; message: string };

const suggestions = [
  "When is the first day of school?",
  "What is the attendance policy?",
  "Are there any sign ups?",
];

export function UnifiedSearch({ entries }: { entries: UnifiedSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<AnswerState>({ status: "idle" });
  const requestId = useRef(0);
  const trimmedQuery = query.trim();
  const results = useMemo(() => searchUnifiedIndex(entries, trimmedQuery), [entries, trimmedQuery]);
  const showResults = trimmedQuery.length >= 2;

  const resultHref = (result: UnifiedSearchResult) => `${sitePath(result.path)}#${encodeURIComponent(result.hash)}`;
  const askQuestion = async (question: string) => {
    const normalized = question.trim();
    if (normalized.length < 2) return;
    const matchingResults = searchUnifiedIndex(entries, normalized);
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setAnswer({ status: "loading" });
    try {
      const value = await askParentSiteAi(normalized, matchingResults, resultHref);
      if (requestId.current === currentRequest) setAnswer({ status: "complete", value });
    } catch (error) {
      if (requestId.current === currentRequest) {
        setAnswer({ status: "error", message: error instanceof Error ? error.message : "The AI answer is temporarily unavailable." });
      }
    }
  };
  const updateQuery = (value: string) => {
    requestId.current += 1;
    setQuery(value);
    setAnswer({ status: "idle" });
  };

  return (
    <section className="unified-search" aria-labelledby="unified-search-title">
      <div className="unified-search__intro">
        <div>
          <span className="eyebrow eyebrow--light">Newsletters · handbook · calendar</span>
          <h1 id="unified-search-title">Search school information</h1>
        </div>
        <p>Search all three sources at once, or ask a question for a short answer linked to the supporting information.</p>
      </div>
      <form className="unified-search__form" onSubmit={(event) => { event.preventDefault(); void askQuestion(trimmedQuery); }}>
        <label htmlFor="unified-search-input" className="sr-only">Search newsletters, handbook, and calendar</label>
        <span aria-hidden="true">⌕</span>
        <input
          id="unified-search-input"
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search or ask a question…"
          autoComplete="off"
        />
        <button type="submit" disabled={trimmedQuery.length < 2 || answer.status === "loading"}>
          {answer.status === "loading" ? "Thinking…" : "Ask AI"}
        </button>
      </form>
      <div className="unified-search__suggestions" aria-label="Suggested questions">
        {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => { updateQuery(suggestion); void askQuestion(suggestion); }}>{suggestion}</button>)}
      </div>
      <p className="unified-search__privacy">AI answers use Gemini and may make mistakes. Do not enter private student information. Always verify important details with the linked school source.</p>

      <div className="unified-search__response" aria-live="polite" aria-busy={answer.status === "loading"}>
        {answer.status === "loading" && <div className="ai-answer ai-answer--loading"><span className="ai-answer__spark" aria-hidden="true">✦</span><div><strong>Reviewing the matching sources…</strong><p>Gemini is using only the excerpts found in this site.</p></div></div>}
        {answer.status === "error" && <div className="ai-answer ai-answer--error" role="status"><strong>AI answer unavailable</strong><p>{answer.message}</p></div>}
        {answer.status === "complete" && <AiAnswer answer={answer.value} />}
      </div>

      {showResults && (
        <div className="unified-results">
          <div className="unified-results__heading">
            <h2>Matching sources</h2>
            <span>{results.length} {results.length === 1 ? "result" : "results"}</span>
          </div>
          {results.length ? <div className="unified-results__list">{results.map((result) => (
            <a className="unified-result" href={resultHref(result)} key={result.id}>
              <span className={`unified-result__type unified-result__type--${result.kind}`}>{result.kindLabel}</span>
              <span className="unified-result__body"><strong>{result.title}</strong><small>{result.subtitle}</small><span>{result.snippet}</span></span>
              <span className="unified-result__arrow" aria-hidden="true">→</span>
            </a>
          ))}</div> : <p className="unified-results__empty">No matching information was found. Try a shorter or more general search.</p>}
        </div>
      )}
    </section>
  );
}

function AiAnswer({ answer }: { answer: AiSearchAnswer }) {
  return (
    <article className="ai-answer">
      <div className="ai-answer__heading"><span className="ai-answer__spark" aria-hidden="true">✦</span><div><span className="eyebrow">AI answer</span><h2>{answer.insufficientEvidence ? "Not enough information found" : "Answer from school sources"}</h2></div></div>
      <div className="ai-answer__text"><CitedAnswerText text={answer.answer} citations={answer.citations} /></div>
      {answer.citations.length > 0 && <ol className="ai-citations" aria-label="Sources used in this answer">{answer.citations.map((citation, index) => (
        <li id={`ai-citation-${citation.id}`} key={citation.id}><a href={citation.href}><span>{index + 1}</span><div><strong>{citation.title}</strong><small>{citation.kindLabel} · {citation.subtitle}</small></div></a></li>
      ))}</ol>}
      <p className="ai-answer__note">Generated with {answer.model}. Verify dates, policies, and requirements in the cited source.</p>
    </article>
  );
}

function CitedAnswerText({ text, citations }: { text: string; citations: AiSearchCitation[] }) {
  const citationNumber = new Map(citations.map((citation, index) => [citation.id, index + 1]));
  return <>{text.split(/\n+/).filter(Boolean).map((paragraph, paragraphIndex) => (
    <p key={`${paragraph.slice(0, 30)}-${paragraphIndex}`}>{paragraph.split(/(\[S\d+\])/g).map((part, partIndex) => {
      const id = part.match(/^\[(S\d+)\]$/)?.[1];
      const number = id ? citationNumber.get(id) : undefined;
      return number ? <a className="ai-citation-marker" href={`#ai-citation-${id}`} aria-label={`Source ${number}`} key={`${part}-${partIndex}`}>[{number}]</a> : part;
    })}</p>
  ))}</>;
}
