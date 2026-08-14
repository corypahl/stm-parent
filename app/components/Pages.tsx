"use client";

import { useState, type ReactNode } from "react";
import contentData from "../data/content.json";
import googleContentData from "../data/google-content.json";
import googleNewsletterData from "../data/google-newsletters.json";
import latestNewsletterData from "../data/latest-newsletter.json";
import documentData from "../data/documents.json";
import lunchData from "../data/lunch.json";
import handbookData from "../data/handbook.json";
import calendarData from "../data/calendar.json";
import newsletterEventData from "../data/newsletter-events.json";
import {
  handbookClergy,
  handbookDirectoryContacts,
  handbookHours,
  handbookStaffRoster,
  handbookUpdatedInformation,
  kidsCornerFees,
  majorBehaviorResponses,
  tardinessRows,
  uniformGroups,
} from "../data/handbook-layout";
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
import { mergeCalendarEvents } from "../lib/calendar-events";
import { smoreEmbedUrl } from "../lib/newsletters";
import { assetPath } from "../lib/site-path";
import { buildUnifiedSearchIndex } from "../lib/unified-search";
import { ContentCard } from "./ContentCard";
import { EmptyState, PageHeading, SectionHeading } from "./PageHeading";
import { UnifiedSearch } from "./UnifiedSearch";

const contentItems = [...(googleContentData as ContentItem[]), ...(contentData as ContentItem[])];
const documents = documentData as SchoolDocument[];
const lunchDays = lunchData as LunchDay[];
const handbookSections = handbookData as HandbookSection[];
const newsletters = (googleNewsletterData as NewsletterSummary[]).sort((a, b) => b.newsletterDate.localeCompare(a.newsletterDate));
const latestNewsletter = latestNewsletterData as LatestNewsletter | null;
const calendarEvents = mergeCalendarEvents(calendarData as CalendarEvent[], newsletterEventData as CalendarEvent[]);
const staffMembers = handbookDirectoryContacts;
const unifiedSearchEntries = buildUnifiedSearchIndex({ handbookSections, newsletters, calendarEvents });

const calendarCategories = ["All", "School day", "No school", "Family event", "Faith", "Academic"] as const;
const calendarWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
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

function detroitDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftCalendarMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1, 12));
  return shifted.toISOString().slice(0, 7);
}

function calendarCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1, 12)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthNumber, 0, 12)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + dayCount) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= dayCount
      ? `${month}-${String(day).padStart(2, "0")}`
      : null;
  });
}

function eventOccursOn(event: CalendarEvent, date: string) {
  return event.date <= date && (event.endDate ?? event.date) >= date;
}

function CalendarEventCard({ event, dateLabel = "weekday", anchorId }: { event: CalendarEvent; dateLabel?: "weekday" | "month"; anchorId?: string }) {
  const labelOptions: Intl.DateTimeFormatOptions = dateLabel === "weekday" ? { weekday: "short" } : { month: "short" };
  return (
    <article className="calendar-entry" id={anchorId}>
      <time dateTime={event.date}>
        <span>{formatCalendarDate(event.date, labelOptions)}</span>
        <strong>{formatCalendarDate(event.date, { day: "numeric" })}</strong>
      </time>
      <div>
        {event.endDate && <span className="date-range">{formatCalendarRange(event)}</span>}
        <h3>{event.title}</h3>
        {(event.time || event.details) && <p>{[event.time, event.details].filter(Boolean).join(" · ")}</p>}
      </div>
    </article>
  );
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

function LatestNewsletterSignups({ compact = false }: { compact?: boolean } = {}) {
  const newsletter = newsletters[0];
  const signups = newsletter?.signups ?? [];

  if (compact) {
    return (
      <div className="home-signups">
        {signups.length > 0 ? (
          <div className="home-signups__list">
            {signups.map((signup) => (
              <article className="home-signup-row" key={signup.id}>
                <div>
                  <span className="eyebrow">Newsletter form</span>
                  <h3>{signup.title}</h3>
                </div>
                <a className="button button--small button--outline" href={signup.url} target="_blank" rel="noreferrer">Open form ↗</a>
              </article>
            ))}
          </div>
        ) : <EmptyState>No signup form links were found in the latest newsletter.</EmptyState>}
        {newsletter && (
          <div className="home-panel__source">
            <span>From {newsletter.title}</span>
            <time dateTime={newsletter.newsletterDate}>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { month: "short", day: "numeric", year: "numeric" })}</time>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {newsletter && <div className="signup-source"><span>From</span><strong>{newsletter.title}</strong><time dateTime={newsletter.newsletterDate}>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { month: "long", day: "numeric", year: "numeric" })}</time></div>}
      {signups.length > 0
        ? <div className="signup-grid">{signups.map((signup) => <article className="signup-card" key={signup.id}><span className="eyebrow">Newsletter form</span><h3>{signup.title}</h3><p>Found automatically in {newsletter.title}.</p><div className="signup-card__actions"><a className="source-link" href={newsletter.sourceUrl} target="_blank" rel="noreferrer">Newsletter source ↗</a><a className="button button--small" href={signup.url} target="_blank" rel="noreferrer">Open form ↗</a></div></article>)}</div>
        : <EmptyState>No signup form links were found in the latest newsletter.</EmptyState>}
    </>
  );
}

export function HomePage() {
  const today = detroitDateKey();
  const upcomingEvents = calendarEvents.filter((event) => (event.endDate ?? event.date) >= today).slice(0, 3);
  const embedUrl = latestNewsletter ? smoreEmbedUrl(latestNewsletter.sourceUrl) : undefined;

  return (
    <>
      <UnifiedSearch entries={unifiedSearchEntries} />

      <div className="home-dashboard">
        <div className="home-dashboard__rail">
          <section className="home-panel">
            <SectionHeading title="Coming Up" count={upcomingEvents.length} link={{ href: "/calendar", label: "Full calendar" }} />
            <div className="calendar-preview home-calendar-list">
              {upcomingEvents.map((event) => (
                <CalendarEventCard event={event} dateLabel="month" key={event.id} />
              ))}
            </div>
            <p className="home-panel__source">Sources: academic calendar and school newsletters</p>
          </section>

          <section className="home-panel">
            <SectionHeading title="Sign Ups" />
            <LatestNewsletterSignups compact />
          </section>
        </div>

        <section className="home-panel home-panel--news">
          <SectionHeading title="Latest News" link={{ href: "/newsletters", label: "All newsletters" }} />
          {latestNewsletter && embedUrl ? (
            <article className="newsletter-embed newsletter-embed--home">
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
      </div>
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
  const today = detroitDateKey();
  const todayMonth = today.slice(0, 7);
  const firstEventMonth = calendarEvents[0]?.date.slice(0, 7);
  const lastEventMonth = calendarEvents.at(-1)?.date.slice(0, 7);
  const initialMonth = firstEventMonth && lastEventMonth && todayMonth >= firstEventMonth && todayMonth <= lastEventMonth
    ? todayMonth
    : firstEventMonth ?? todayMonth;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const normalized = query.trim().toLowerCase();
  const visible = calendarEvents.filter((event) => {
    const matchesCategory = category === "All" || event.category === category;
    const matchesQuery = !normalized || `${event.title} ${event.details ?? ""} ${event.time ?? ""} ${event.category}`.toLowerCase().includes(normalized);
    return matchesCategory && matchesQuery;
  });
  const upcoming = visible.filter((event) => (event.endDate ?? event.date) >= today);
  const past = visible
    .filter((event) => (event.endDate ?? event.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  const monthCells = calendarCells(selectedMonth);
  const selectedMonthHasEvents = monthCells.some((date) => date && visible.some((event) => eventOccursOn(event, date)));
  const calendarPdf = assetPath("/documents/2026-27-academic-calendar.pdf");

  return (
    <>
      <PageHeading
        eyebrow="2026–27 school year"
        title="Academic calendar"
        description="School-calendar dates plus upcoming dates discovered automatically in the latest newsletters."
        aside={<a className="button" href={calendarPdf} target="_blank" rel="noreferrer">Download calendar PDF ↗</a>}
      />
      <section className="calendar-subscribe" aria-labelledby="calendar-subscribe-title">
        <div>
          <span className="eyebrow eyebrow--light">Stay up to date</span>
          <h2 id="calendar-subscribe-title">Add school events to your calendar.</h2>
          <p>Subscribe to the public calendar for school-calendar updates. Newsletter-discovered dates are also shown below.</p>
        </div>
        <div className="calendar-subscribe__actions">
          <a className="button button--light" href={googleCalendar.subscribeUrl} target="_blank" rel="noreferrer">Subscribe with Google ↗</a>
          <a className="button button--ghost-light" href={googleCalendar.publicIcalUrl}>Apple or Outlook (.ics)</a>
        </div>
      </section>
      <div className="source-banner" role="note">
        <div><strong>Calendar and newsletter dates</strong><span>Checked during every site update</span></div>
        <p>Dates extracted from newsletters may contain automated-reading errors. Check school communications before making plans.</p>
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
      <section className="calendar-view" aria-labelledby="calendar-view-title">
        <div className="calendar-view__header">
          <div>
            <span className="eyebrow">Browse by month</span>
            <h2 id="calendar-view-title">Calendar view</h2>
          </div>
          <div className="calendar-view__controls">
            <button type="button" aria-label="Previous month" onClick={() => setSelectedMonth((month) => shiftCalendarMonth(month, -1))}>←</button>
            <strong aria-live="polite">{formatCalendarDate(`${selectedMonth}-01`, { month: "long", year: "numeric" })}</strong>
            <button type="button" aria-label="Next month" onClick={() => setSelectedMonth((month) => shiftCalendarMonth(month, 1))}>→</button>
            <button type="button" className="calendar-view__today" onClick={() => setSelectedMonth(todayMonth)}>Today</button>
          </div>
        </div>
        <p className="calendar-grid-hint">Scroll horizontally to view the full month.</p>
        <div className="calendar-grid-scroll">
          <div className="calendar-grid" role="grid" aria-label={`${formatCalendarDate(`${selectedMonth}-01`, { month: "long", year: "numeric" })} events`}>
            {calendarWeekdays.map((weekday) => <div className="calendar-grid__weekday" role="columnheader" key={weekday}>{weekday.slice(0, 3)}</div>)}
            {monthCells.map((date, index) => {
              if (!date) return <div className="calendar-grid__day calendar-grid__day--empty" role="gridcell" aria-hidden="true" key={`empty-${index + 1}`} />;
              const dayEvents = visible.filter((event) => eventOccursOn(event, date));
              return (
                <div className={`calendar-grid__day ${date === today ? "calendar-grid__day--today" : ""}`} role="gridcell" aria-label={`${formatCalendarDate(date, { month: "long", day: "numeric" })}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`} key={date}>
                  <time dateTime={date}>{Number(date.slice(-2))}</time>
                  <div className="calendar-grid__events">
                    {dayEvents.slice(0, 3).map((event) => <span className="calendar-grid__event" key={`${date}-${event.id}`}>{event.time && <small>{event.time}</small>}{event.title}</span>)}
                    {dayEvents.length > 3 && <span className="calendar-grid__more">+{dayEvents.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {!selectedMonthHasEvents && <p className="calendar-view__empty">No matching events in this month.</p>}
      </section>

      <section className="event-list-section">
        <SectionHeading title="Upcoming" count={upcoming.length} />
        {upcoming.length
          ? <div className="event-list">{upcoming.map((event) => <CalendarEventCard event={event} anchorId={`event-${event.id}`} key={event.id} />)}</div>
          : <EmptyState>No upcoming events match that search and filter.</EmptyState>}
      </section>

      <section className="event-list-section event-list-section--past">
        <SectionHeading title="Past Events" count={past.length} />
        {past.length
          ? <div className="event-list">{past.map((event) => <CalendarEventCard event={event} anchorId={`event-${event.id}`} key={event.id} />)}</div>
          : <EmptyState>Past events will appear here after their date.</EmptyState>}
      </section>
      <div className="source-footer">
        <span>Sources: St. Martha 2026–27 Academic Calendar and school newsletters</span>
        <a className="source-link" href={calendarPdf} target="_blank" rel="noreferrer">Open the original PDF ↗</a>
      </div>
    </>
  );
}

export function StaffPage() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = staffMembers.filter((member) => `${member.name} ${member.group} ${member.roles.join(" ")}`.toLowerCase().includes(normalized));
  const handbookPdf = assetPath("/documents/2026-27-st-martha-handbook.pdf");

  return (
    <>
      <PageHeading
        eyebrow="People who make the school go"
        title="Directory"
        description="Find the teachers, school leadership, specialists, and support staff listed in the current parent and student handbook."
        aside={<a className="button" href={handbookPdf} target="_blank" rel="noreferrer">Open handbook PDF ↗</a>}
      />
      <div className="source-banner" role="note">
        <div><strong>{staffMembers.length} handbook contacts</strong><span>2026–27 handbook</span></div>
        <p>Names, roles, and email addresses come from the staff roster in the current handbook, which is also shown on the Handbook page.</p>
      </div>
      <label className="search-box staff-search">
        <span className="search-box__icon" aria-hidden="true">⌕</span>
        <span className="sr-only">Search school staff</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a name, grade, or subject…" />
      </label>
      <div className="staff-directory" aria-live="polite">
        {visible.length ? <>
          <p className="staff-table-hint">Scroll horizontally to see all contact details.</p>
          <div className="staff-table-frame">
            <table className="staff-table">
              <caption className="sr-only">School contacts from the 2026–27 parent and student handbook</caption>
              <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Email</th></tr></thead>
              {staffGroups.map((group) => {
                const members = visible.filter((member) => member.group === group);
                if (!members.length) return null;
                return <tbody key={group}>
                  <tr className="staff-table__group"><th colSpan={3} scope="rowgroup"><span>{group}</span><span>{members.length}</span></th></tr>
                  {members.map((member) => <tr key={member.id}>
                    <th scope="row">{member.name}</th>
                    <td>{member.roles.join(" · ")}</td>
                    <td>{member.email ? <a href={`mailto:${member.email}`}>{member.email}</a> : <span className="staff-table__empty">Not listed</span>}</td>
                  </tr>)}
                </tbody>;
              })}
            </table>
          </div>
        </> : <EmptyState>No staff members match that search.</EmptyState>}
      </div>
      <div className="source-footer">
        <span>Source: St. Martha Parent and Student Handbook 2026–27</span>
        <a className="source-link" href={handbookPdf} target="_blank" rel="noreferrer">Open handbook PDF ↗</a>
      </div>
    </>
  );
}

export function SignUpsPage() {
  return (
    <>
      <PageHeading eyebrow="Forms and opportunities" title="Sign Ups" description="Signup, RSVP, registration, and volunteer forms extracted automatically from the latest school newsletter." />
      <LatestNewsletterSignups />
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
  const searchTerms = normalized.split(" ").filter(Boolean);
  const results = handbookSections.filter((section) => {
    const searchable = `${section.title} ${section.content}`.toLowerCase().replace(/\s+/g, " ");
    return searchTerms.every((term) => searchable.includes(term));
  });
  const handbookPdf = assetPath("/documents/2026-27-st-martha-handbook.pdf");
  return (
    <>
      <PageHeading
        eyebrow="Search every policy"
        title="Parent & student handbook"
        description="Search and read the complete 2026–27 handbook directly on this page, organized into clear sections for phones and computers."
        aside={<a className="button" href={handbookPdf} target="_blank" rel="noreferrer">Download handbook PDF ↗</a>}
      />
      <div className="source-banner" role="note">
        <div><strong>2026–27 handbook</strong><span>38 content pages · {handbookSections.length} sections</span></div>
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
        <span>Source: St. Martha Parent & Student Handbook 2026–2027</span>
        <a className="source-link" href={handbookPdf} target="_blank" rel="noreferrer">Open the complete PDF ↗</a>
      </div>
    </>
  );
}

type HandbookBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "note"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function formatHandbookPages(pageStart: number, pageEnd: number) {
  return pageEnd > pageStart ? `Pages ${pageStart}–${pageEnd}` : `Page ${pageStart}`;
}

function parseHandbookContent(section: HandbookSection, content = section.content): HandbookBlock[] {
  const headings = new Set(section.subheadings);
  const blocks: HandbookBlock[] = [];
  let paragraph: string[] = [];
  let list: Extract<HandbookBlock, { type: "list" }> | undefined;

  const flushParagraph = () => {
    if (paragraph.length) {
      const text = paragraph.join(" ").replace(/^\*\*|\*\*$/g, "").trim();
      blocks.push({ type: handbookNote_(text) ? "note" : "paragraph", text });
    }
    paragraph = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = undefined;
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("**")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "note", text: line.replace(/^\*\*|\*\*$/g, "").trim() });
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

function handbookNote_(text: string) {
  return /^(Please note:|Note:|Important:|Parents are strongly urged|Please remember|All half days are|Summer uniform and shorts|Younger siblings or additional guests|When your child is going to be absent)/i.test(text);
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return <>{parts.map((part, index) => part.toLowerCase() === query ? <mark key={`${part}-${index}`}>{part}</mark> : part)}</>;
}

function HandbookText({ text, query }: { text: string; query: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g);
  return <>{parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) return <a href={part} target="_blank" rel="noreferrer" key={`${part}-${index}`}><HighlightedText text={part} query={query} /></a>;
    if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(part)) return <a href={`mailto:${part}`} key={`${part}-${index}`}><HighlightedText text={part} query={query} /></a>;
    return <HighlightedText text={part} query={query} key={`${part.slice(0, 20)}-${index}`} />;
  })}</>;
}

function HandbookBlocks({ section, query, content = section.content }: { section: HandbookSection; query: string; content?: string }) {
  const blocks = parseHandbookContent(section, content);
  return (
    <div className="handbook-section__body">
      {blocks.map((block, index) => {
        if (block.type === "heading") return <h3 key={`${block.text}-${index}`}><HighlightedText text={block.text} query={query} /></h3>;
        if (block.type === "paragraph") return <p key={`${block.text.slice(0, 30)}-${index}`}><HandbookText text={block.text} query={query} /></p>;
        if (block.type === "note") return <aside className="handbook-callout" key={`${block.text.slice(0, 30)}-${index}`}><HandbookText text={block.text} query={query} /></aside>;
        const List = block.ordered ? "ol" : "ul";
        return <List key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={`${item.slice(0, 30)}-${itemIndex}`}><HandbookText text={item} query={query} /></li>)}</List>;
      })}
    </div>
  );
}

function HandbookTableFrame({ children }: { children: ReactNode }) {
  return <div className="handbook-table-frame"><p className="handbook-table-hint">Swipe or scroll to see every column.</p><div className="handbook-table-scroll">{children}</div></div>;
}

function StaffRosterContent({ query }: { query: string }) {
  return <div className="handbook-rich-content">
    <dl className="handbook-clergy">{handbookClergy.map((person) => <div key={person.role}><dt>{person.role}</dt><dd><strong><HighlightedText text={person.name} query={query} /></strong><a href={`mailto:${person.email}`}><HighlightedText text={person.email} query={query} /></a></dd></div>)}</dl>
    <HandbookTableFrame><table className="handbook-data-table handbook-roster-table"><caption>Staff roster</caption><thead><tr><th scope="col">Staff member</th><th scope="col">Subject or role</th><th scope="col">Email</th></tr></thead><tbody>{handbookStaffRoster.map((person) => <tr key={`${person.name}-${person.role}`}><th scope="row"><HighlightedText text={person.name} query={query} /></th><td><HighlightedText text={person.role} query={query} /></td><td>{person.email ? <a href={`mailto:${person.email}`}><HighlightedText text={person.email} query={query} /></a> : "-"}</td></tr>)}</tbody></table></HandbookTableFrame>
  </div>;
}

function HoursContent({ query }: { query: string }) {
  return <dl className="handbook-hours">{handbookHours.map(([label, value]) => <div key={label}><dt><HighlightedText text={label} query={query} /></dt><dd><HighlightedText text={value} query={query} /></dd></div>)}</dl>;
}

function TardinessContent({ section, query }: { section: HandbookSection; query: string }) {
  const tableStart = section.content.indexOf("If in a school year, you are late");
  const before = section.content.slice(0, tableStart);
  return <div className="handbook-rich-content">
    <HandbookBlocks section={section} query={query} content={before} />
    <HandbookTableFrame><table className="handbook-data-table handbook-tardy-table"><caption>How daily tardiness adds up over a school year</caption><thead><tr><th scope="col">Late every day by</th><th scope="col">School time lost</th><th scope="col">Lessons missed</th></tr></thead><tbody>{tardinessRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}><HighlightedText text={cell} query={query} /></th> : <td key={cell}><HighlightedText text={cell} query={query} /></td>)}</tr>)}</tbody></table></HandbookTableFrame>
  </div>;
}

function UniformContent({ section, query }: { section: HandbookSection; query: string }) {
  const tableStart = section.content.indexOf("Uniform Guidelines K-8");
  const introduction = section.content.slice(0, tableStart).replace(/^\(See Uniform Booklet\)\s*/, "");
  return <div className="handbook-rich-content">
    <p className="handbook-section-deck">See Uniform Booklet</p>
    <HandbookBlocks section={section} query={query} content={introduction} />
    <section className="handbook-subsection" aria-labelledby="uniform-guidelines-heading"><div className="handbook-subsection__heading"><span className="eyebrow">At a glance</span><h3 id="uniform-guidelines-heading">Uniform guidelines K-8</h3><p>Requirements are grouped by grade band so families can compare the items purchased from MAPU with items that may be purchased elsewhere.</p></div>
      <div className="uniform-guide-grid">{uniformGroups.map((group) => <article className="uniform-guide-card" key={group.title}><h4><HighlightedText text={group.title} query={query} /></h4>{group.groups.map((itemGroup) => <section key={itemGroup.heading}><h5><HighlightedText text={itemGroup.heading} query={query} /></h5><ul>{itemGroup.items.map((item) => <li key={item}><HandbookText text={item} query={query} /></li>)}</ul></section>)}</article>)}</div>
    </section>
  </div>;
}

function MajorBehaviorContent({ section, query }: { section: HandbookSection; query: string }) {
  const rubricStart = section.content.indexOf("Major Behavior Response Rubric");
  const noteStart = section.content.indexOf("Please Note:", rubricStart);
  return <div className="handbook-rich-content handbook-policy-content">
    <HandbookBlocks section={section} query={query} content={section.content.slice(0, rubricStart)} />
    <HandbookTableFrame><table className="handbook-data-table handbook-behavior-table"><caption>Major behavior response rubric</caption><thead><tr>{majorBehaviorResponses.map((response) => <th scope="col" key={response.heading}><HighlightedText text={response.heading} query={query} /></th>)}</tr></thead><tbody><tr>{majorBehaviorResponses.map((response) => <td key={response.heading}><HandbookText text={response.text} query={query} /></td>)}</tr></tbody></table></HandbookTableFrame>
    <HandbookBlocks section={section} query={query} content={section.content.slice(noteStart)} />
  </div>;
}

function KidsCornerContent({ section, query }: { section: HandbookSection; query: string }) {
  const feeStart = section.content.indexOf("Fee Schedule");
  const billingStart = section.content.indexOf("Billing for Before Care/Kids Corner", feeStart);
  return <div className="handbook-rich-content">
    <HandbookBlocks section={section} query={query} content={section.content.slice(0, feeStart)} />
    <HandbookTableFrame><table className="handbook-data-table handbook-fee-table"><caption>Fee schedule</caption><thead><tr><th scope="col">Care option</th><th scope="col">1st student</th><th scope="col">2 students</th><th scope="col">3+ students</th></tr></thead><tbody>{kidsCornerFees.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}><HighlightedText text={cell} query={query} /></th> : <td key={`${row[0]}-${index}`}><HighlightedText text={cell} query={query} /></td>)}</tr>)}</tbody></table></HandbookTableFrame>
    <HandbookBlocks section={section} query={query} content={section.content.slice(billingStart)} />
  </div>;
}

function WelcomeContent({ section, query }: { section: HandbookSection; query: string }) {
  return <div className="handbook-rich-content"><aside className="handbook-letter" aria-label="Welcome letter from the principal"><HandbookBlocks section={section} query={query} /></aside></div>;
}

function FoundationsContent({ section, query }: { section: HandbookSection; query: string }) {
  const hoursStart = section.content.indexOf("School Hours");
  return <div className="handbook-rich-content"><HandbookBlocks section={section} query={query} content={section.content.slice(0, hoursStart)} /><h3>School hours</h3><HoursContent query={query} /></div>;
}

function DiocesanRequirementContent({ section, query }: { section: HandbookSection; query: string }) {
  const introStart = section.content.indexOf("Commitment to a Safe and Respectful School Community");
  const familyStart = section.content.indexOf("Family Name:");
  const intro = section.content.slice(introStart, familyStart);
  return <div className="handbook-acknowledgment">
    <div className="handbook-acknowledgment__notice"><strong>Printable acknowledgment</strong><span>Please sign and return the PDF page to school.</span></div>
    <HandbookBlocks section={section} query={query} content={intro} />
    <div className="handbook-form-lines"><div><span>Family name</span><i /></div><div><span>Names and grades of children at Saint Martha School</span><i /><i /><i /></div></div>
    <aside className="handbook-updates"><h3>Updated information for 2026-27</h3><dl>{handbookUpdatedInformation.map(([page, topic]) => <div key={`${page}-${topic}`}><dt><HighlightedText text={page} query={query} /></dt><dd><HighlightedText text={topic} query={query} /></dd></div>)}</dl></aside>
    <section className="handbook-signature-block"><h3>Parents/Guardians</h3><p><span className="initial-line" aria-hidden="true">Initial</span> <HandbookText text="I have read and discussed the policies outlined in the St. Martha School Handbook with my child(ren). I understand that failure to follow the guidelines, expectations, and procedures described may result in disciplinary action. I agree to support the school in reinforcing these rules and expectations with my child(ren) and will partner with the school to promote a positive and respectful learning environment." query={query} /></p><div className="signature-lines"><span>Parent signature</span><span>Date</span></div></section>
    <section className="handbook-signature-block handbook-signature-block--student"><h3>For students in grades 4-8 only</h3><p><HandbookText text="I have read and understand the contents of the 2026-2027 St. Martha School Parent & Student Handbook. I will respect and follow these rules while I am a student at St. Martha School. Please sign and date below." query={query} /></p><div className="signature-lines"><span>Student signatures</span><span>Date</span></div></section>
  </div>;
}

function HandbookSectionContent({ section, query }: { section: HandbookSection; query: string }) {
  switch (section.id) {
    case "welcome-letter": return <WelcomeContent section={section} query={query} />;
    case "mission-philosophy-hours": return <FoundationsContent section={section} query={query} />;
    case "staff-roster": return <StaffRosterContent query={query} />;
    case "tardiness": return <TardinessContent section={section} query={query} />;
    case "uniforms": return <UniformContent section={section} query={query} />;
    case "major-behavior-rubric": return <MajorBehaviorContent section={section} query={query} />;
    case "kids-corner": return <KidsCornerContent section={section} query={query} />;
    case "acknowledgment": return <DiocesanRequirementContent section={section} query={query} />;
    default: return <HandbookBlocks section={section} query={query} />;
  }
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
            <article className={`archive-newsletter ${isOpen ? "archive-newsletter--open" : ""}`} id={`newsletter-${newsletter.id}`} key={newsletter.id}>
              <div className="archive-row">
                <time dateTime={newsletter.newsletterDate}><strong>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { day: "2-digit" })}</strong><span>{formatDate(`${newsletter.newsletterDate}T12:00:00`, { month: "short", year: "numeric" })}</span></time>
                <div><h2>{newsletter.title}</h2><p>School newsletter · Smore</p>{excerpt && <p className="archive-row__excerpt">…<HighlightedText text={excerpt} query={query} />…</p>}</div>
                <div className="archive-row__actions">
                  {embedUrl && <button type="button" className={`button button--small ${isOpen && readerMode === "original" ? "" : "button--outline"}`} aria-expanded={isOpen && readerMode === "original"} aria-controls={`archive-reader-${newsletter.id}`} aria-label={isOpen && readerMode === "original" ? `Close ${newsletter.title} reader` : `Read ${newsletter.title} here`} onClick={() => openReader("original")}>Read here</button>}
                  {newsletter.textStatus === "available" && <button type="button" className={`button button--small ${isOpen && readerMode === "text" ? "" : "button--outline"}`} aria-expanded={isOpen && readerMode === "text"} aria-controls={`archive-reader-${newsletter.id}`} aria-label={isOpen && readerMode === "text" ? `Close ${newsletter.title} text version` : `Read ${newsletter.title} text version`} onClick={() => openReader("text")}>Text version</button>}
                  <a className="button button--small button--outline" href={newsletter.sourceUrl} target="_blank" rel="noreferrer">Open Smore</a>
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
