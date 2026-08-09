# Google email intake and newsletter publishing

This Apps Script belongs to `stm.parent.updates@gmail.com`. It keeps complete forwarded messages and unreviewed newsletter sections in a private Google Sheet, exposes only approved public fields plus the newest public Smore newsletter link, and creates or updates approved events in the public Google Calendar.

## One-time installation

1. Sign in as `stm.parent.updates@gmail.com` and create a Google Sheet named `St. Martha Parent Site Review Queue`.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with this directory's `Code.gs`.
4. Add an HTML file named `Admin` and replace its contents with this directory's `Admin.html`.
5. In **Project Settings**, enable the manifest file in the editor. Replace `appsscript.json` with this directory's manifest.
6. Select `setupParentSite` and click **Run**. Review and approve the requested Gmail, Calendar, Sheets, external newsletter retrieval, and trigger permissions.
7. Return to the spreadsheet and reload it. A **Parent Site** menu will appear. New forwarded messages will begin entering the `Review Queue` sheet within 15 minutes.
8. In Apps Script, choose **Deploy → New deployment → Web app**. Set **Execute as** to yourself and **Who has access** to anyone. Deploy and copy the `/exec` URL.
9. Send the `/exec` URL to Codex. It contains approved public fields only; do not send passwords, OAuth tokens, or recovery codes.

## Review workflow

- Every incoming email begins with status `Review` in the private `Review Queue` sheet.
- The newest forwarded Smore title, newsletter date, and public URL are exposed automatically for the homepage embed. The sender and private email body remain private, and no section approval is required for this embed.
- Smore links are retrieved and split at their horizontal separators. Every section begins with status `Unreviewed` in the private `Newsletter Sections` sheet.
- From the spreadsheet, choose **Parent Site → Open section admin** to review the extracted sections in the private editor.
- Verify the public title and summary, remove names or private information, add grade and category tags, and confirm dates and links.
- Change a section to `Approved` and save it to expose only that section's safe public fields.
- Approved sections with content type `event` and a start date are added to Google Calendar.
- Change an approved section back to `Unreviewed` or `Rejected` to remove it from the public feed and delete its generated calendar event.
- Choose `Remove` in the email review queue to delete an event previously created from an email row.
- The private email body, sender, and original subject are never returned by the public feed.

For a newsletter forwarded before this version was installed, choose **Parent Site → Import newsletter sections** once. Existing section IDs are skipped, so this action is safe to repeat.

## Update an existing deployment

After replacing `Code.gs`, adding or updating `Admin.html`, and running `setupParentSite`, open **Deploy → Manage deployments**, edit the existing web-app deployment, choose **New version**, and deploy. The `/exec` URL remains the same. Version 4 returns the newest public Smore newsletter automatically, plus approved section records and issue-level newsletter summaries, while keeping unreviewed section text and private email fields private.

Running `setupParentSite` also compacts managed records directly beneath their headers. This repairs rows created far down the sheet by versions that initialized every empty All Day checkbox with a `false` value.

## Seed the 2026–27 calendar

Download `https://corypahl.github.io/stm-parent/documents/st-martha-2026-27-calendar.ics`. In Google Calendar, open **Settings → Import & export**, import the file, and select the `stm.parent.updates@gmail.com` calendar. Do this once only.
