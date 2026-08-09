# Automatic Gmail newsletter feed

This Apps Script belongs to `stm.parent.updates@gmail.com`. It reads the account's inbox whenever the public feed is requested and returns one record for every email containing a public Smore newsletter link.

There is no spreadsheet import, grade tagging, review, or approval step. The public feed contains only each newsletter's cleaned title, newsletter date, and Smore URL. It never returns the sender, email body, or other Gmail data.

## Install or update

1. Sign in as `stm.parent.updates@gmail.com` and open the existing Apps Script project from the Google Sheet with **Extensions → Apps Script**.
2. Replace `Code.gs` with this directory's `Code.gs`.
3. In **Project Settings**, enable the manifest file in the editor and replace `appsscript.json` with this directory's manifest.
4. Save the project, select `setupParentSite`, and click **Run**. Approve Gmail access when asked. The code only reads inbox messages; Google's built-in Gmail service nevertheless requests its standard mailbox scope. Setup also removes the old import, approval, and newsletter-section triggers.
5. Choose **Deploy → Manage deployments**, edit the existing web-app deployment, choose **New version**, and deploy. Keep **Execute as** set to yourself and **Who has access** set to anyone. The existing `/exec` URL remains the same.

Feed version 6 scans all inbox messages, ignores email without a Smore link, removes duplicate Smore issues, and sorts newsletters by the date in the email subject or linked newsletter text. When neither contains a date, the email's received date is used.

The site's scheduled GitHub Pages deployment checks the feed every 30 minutes. Every newsletter currently in the inbox appears under Newsletters, and the newest issue by newsletter date appears on Home. During that deployment, the site reads Smore's native text, applies local OCR to newsletter images, and indexes the combined text for search. It also detects linked signup, RSVP, registration, and volunteer forms and displays forms from the latest newsletter under Sign Ups. The newest dated lunch-menu image found across the inbox newsletters is OCRed cell by cell and published as the structured Lunch page. This processing uses no external OCR account or manual review.

Removing a newsletter email from the inbox removes it from the site at the next successful update.

The old `Review Queue` and `Newsletter Sections` sheets are no longer read. They can be retained as a backup or deleted manually after confirming the new feed works.

## Seed the 2026–27 calendar

Download `https://corypahl.github.io/stm-parent/documents/st-martha-2026-27-calendar.ics`. In Google Calendar, open **Settings → Import & export**, import the file, and select the `stm.parent.updates@gmail.com` calendar. Do this once only.
