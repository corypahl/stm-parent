"use client";

import type { ContentItem } from "../types/content";
import { formatGradeLabel } from "../lib/filtering";
import { formatDate, formatTime } from "../lib/format";

const statusLabel: Record<string, string> = {
  open: "Open",
  closing_soon: "Closing soon",
  due_today: "Due today",
  closed: "Closed",
  unknown: "Status unknown",
};

export function ContentCard({ item, compact = false }: { item: ContentItem; compact?: boolean }) {
  const date = item.deadlineAt ?? item.startAt;
  const dateLabel = item.deadlineAt ? "Due" : item.startAt ? "When" : undefined;

  return (
    <article className={`content-card ${compact ? "content-card--compact" : ""}`}>
      <div className="content-card__topline">
        <span className="content-type">{item.categoryTags[0] ?? item.contentType}</span>
        <div className="badge-row">
          {item.isDemo && <span className="badge badge--demo">Sample</span>}
          {item.actionStatus && (
            <span className={`badge badge--${item.actionStatus}`}>
              {statusLabel[item.actionStatus]}
            </span>
          )}
        </div>
      </div>
      <h3>{item.title}</h3>
      {item.summary && <p className="content-card__summary">{item.summary}</p>}
      {(date || item.location) && (
        <dl className="content-card__details">
          {date && (
            <div>
              <dt>{dateLabel}</dt>
              <dd>
                {formatDate(date)}
                {item.startAt && <> · {formatTime(item.startAt)}</>}
              </dd>
            </div>
          )}
          {item.location && (
            <div>
              <dt>Where</dt>
              <dd>{item.location}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="tag-list" aria-label="Applicable grades">
        {item.gradeTags.map((grade) => (
          <span key={grade}>{formatGradeLabel(grade)}</span>
        ))}
      </div>
      <div className="content-card__footer">
        <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
          Source: {item.sourceLabel} <span aria-hidden="true">↗</span>
        </a>
        {item.actionUrl && (
          <a className="button button--small" href={item.actionUrl} target="_blank" rel="noreferrer">
            {item.actionLabel ?? "Take action"} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
