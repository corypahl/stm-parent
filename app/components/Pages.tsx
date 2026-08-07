"use client";

import { useMemo, useState } from "react";
import contentData from "../data/content.json";
import googleContentData from "../data/google-content.json";
import documentData from "../data/documents.json";
import lunchData from "../data/lunch.json";
import handbookData from "../data/handbook.json";
import newsletterData from "../data/newsletters.json";
import calendarData from "../data/calendar.json";
import staffData from "../data/staff.json";
import type {
  CalendarEvent,
  ContentItem,
  HandbookSection,
  LunchDay,
  NewsletterSummary,
  SchoolDocument,
  StaffMember,
} from "../types/content";
import { filterByGrades, formatGradeLabel } from "../lib/filtering";
import { formatDate } from "../lib/format";
import { googleCalendar } from "../lib/google-calendar";
import { assetPath, sitePath } from "../lib/site-path";
import { useGradeFilter } from "./GradeFilterProvider";
import { ContentCard } from "./ContentCard";
import { EmptyState, PageHeading, SectionHeading } from "./PageHeading";

const contentItems = [...(googleContentData as ContentItem[]), ...(contentData as ContentItem[])];
const documents = documentData as SchoolDocument[];
const lunchDays = lunchData as LunchDay[];
const handbookSections = handbookData as HandbookSection[];
const newsletters = newsletterData as NewsletterSummary[];
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

function useVisibleItems(types?: ContentItem["contentType"][]) {
  const { selectedGrades } = useGradeFilter();
  return useMemo(() => {
    const published = contentItems.filter(
      (item) => item.status === "published" && (!types || types.includes(item.contentType)),
    );
    return filterByGrades(published, selectedGrades);
  }, [selectedGrades, types]);
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
    return <EmptyState>No items match the selected grades. Try another grade or choose All school.</EmptyState>;
  }
  return (
    <div className="card-grid">
      {items.map((item) => <ContentCard key={item.id} item={item} />)}
    </div>
  );
}

export function HomePage() {
  const visible = useVisibleItems();
  const actions = visible.filter((item) => item.contentType === "action").slice(0, 3);
  const upcomingEvents = calendarEvents.slice(0, 3);
  const announcements = visible.filter((item) => item.contentType === "announcement").slice(0, 2);
  const volunteers = visible.filter((item) => item.contentType === "volunteer").slice(0, 2);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="eyebrow eyebrow--light">News Notes · August 7, 2026</span>
          <h1>Your school week, <em>made simpler.</em></h1>
          <p>One calm place for the dates, forms, signups, and details buried across weekly communications.</p>
          <div className="hero-actions">
            <a className="button button--light" href={sitePath("/action")}>See what needs action <span aria-hidden="true">→</span></a>
            <a className="button button--ghost-light" href="https://st-martha.org/school" target="_blank" rel="noreferrer">Official school site ↗</a>
          </div>
        </div>
        <div className="home-hero__summary" aria-label="Weekly overview">
          <span className="summary-date">At a glance</span>
          <div className="summary-stat"><strong>{actions.length}</strong><span>items need action</span></div>
          <div className="summary-stat"><strong>{upcomingEvents.length}</strong><span>upcoming events</span></div>
          <div className="summary-stat"><strong>{volunteers.length}</strong><span>ways to help</span></div>
          <span className="summary-note">Action items use your selected grades</span>
        </div>
      </section>

      <DemoNotice />

      <section className="home-section">
        <SectionHeading eyebrow="Start here" title="Needs your attention" count={actions.length} link={{ href: "/action", label: "View all" }} />
        <CardGrid items={actions} />
      </section>

      <section className="split-layout home-section">
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
        <aside className="week-card">
          <div className="week-card__header">
            <span className="eyebrow">At a glance</span>
            <h2>School day</h2>
          </div>
          <dl className="hours-list">
            <div><dt>Office</dt><dd>7:45 a.m.–3:45 p.m.</dd></div>
            <div><dt>School</dt><dd>8:00 a.m.–3:25 p.m.</dd></div>
            <div><dt>Preschool AM</dt><dd>8:00–11:30 a.m.</dd></div>
            <div><dt>Preschool full day</dt><dd>8:00 a.m.–3:20 p.m.</dd></div>
          </dl>
          <a className="source-link source-link--light" href="https://st-martha.org/school" target="_blank" rel="noreferrer">Source: official school hours ↗</a>
        </aside>
      </section>

      <section className="home-section">
        <SectionHeading eyebrow="Good to know" title="School updates" />
        <div className="card-grid card-grid--two">
          {announcements.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="home-section">
        <div className="cta-panel">
          <div>
            <span className="eyebrow eyebrow--light">Parent service organization</span>
            <h2>There’s a way for every family to help.</h2>
            <p>The official parent involvement page describes opportunities in classrooms, the lunchroom, events, athletics, and behind the scenes.</p>
          </div>
          <a className="button button--light" href={sitePath("/volunteer")}>Explore opportunities <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </>
  );
}

export function ActionPage() {
  const items = useVisibleItems(["action", "deadline", "form", "signup"])
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

export function VolunteerPage() {
  const items = useVisibleItems(["volunteer", "signup"]);
  return (
    <>
      <PageHeading eyebrow="Lend a hand" title="Volunteer" description="Find current ways to support students and staff, with the deadline and original signup source close at hand." aside={<a className="button" href="https://st-martha.org/parent-service-organizations" target="_blank" rel="noreferrer">About parent involvement ↗</a>} />
      <div className="fact-strip">
        <div><strong>20 hours</strong><span>per family</span></div>
        <div><strong>10 hours</strong><span>preschool-only or single-parent families</span></div>
        <p>These expectations are stated on the official parent involvement page. Confirm any updates with the school.</p>
      </div>
      <DemoNotice />
      <CardGrid items={items} />
    </>
  );
}

export function LunchPage() {
  const [view, setView] = useState<"today" | "week" | "month">("week");
  const shown = view === "today" ? lunchDays.slice(0, 1) : lunchDays;
  return (
    <>
      <PageHeading eyebrow="What’s for lunch?" title="Lunch menu" description="A phone-friendly menu view designed to replace pinching and zooming on an image or PDF." aside={<a className="button" href="https://st-martha.org/school" target="_blank" rel="noreferrer">Check official source ↗</a>} />
      <DemoNotice>Every entrée below is demonstration data. No current official lunch menu was supplied for this prototype.</DemoNotice>
      <div className="segmented" role="group" aria-label="Lunch menu view">
        {(["today", "week", "month"] as const).map((option) => <button type="button" key={option} className={view === option ? "active" : ""} aria-pressed={view === option} onClick={() => setView(option)}>{option[0].toUpperCase() + option.slice(1)}</button>)}
      </div>
      {view === "month" && <p className="view-note">Month view will group all imported days. The prototype currently contains one sample week.</p>}
      <div className="lunch-grid">
        {shown.map((day, index) => (
          <article className={`lunch-card ${index === 0 && view === "today" ? "lunch-card--featured" : ""}`} key={day.date}>
            <div className="lunch-card__date"><span>{formatDate(day.date, { weekday: "long" })}</span><strong>{formatDate(day.date, { month: "short", day: "numeric" })}</strong></div>
            <span className="badge badge--demo">Sample</span>
            <h2>{day.mainEntree}</h2>
            {day.alternateEntree && <p><strong>Alternate:</strong> {day.alternateEntree}</p>}
            <p><strong>Sides:</strong> {day.sides.join(" · ")}</p>
            <p className="muted">{day.notes}</p>
            <a className="source-link" href={day.sourceUrl} target="_blank" rel="noreferrer">Source placeholder: official school site ↗</a>
          </article>
        ))}
      </div>
    </>
  );
}

export function DocumentsPage() {
  const { selectedGrades } = useGradeFilter();
  const [query, setQuery] = useState("");
  const visible = filterByGrades(documents, selectedGrades).filter((document) => `${document.title} ${document.description} ${document.category}`.toLowerCase().includes(query.toLowerCase()));
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
  const normalized = query.trim().toLowerCase();
  const results = handbookSections.filter((section) => !normalized || `${section.title} ${section.excerpt} ${section.keywords.join(" ")}`.toLowerCase().includes(normalized));
  const handbookPdf = assetPath("/documents/2025-26-st-martha-handbook.pdf");
  return (
    <>
      <PageHeading
        eyebrow="Find the policy, not the page"
        title="Handbook search"
        description="Search parent-friendly summaries of the 2025–26 Parent and Student Handbook, then jump to the exact page in the original PDF."
        aside={<a className="button" href={handbookPdf} target="_blank" rel="noreferrer">Download handbook PDF ↗</a>}
      />
      <div className="source-banner" role="note">
        <div><strong>2025–26 handbook</strong><span>33 content pages</span></div>
        <p>These summaries are for finding information quickly. The attached handbook PDF remains the authoritative wording.</p>
      </div>
      <div className="handbook-search">
        <label><span className="sr-only">Search the handbook</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try uniform, tardy, medication…" /></label>
        {query ? <button type="button" className="button" onClick={() => setQuery("")}>Clear</button> : <span className="handbook-search__label">Search</span>}
      </div>
      <div className="suggestion-row" aria-label="Suggested searches">{["uniform", "tardy", "medication", "cell phone", "volunteer", "Kids' Corner"].map((term) => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}</div>
      <div className="search-results" aria-live="polite">
        <SectionHeading title={normalized ? `Results for “${query}”` : "Handbook contents"} count={results.length} />
        {results.length ? results.map((section) => (
          <article className="handbook-result" key={section.id}>
            <div><span className="badge badge--source">Handbook summary</span><h2>{section.title}</h2><p>{section.excerpt}</p><a className="source-link" href={`${handbookPdf}#page=${section.pageStart}`} target="_blank" rel="noreferrer">Read the original page ↗</a></div>
            <span className="page-cite">{section.pageEnd ? `Pages ${section.pageStart}–${section.pageEnd}` : `Page ${section.pageStart}`}</span>
          </article>
        )) : <EmptyState>No handbook sections match that search. Try a broader term or one of the suggestions.</EmptyState>}
      </div>
      <div className="source-footer">
        <span>Source: St. Martha Parent and Student Handbook 2025–2026</span>
        <a className="source-link" href={handbookPdf} target="_blank" rel="noreferrer">Open the complete PDF ↗</a>
      </div>
    </>
  );
}

export function ArchivePage() {
  const [query, setQuery] = useState("");
  const filtered = newsletters.filter((newsletter) => newsletter.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageHeading eyebrow="Past weeks, still findable" title="Newsletter archive" description="Every reviewed newsletter will keep its source, extracted items, dates, and grade coverage in a searchable record." />
      <DemoNotice>The newsletter records below are samples for validating the archive experience.</DemoNotice>
      <label className="search-box"><span className="search-box__icon" aria-hidden="true">⌕</span><span className="sr-only">Search newsletter archive</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the archive…" /></label>
      <div className="archive-list">
        {filtered.map((newsletter) => (
          <article className="archive-row" key={newsletter.id}>
            <time dateTime={newsletter.newsletterDate}><strong>{formatDate(newsletter.newsletterDate, { day: "2-digit" })}</strong><span>{formatDate(newsletter.newsletterDate, { month: "short", year: "numeric" })}</span></time>
            <div><div className="badge-row"><span className="badge badge--demo">Sample</span><span className="badge">{newsletter.status}</span></div><h2>{newsletter.title}</h2><p>{newsletter.itemCount} structured items · {newsletter.grades.length} grade groups</p></div>
            <a className="button button--small" href={newsletter.sourceUrl} target="_blank" rel="noreferrer">Original source ↗</a>
          </article>
        ))}
      </div>
    </>
  );
}

export function AdminPage() {
  const queue = [
    { title: "Sample News Notes — August 7", status: "Ready for review", items: 10, review: 3, confidence: "86%" },
    { title: "Sample News Notes — July 31", status: "Published", items: 7, review: 0, confidence: "93%" },
  ];
  return (
    <>
      <PageHeading eyebrow="Workflow preview" title="Admin review" description="A non-functional preview of the human review queue. Authentication and newsletter ingestion are intentionally outside this first build." aside={<span className="badge badge--secure">Auth required in MVP</span>} />
      <div className="notice"><span className="notice__icon" aria-hidden="true">!</span><div><strong>No data is being imported yet</strong><p>This screen validates the editorial workflow only. It does not accept emails, scrape newsletters, publish content, or store personal data.</p></div></div>
      <div className="admin-stats"><div><span>Imports</span><strong>2</strong><small>sample records</small></div><div><span>Needs review</span><strong>3</strong><small>sample items</small></div><div><span>Published</span><strong>7</strong><small>sample items</small></div></div>
      <section className="admin-section">
        <SectionHeading eyebrow="Import queue" title="Newsletter sources" />
        <div className="admin-table" role="table" aria-label="Sample import queue">
          <div className="admin-table__header" role="row"><span>Source</span><span>Status</span><span>Items</span><span>Review</span><span>Confidence</span><span /></div>
          {queue.map((item) => <div className="admin-table__row" role="row" key={item.title}><div><strong>{item.title}</strong><small>Official school site · sample</small></div><span><i className={`dot ${item.review ? "dot--soon" : "dot--open"}`} /> {item.status}</span><span>{item.items}</span><span>{item.review}</span><span>{item.confidence}</span><button type="button" disabled>Review</button></div>)}
        </div>
      </section>
      <section className="workflow">
        <SectionHeading eyebrow="Future boundary" title="Planned ingestion flow" />
        <ol><li><span>1</span><div><strong>Receive</strong><p>Store the forwarded source safely.</p></div></li><li><span>2</span><div><strong>Extract</strong><p>Create structured draft items.</p></div></li><li><span>3</span><div><strong>Review</strong><p>Correct dates, links, and grades.</p></div></li><li><span>4</span><div><strong>Publish</strong><p>Send approved content to families.</p></div></li></ol>
      </section>
    </>
  );
}
