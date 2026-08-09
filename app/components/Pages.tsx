"use client";

import { useState } from "react";
import contentData from "../data/content.json";
import googleContentData from "../data/google-content.json";
import googleNewsletterData from "../data/google-newsletters.json";
import latestNewsletterData from "../data/latest-newsletter.json";
import documentData from "../data/documents.json";
import lunchData from "../data/lunch.json";
import handbookData from "../data/handbook.json";
import calendarData from "../data/calendar.json";
import staffData from "../data/staff.json";
import type {
  CalendarEvent,
  ContentItem,
  HandbookSection,
  LunchDay,
  LatestNewsletter,
  NewsletterSummary,
  SchoolDocument,
  StaffMember,
} from "../types/content";
import { formatDate, formatGradeLabel } from "../lib/format";
import { googleCalendar } from "../lib/google-calendar";
import { smoreEmbedUrl } from "../lib/newsletters";
import { assetPath } from "../lib/site-path";
import { ContentCard } from "./ContentCard";
import { EmptyState, PageHeading, SectionHeading } from "./PageHeading";

const contentItems = [...(googleContentData as ContentItem[]), ...(contentData as ContentItem[])];
const documents = documentData as SchoolDocument[];
const lunchDays = lunchData as LunchDay[];
const handbookSections = handbookData as HandbookSection[];
const newsletters = (googleNewsletterData as NewsletterSummary[]).sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate));
const latestNewsletter = latestNewsletterData as LatestNewsletter | null;
const calendarEvents = calendarData as CalendarEvent[];
const staffMembers = staffData as StaffMember[];

const calendarCategories = ["All", "School day", "No school", "Family event", "Faith", "Academic"] as const;
const staffGroups: StaffMember["group"][] = ["Leadership & office", "Homeroom teachers", "Specials", "Support staff"];

function formatCalendarDate(value: string, options: Intl.DateTimeFormatOptions) {
  return formatDate(`${value}T12:00:00`, options);
}

function formatCalendarRange(event: CalendarEvent) {
  const start = formatCalendarDate(event.date, { month: "short", day: "numeric" });
  if (!event.endDate) return start;
  const end = formatCalendarDate(event.endDate, { month: "short", day: "numeric" });
  return `${start}–${end}`;
}

function visibleItems(types?: ContentItem["contentType"][]) {
  return contentItems.filter(
    (item) => item.status === "published" && (!types || types.includes(item.contentType)),
  );
}

function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="notice notice--demo" role="note">
      <span className="notice__icon" aria-hidden="true">i</span>
      <div>
        <strong>Prototype content</strong>
        <p>{children ?? "Items labeled Sample demonstrate the experience and are not official school announcements."}</p>
      </div>
    </div>
  );
}

function CardGrid({ items }: { items: ContentItem[] }) {
  if (items.length === 0) {
    return <EmptyState>No items are available right now.</EmptyState>;
  }
  return (
    <div className="card-grid">
      {items.map((item) => <ContentCard key={item.id} item={item} />)}
    </div>
  );
}

export function HomePage() {
  const upcomingEvents = calendarEvents.slice(0, 3);
  const embedUrl = latestNewsletter ? smoreEmbedUrl(latestNewsletter.sourceUrl) : undefined;

  return (
    <>
      <section className="home-section home-section--first">
        <div>
          <SectionHeading eyebrow="Coming up" title="On the calendar" count={upcomingEvents.length} link={{ href: "/calendar", label: "Full calendar" }} />
          <div className="calendar-preview">
            {upcomingEvents.map((event) => (
              <article className="calendar-entry" key={event.id}>
                <time dateTime={event.date}>
                  <span>{formatCalendarDate(event.date, { month: "short" })}</span>
                  <strong>{formatCalendarDate(event.date, { day: "numeric" })}</strong>
                </time>
                <div>
                  <div className="badge-row"><span className={`badge calendar-category calendar-category--${event.category.toLowerCase().replaceAll(" ", "-")}`}>{event.category}</span>{event.endDate && <span className="date-range">{formatCalendarRange(event)}</span>}</div>
                  <h3>{event.title}</h3>
                  {(event.time || event.details) && <p>{[event.time, event.details].filter(Boolean).join(" · ")}</p>}
                </div>
              </article>
            ))}
          </div>
          <p className="preview-source">Source: St. Martha 2026–27 Academic Calendar</p>
        </div>
      </section>

      <section className="home-section">
        <SectionHeading eyebrow="School updates" title="Latest school newsletter" />
        {latestNewsletter && embedUrl ? (
          <article className="newsletter-embed">
            <header className="newsletter-embed__header">
              <div>
                <span className="eyebrow">Latest issue</span>
                <h2>{latestNewsletter.title}</h2>
                <p>{formatDate(`${latestNewsletter.newsletterDate}T12:00:00`, { month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
              <a className="button button--small" href={latestNewsletter.sourceUrl} target="_blank" rel="noreferrer">Open newsletter ↗</a>
            </header>
            <div className="newsletter-embed__frame">
              <iframe
                src={embedUrl}
                title={`${latestNewsletter.title} embedded newsletter`}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="newsletter-embed__note">Embedded from Smore. Use the button above if the newsletter does not load on your device.</p>
          </article>
        ) : <EmptyState>The latest newsletter will appear here after an email containing a Smore link reaches the inbox.</EmptyState>}
      </section>
    </>
  );
}

export function ActionPage() {
  const items = visibleItems(["action", "deadline", "form", "signup"])
    .sort((a, b) => (a.deadlineAt ?? "9999").localeCompare(b.deadlineAt ?? "9999"));
  return (
    <>
      <PageHeading eyebrow="Parent to-do list" title="Needs action" description="Open forms, permissions, registrations, and signups—ordered by the date they are due." aside={<div className="heading-stat"><strong>{items.length}</strong><span>open for your grades</span></div>} />
      <DemoNotice />
      <div className="legend" aria-label="Status legend"><span><i className="dot dot--open" /> Open</span><span><i className="dot dot--soon" /> Closing soon</span></div>
      <CardGrid items={items} />
    </>
  );
}

export function EventsPage() {
  return <CalendarPage />;
}

export function CalendarPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof calendarCategories)[number]>("All");
  const normalized = query.trim().toLowerCase();
  const visible = calendarEvents.filter((event) => {
    const matchesCategory = category === "All" || event.category === category;
    const matchesQuery = !normalized || `${event.title} ${event.details ?? ""} ${event.time ?? ""} ${event.category}`.toLowerCase().includes(normalized);
    return matchesCategory && matchesQuery;
  });
  const months = Array.from(new Set(visible.map((event) => event.date.slice(0, 7))));
  const calendarPdf = assetPath("/documents/2026-27-academic-calendar.pdf");

  return (
    <>
      <PageHeading
        eyebrow="2026–27 school year"
        title="Academic calendar"
        description="Every date from the school-issued calendar, with a live Google Calendar that families can subscribe to for future updates."
        aside={<a className="button" href={calendarPdf} target="_blank" rel="noreferrer">Download calendar PDF ↗</a>}
      />
      <section className="calendar-subscribe" aria-labelledby="calendar-subscribe-title">
        <div>
          <span className="eyebrow eyebrow--light">Stay up to date</span>
          <h2 id="calendar-subscribe-title">Add school events to your calendar.</h2>
          <p>Subscribe once and approved event updates will appear in your calendar automatically.</p>
        </div>
        <div className="calendar-subscribe__actions">
          <a className="button button--light" href={googleCalendar.subscribeUrl} target="_blank" rel="noreferrer">Subscribe with Google ↗</a>
          <a className="button button--ghost-light" href={googleCalendar.publicIcalUrl}>Apple or Outlook (.ics)</a>
        </div>
      </section>
      <div className="source-banner" role="note">
        <div><strong>School-issued calendar</strong><span>Updated July 29, 2026</span></div>
        <p>The source notes that dates may change during the school year. Check school communications before making plans.</p>
      </div>
      <div className="calendar-toolbar">
        <label className="search-box calendar-search">
          <span className="search-box__icon" aria-hidden="true">⌕</span>
          <span className="sr-only">Search calendar</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search breaks, conferences, concerts…" />
        </label>
        <label className="select-field">
          <span>Show</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof calendarCategories)[number])}>
            {calendarCategories.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">Showing {visible.length} of {calendarEvents.length} calendar entries</p>
      <div className="calendar-months">
        {months.length ? months.map((month) => {
          const events = visible.filter((event) => event.date.startsWith(month));
          return (
            <section className="calendar-month" key={month}>
              <div className="calendar-month__heading">
                <span>{formatCalendarDate(`${month}-01`, { year: "numeric" })}</span>
                <h2>{formatCalendarDate(`${month}-01`, { month: "long" })}</h2>
              </div>
              <div className="calendar-month__events">
                {events.map((event) => (
                  <article className="calendar-entry" key={event.id}>
                    <time dateTime={event.date}>
                      <span>{formatCalendarDate(event.date, { weekday: "short" })}</span>
                      <strong>{formatCalendarDate(event.date, { day: "numeric" })}</strong>
                    </time>
                    <div>
                      <div className="badge-row"><span className={`badge calendar-category calendar-category--${event.category.toLowerCase().replaceAll(" ", "-")}`}>{event.category}</span>{event.endDate && <span className="date-range">{formatCalendarRange(event)}</span>}</div>
                      <h3>{event.title}</h3>
                      {(event.time || event.details) && <p>{[event.time, event.details].filter(Boolean).join(" · ")}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        }) : <EmptyState>No calendar entries match that search and filter.</EmptyState>}
      </div>
      <div className="source-footer">
        <span>Source: St. Martha 2026–27 Academic Calendar</span>
        <a className="source-link" href={calendarPdf} target="_blank" rel="noreferrer">Open the original PDF ↗</a>
      </div>
    </>
  );
}

export function StaffPage() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = staffMembers.filter((member) => `${member.name} ${member.group} ${member.roles.join(" ")}`.toLowerCase().includes(normalized));

  return (
    <>
      <PageHeading
        eyebrow="People who make the school go"
        title="Contacts"
        description="Find teachers, school leadership, specialists, and support staff, with direct contact details where the school publishes them."
        aside={<a className="button" href="https://st-martha.org/staff-school" target="_blank" rel="noreferrer">Official staff directory ↗</a>}
      />
      <div className="source-banner" role="note">
        <div><strong>{staffMembers.length} staff members</strong><span>Verified August 7, 2026</span></div>
        <p>Roles and contact details come from the official school directory. Use that directory as the authority for later changes.</p>
      </div>
      <label className="search-box staff-search">
        <span className="search-box__icon" aria-hidden="true">⌕</span>
        <span className="sr-only">Search school staff</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a name, grade, or subject…" />
      </label>
      <div className="staff-directory" aria-live="polite">
        {staffGroups.map((group) => {
          const members = visible.filter((member) => member.group === group);
          if (!members.length) return null;
          return (
            <section className="staff-section" key={group}>
              <SectionHeading title={group} count={members.length} />
              <div className="staff-grid">
                {members.map((member) => (
                  <article className="staff-card" key={member.id}>
                    <div className="staff-card__monogram" aria-hidden="true">{member.name.split(" ").filter((part) => !part.includes(".")).map((part) => part[0]).slice(0, 2).join("")}</div>
                    <div className="staff-card__body">
                      <h3>{member.name}</h3>
                      <p>{member.roles.join(" · ")}</p>
                      {(member.email || member.phone) && <div className="staff-card__contact">
                        {member.email && <a href={`mailto:${member.email}`}>Email</a>}
                        {member.phone && <a href={`tel:+1${member.phone.replace(/\D/g, "")}`}>{member.phone}</a>}
                      </div>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {!visible.length && <EmptyState>No staff members match that search.</EmptyState>}
      </div>
      <div className="source-footer">
        <span>Source: official St. Martha School staff directory</span>
        <a className="source-link" href="https://st-martha.org/staff-school" target="_blank" rel="noreferrer">View official directory ↗</a>
      </div>
    </>
  );
}

export function SignUpsPage() {
  const newsletter = newsletters[0];
  const signups = newsletter?.signups ?? [];

  return (
    <>
      <PageHeading eyebrow="Forms and opportunities" title="Sign Ups" description="Signup, RSVP, registration, and volunteer forms extracted automatically from the latest school newsletter." />
      {newsletter && <div className="signup-source"><span>From</span><strong>{newsletter.title}</strong><time dateTime={newsletter.newsletterDate}>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { month: "long", day: "numeric", year: "numeric" })}</time></div>}
      {signups.length > 0
        ? <div className="signup-grid">{signups.map((signup) => <article className="signup-card" key={signup.id}><span className="eyebrow">Newsletter form</span><h2>{signup.title}</h2><p>Found automatically in {newsletter.title}.</p><div className="signup-card__actions"><a className="source-link" href={newsletter.sourceUrl} target="_blank" rel="noreferrer">Newsletter source ↗</a><a className="button button--small" href={signup.url} target="_blank" rel="noreferrer">Open form ↗</a></div></article>)}</div>
        : <EmptyState>No signup form links were found in the latest newsletter.</EmptyState>}
    </>
  );
}

export function LunchPage() {
  const [view, setView] = useState<"today" | "week" | "month">("month");
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Detroit",
  }).formatToParts(new Date()).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {} as Record<string, string>);
  const todayKey = `${today.year}-${today.month}-${today.day}`;
  const weekStart = new Date(`${todayKey}T12:00:00Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const shown = lunchDays.filter((day) => {
    const key = day.date.slice(0, 10);
    if (view === "today") return key === todayKey;
    if (view === "week") return key >= weekStart.toISOString().slice(0, 10) && key <= weekEnd.toISOString().slice(0, 10);
    return true;
  });
  const menu = lunchDays[0];
  const menuLabel = menu ? formatDate(menu.date, { month: "long", year: "numeric" }) : "Lunch menu";
  return (
    <>
      <PageHeading eyebrow="What’s for lunch?" title="Lunch menu" description="A phone-friendly transcription of the school lunch calendar published in News Notes." aside={menu && <a className="button" href={menu.sourceImageUrl || menu.sourceUrl} target="_blank" rel="noreferrer">View original menu ↗</a>} />
      {menu && <div className="source-banner lunch-source" role="note">
        <div><strong>{menuLabel}</strong><span>{lunchDays.length} dated entries</span></div>
        <p>Automatically transcribed from {menu.sourceNewsletterTitle || "News Notes"}. OCR wording may contain errors, and the source says the menu may change without notice. All meals come with milk.</p>
      </div>}
      <div className="segmented" role="group" aria-label="Lunch menu view">
        {(["today", "week", "month"] as const).map((option) => <button type="button" key={option} className={view === option ? "active" : ""} aria-pressed={view === option} onClick={() => setView(option)}>{option === "week" ? "This week" : option === "month" ? "Full month" : "Today"}</button>)}
      </div>
      {shown.length ? <div className="lunch-grid">
        {shown.map((day) => {
          const unavailable = /^(?:No school|No hot lunch)$/i.test(day.mainEntree);
          return <article className={`lunch-card ${unavailable ? "lunch-card--unavailable" : ""}`} key={day.date}>
            <div className="lunch-card__date"><span>{formatDate(day.date, { weekday: "long" })}</span><strong>{formatDate(day.date, { month: "short", day: "numeric" })}</strong></div>
            {unavailable && <span className="badge">Schedule change</span>}
            <h2>{day.mainEntree}</h2>
            {day.sides.length > 0 && <p><strong>Sides:</strong> {day.sides.join(" · ")}</p>}
            {day.notes && <p className="muted">{day.notes}</p>}
          </article>
        })}
      </div> : <EmptyState>No {view === "today" ? "lunch entry for today" : "lunch entries for this week"} appear in the imported {menuLabel} menu. Choose Full month to browse it.</EmptyState>}
      {menu && <div className="source-footer">
        <span>Source: {menu.sourceNewsletterTitle || "St. Martha News Notes"}</span>
        <a className="source-link" href={menu.sourceUrl} target="_blank" rel="noreferrer">Open source newsletter ↗</a>
      </div>}
    </>
  );
}

export function DocumentsPage() {
  const [query, setQuery] = useState("");
  const visible = documents.filter((document) => `${document.title} ${document.description} ${document.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageHeading eyebrow="The family file cabinet" title="Documents & links" description="Frequently used school resources, kept with their school year, source, and last-verified date." />
      <label className="search-box"><span className="search-box__icon" aria-hidden="true">⌕</span><span className="sr-only">Search documents</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search calendars, policies, forms…" /></label>
      <div className="document-list">
        {visible.map((document) => (
          <article className="document-row" key={document.id}>
            <div className="file-mark" aria-hidden="true">{document.fileType === "PDF" ? "PDF" : "LINK"}</div>
            <div className="document-row__body"><span className="eyebrow">{document.category}</span><h2>{document.title}</h2><p>{document.description}</p><div className="tag-list">{document.gradeTags.map((grade) => <span key={grade}>{formatGradeLabel(grade)}</span>)}{document.schoolYear && <span>{document.schoolYear}</span>}<span>Verified {formatDate(document.lastVerifiedAt)}</span></div></div>
            <a className="button button--small" href={document.sourceUrl.startsWith("/") ? assetPath(document.sourceUrl) : document.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a>
          </article>
        ))}
      </div>
    </>
  );
}

export function HandbookPage() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  const results = handbookSections.filter((section) => !normalized || `${section.title} ${section.content}`.toLowerCase().replace(/\s+/g, " ").includes(normalized));
  const handbookPdf = assetPath("/documents/2025-26-st-martha-handbook.pdf");
  return (
    <>
      <PageHeading
        eyebrow="Search every policy"
        title="Parent & student handbook"
        description="Search and read the complete 2025–26 handbook directly on this page, organized into clear sections for phones and computers."
        aside={<a className="button" href={handbookPdf} target="_blank" rel="noreferrer">Download handbook PDF ↗</a>}
      />
      <div className="source-banner" role="note">
        <div><strong>2025–26 handbook</strong><span>33 content pages · 22 sections</span></div>
        <p>The complete handbook wording is reproduced below for convenient reading. The school-issued PDF remains the source document.</p>
      </div>
      <div className="handbook-search">
        <label><span className="sr-only">Search the handbook</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try uniform, tardy, medication…" aria-controls="handbook-sections" /></label>
        {query ? <button type="button" className="button" onClick={() => setQuery("")}>Clear</button> : <span className="handbook-search__label">Search</span>}
      </div>
      <div className="suggestion-row" aria-label="Suggested searches">{["uniform", "tardy", "medication", "cell phone", "volunteer", "Kids' Corner"].map((term) => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}</div>
      <div className="handbook-reader" aria-live="polite">
        <aside className="handbook-contents" aria-label={normalized ? "Matching handbook sections" : "Handbook contents"}>
          <span className="eyebrow">{normalized ? "Search results" : "On this page"}</span>
          <h2>{normalized ? `${results.length} matching ${results.length === 1 ? "section" : "sections"}` : "Handbook contents"}</h2>
          {results.length > 0 && <nav><ol>{results.map((section) => <li key={section.id}><a href={`#handbook-${section.id}`}>{section.title}<span>{formatHandbookPages(section.pageStart, section.pageEnd)}</span></a></li>)}</ol></nav>}
        </aside>
        <div className="handbook-sections" id="handbook-sections">
          {results.length ? results.map((section) => (
            <article className="handbook-section" id={`handbook-${section.id}`} key={section.id}>
              <header className="handbook-section__header">
                <div><span className="eyebrow">Handbook section</span><h2>{section.title}</h2></div>
                <span className="page-cite">{formatHandbookPages(section.pageStart, section.pageEnd)}</span>
              </header>
              <HandbookSectionContent section={section} query={normalized} />
            </article>
          )) : <EmptyState>No handbook sections match that search. Try a broader term or one of the suggestions.</EmptyState>}
        </div>
      </div>
      <div className="source-footer">
        <span>Source: St. Martha Parent and Student Handbook 2025–2026</span>
        <a className="source-link" href={handbookPdf} target="_blank" rel="noreferrer">Open the complete PDF ↗</a>
      </div>
    </>
  );
}

type HandbookBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function formatHandbookPages(pageStart: number, pageEnd: number) {
  return pageEnd > pageStart ? `Pages ${pageStart}–${pageEnd}` : `Page ${pageStart}`;
}

function parseHandbookContent(section: HandbookSection): HandbookBlock[] {
  const headings = new Set(section.subheadings);
  const blocks: HandbookBlock[] = [];
  let paragraph: string[] = [];
  let list: Extract<HandbookBlock, { type: "list" }> | undefined;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = undefined;
  };

  for (const rawLine of section.content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (headings.has(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line });
      continue;
    }
    const listMatch = line.match(/^([•*]|\d+\.)\s*(.+)$/);
    if (listMatch) {
      flushParagraph();
      const ordered = /^\d/.test(listMatch[1]);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { type: "list", ordered, items: [] };
      }
      list.items.push(listMatch[2]);
      continue;
    }
    if (list?.items.length) {
      list.items[list.items.length - 1] += ` ${line}`;
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return <>{parts.map((part, index) => part.toLowerCase() === query ? <mark key={`${part}-${index}`}>{part}</mark> : part)}</>;
}

function HandbookSectionContent({ section, query }: { section: HandbookSection; query: string }) {
  const blocks = parseHandbookContent(section);
  if (section.id === "staff-roster") {
    return <pre className="handbook-section__pre"><HighlightedText text={section.content} query={query} /></pre>;
  }
  return (
    <div className="handbook-section__body">
      {blocks.map((block, index) => {
        if (block.type === "heading") return <h3 key={`${block.text}-${index}`}><HighlightedText text={block.text} query={query} /></h3>;
        if (block.type === "paragraph") return <p key={`${block.text.slice(0, 30)}-${index}`}><HighlightedText text={block.text} query={query} /></p>;
        const List = block.ordered ? "ol" : "ul";
        return <List key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={`${item.slice(0, 30)}-${itemIndex}`}><HighlightedText text={item} query={query} /></li>)}</List>;
      })}
    </div>
  );
}

export function NewslettersPage() {
  const [query, setQuery] = useState("");
  const [openNewsletterId, setOpenNewsletterId] = useState<string | null>(null);
  const [readerMode, setReaderMode] = useState<"original" | "text">("original");
  const normalized = query.trim().toLowerCase();
  const filtered = newsletters.filter((newsletter) => `${newsletter.title} ${newsletter.newsletterDate} ${newsletter.textContent}`.toLowerCase().includes(normalized));
  return (
    <>
      <PageHeading eyebrow="Every issue, still findable" title="Newsletters" description="Browse every Smore newsletter in the school-updates inbox, open the original page, or read an issue without leaving this site." aside={<div className="heading-stat"><strong>{newsletters.length}</strong><span>{newsletters.length === 1 ? "newsletter" : "newsletters"}</span></div>} />
      <label className="search-box"><span className="search-box__icon" aria-hidden="true">⌕</span><span className="sr-only">Search newsletters</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search newsletters…" /></label>
      <div className="archive-list">
        {filtered.map((newsletter) => {
          const embedUrl = smoreEmbedUrl(newsletter.sourceUrl);
          const isOpen = openNewsletterId === newsletter.id;
          const searchText = newsletter.textContent.toLowerCase();
          const matchIndex = normalized ? searchText.indexOf(normalized) : -1;
          const excerpt = matchIndex >= 0
            ? newsletter.textContent.slice(Math.max(0, matchIndex - 90), Math.min(newsletter.textContent.length, matchIndex + normalized.length + 150)).replace(/\s+/g, " ")
            : "";
          const openReader = (mode: "original" | "text") => {
            if (isOpen && readerMode === mode) {
              setOpenNewsletterId(null);
              return;
            }
            setOpenNewsletterId(newsletter.id);
            setReaderMode(mode);
          };
          return (
            <article className={`archive-newsletter ${isOpen ? "archive-newsletter--open" : ""}`} key={newsletter.id}>
              <div className="archive-row">
                <time dateTime={newsletter.newsletterDate}><strong>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { day: "2-digit" })}</strong><span>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { month: "short", year: "numeric" })}</span></time>
                <div><div className="badge-row"><span className="badge">{newsletter.id === newsletters[0]?.id ? "Latest" : "Archived"}</span>{newsletter.textStatus === "available" && <span className="badge badge--text">Searchable text</span>}</div><h2>{newsletter.title}</h2><p>School newsletter · Smore</p>{excerpt && <p className="archive-row__excerpt">…<HighlightedText text={excerpt} query={query} />…</p>}</div>
                <div className="archive-row__actions">
                  {embedUrl && <button type="button" className={`button button--small ${isOpen && readerMode === "original" ? "" : "button--outline"}`} aria-expanded={isOpen && readerMode === "original"} aria-controls={`archive-reader-${newsletter.id}`} onClick={() => openReader("original")}>{isOpen && readerMode === "original" ? "Close original" : "Read original"}</button>}
                  {newsletter.textStatus === "available" && <button type="button" className={`button button--small ${isOpen && readerMode === "text" ? "" : "button--outline"}`} aria-expanded={isOpen && readerMode === "text"} aria-controls={`archive-reader-${newsletter.id}`} onClick={() => openReader("text")}>{isOpen && readerMode === "text" ? "Close text" : "Text version"}</button>}
                  <a className="button button--small button--outline" href={newsletter.sourceUrl} target="_blank" rel="noreferrer">Open Smore ↗</a>
                </div>
              </div>
              {isOpen && readerMode === "original" && embedUrl && <div className="archive-newsletter__reader" id={`archive-reader-${newsletter.id}`}>
                <iframe src={embedUrl} title={`${newsletter.title} embedded newsletter`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
                <p>Embedded from Smore. Open the original above if this reader does not load on your device.</p>
              </div>}
              {isOpen && readerMode === "text" && newsletter.textStatus === "available" && <div className="newsletter-text" id={`archive-reader-${newsletter.id}`}>
                <div className="newsletter-text__intro"><div><span className="eyebrow">Text-only edition</span><h3>{newsletter.title}</h3></div><p>Generated automatically from Smore text and {newsletter.ocrImageCount} newsletter image{newsletter.ocrImageCount === 1 ? "" : "s"}. OCR wording may contain errors.</p></div>
                <div className="newsletter-text__sections">{newsletter.textSections.map((section, index) => <section key={`${newsletter.id}-text-${index + 1}`}><h4>{section.heading}</h4>{section.text.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p key={`${newsletter.id}-text-${index + 1}-${paragraphIndex + 1}`}><HighlightedText text={paragraph} query={query} /></p>)}</section>)}</div>
              </div>}
            </article>
          );
        })}
        {!filtered.length && <EmptyState>{query ? "No newsletters match that search." : "Smore newsletters in the inbox will appear here automatically."}</EmptyState>}
      </div>
    </>
  );
}
