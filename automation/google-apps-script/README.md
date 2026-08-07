# Google email intake and calendar publishing

This Apps Script belongs to `stm.parent.updates@gmail.com`. It keeps complete forwarded messages in a private Google Sheet, exposes only approved public fields, and creates or updates approved events in the public Google Calendar.

## One-time installation

1. Sign in as `stm.parent.updates@gmail.com` and create a Google Sheet named `St. Martha Parent Site Review Queue`.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with this directory's `Code.gs`.
4. In **Project Settings**, enable the manifest file in the editor. Replace `appsscript.json` with this directory's manifest.
5. Select `setupParentSite` and click **Run**. Review and approve the requested Gmail, Calendar, Sheets, and trigger permissions.
6. Return to the spreadsheet and reload it. A **Parent Site** menu will appear. New forwarded messages will begin entering the `Review Queue` sheet within 15 minutes.
7. In Apps Script, choose **Deploy → New deployment → Web app**. Set **Execute as** to yourself and **Who has access** to anyone. Deploy and copy the `/exec` URL.
8. Send the `/exec` URL to Codex. It contains approved public fields only; do not send passwords, OAuth tokens, or recovery codes.

## Review workflow

- Every incoming message begins with status `Review`.
- Edit the public title and summary, remove student names or private information, add dates and location where applicable, and confirm grade tags.
- HTML-only and incorrectly labeled HTML messages are converted into readable plain text for review.
- Smore newsletter links are preferred over tracking pixels and receive a `Read newsletter` action with a `Newsletter` category.
- Choose `Approved` to publish the safe fields to the site.
- Approved rows with content type `event` and a start date are added to Google Calendar.
- Choose `Remove` to delete an event previously created by the automation.
- The `Private Email Body`, sender, and original subject are never returned by the public feed.

## Update an existing deployment

After replacing `Code.gs`, open **Deploy → Manage deployments**, edit the existing web-app deployment, choose **New version**, and deploy. The `/exec` URL remains the same. Version 2 of this script returns `"version":2` in the public JSON response so an empty feed can still be verified.

## Seed the 2026–27 calendar

Download `https://corypahl.github.io/stm-parent/documents/st-martha-2026-27-calendar.ics`. In Google Calendar, open **Settings → Import & export**, import the file, and select the `stm.parent.updates@gmail.com` calendar. Do this once only.
