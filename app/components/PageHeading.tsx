import type { ReactNode } from "react";
import { sitePath } from "../lib/site-path";

export function PageHeading({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow eyebrow--accent">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside && <div className="page-heading__aside">{aside}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  count,
  link,
}: {
  eyebrow?: string;
  title: string;
  count?: number;
  link?: { href: string; label: string };
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>
          {title} {count !== undefined && <span className="count">{count}</span>}
        </h2>
      </div>
      {link && <a href={sitePath(link.href)}>{link.label} <span aria-hidden="true">→</span></a>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
