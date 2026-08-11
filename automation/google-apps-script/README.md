# Automatic Gmail newsletter feed

This Apps Script belongs to `stm.parent.updates@gmail.com`. It reads the account's inbox whenever the public feed is requested and returns one record for every email containing a public Smore newsletter link.

There is no spreadsheet import, grade tagging, review, or approval step. The public feed contains only each newsletter's cleaned title, newsletter date, and Smore URL. It never returns the sender, email body, or other Gmail data.

## Install or update

1. Sign in as `stm.parent.updates@gmail.com` and open the existing Apps Script project from the Google Sheet with **Extensions → Apps Script**.
2. Replace `Code.gs` with this directory's `Code.gs`.
3. In **Project Settings**, enable the manifest file in the editor and replace `appsscript.json` with this directory's manifest.
4. In [Google AI Studio](https://aistudio.google.com/apikey), create a Gemini API key. Back in Apps Script, open **Project Settings → Script properties**, add a property named `GEMINI_API_KEY`, and paste the key as its value. Never place the key in `Code.gs`, GitHub, or browser code.
5. Save the project, select `setupParentSite`, and click **Run**. Approve Gmail and external-request access when asked. The code only reads inbox messages; Google's built-in Gmail service nevertheless requests its standard mailbox scope. Setup also removes the old import, approval, and newsletter-section triggers.
6. Select `checkGeminiSetup` and click **Run**. The execution log should say that Gemini search is ready; it never prints the key.
7. Choose **Deploy → Manage deployments**, edit the existing web-app deployment, choose **New version**, and deploy. Keep **Execute as** set to yourself and **Who has access** set to anyone. The existing `/exec` URL remains the same.

Feed version 6 scans all inbox messages, ignores email without a Smore link, removes duplicate Smore issues, and sorts newsletters by the date in the email subject or linked newsletter text. When neither contains a date, the email's received date is used.

The site's scheduled GitHub Pages deployment checks the feed every 30 minutes. Every newsletter currently in the inbox appears under Newsletters, and the newest issue by newsletter date appears on Home. During that deployment, the site reads Smore's native text, applies local OCR to newsletter images, and indexes the combined text for search. It also detects linked signup, RSVP, registration, and volunteer forms and displays forms from the latest newsletter in the Home page's Sign Ups section. Sections labeled Important Upcoming Dates are parsed into dated entries and merged into Coming Up and Events without duplicating matching calendar entries. The newest dated lunch-menu image found across the inbox newsletters is OCRed cell by cell and published as the structured Lunch page. This processing uses no external OCR account or manual review.

The Home page search always performs local matching across newsletter sections, handbook sections, and calendar events. When a parent selects **Ask AI**, the browser sends the question and at most eight matching excerpts to this web app. The API key remains in Script properties, and Apps Script calls `gemini-3.5-flash-lite` using structured output. The response is accepted only when its citation IDs match the supplied sources. Repeated identical questions are cached for six hours to conserve the free-tier quota. If Gemini is unavailable or its quota is exhausted, the local matching sources continue to work.

Free-tier Gemini requests may be used by Google to improve its products. The public search interface therefore tells parents not to enter private student information. Do not expand the search corpus to private emails or student records.

Removing a newsletter email from the inbox removes it from the site at the next successful update.

The old `Review Queue` and `Newsletter Sections` sheets are no longer read. They can be retained as a backup or deleted manually after confirming the new feed works.

## Seed the 2026–27 calendar

Download `https://corypahl.github.io/stm-parent/documents/st-martha-2026-27-calendar.ics`. In Google Calendar, open **Settings → Import & export**, import the file, and select the `stm.parent.updates@gmail.com` calendar. Do this once only.
