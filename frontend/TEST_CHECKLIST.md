# Frontend Test Checklist

**What was run:** a scripted Playwright (Chromium) walkthrough of the production build (`npm run build` + `vite preview`) at 1440×900, plus a 390×844 mobile pass. Run on the redesigned UI (light theme); both themes were also checked by screenshot.

**Environment:** the frontend production build was driven in a browser against the **real backend** (`backend/`, Express + Mongoose) and a real MongoDB-compatible database (FerretDB 1.24, local). It was **not** run against MongoDB Atlas itself, because no Atlas credentials were available. Re-run the checklist once with your Atlas `MONGODB_URI` to confirm. "Persistence" below means data and the session survived a browser refresh, and the saved documents were inspected in the database afterwards (bcrypt hashes only, every lead owned, completion time set only on completed follow-ups, no orphaned follow-ups).

| # | Area | Test case | Expected | Actual | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | Auth | Open `/leads` while logged out | Redirect to `/login` | Redirected | PASS |
| 2 | Auth | Submit empty login form | Inline "Email is required" | Shown | PASS |
| 3 | Auth | Log in with wrong credentials | API error message shown | "Invalid email or password" shown | PASS |
| 4 | Auth | Register with 5-char password | "Use at least 8 characters" | Shown | PASS |
| 5 | Auth | Register with valid data | Signed in, lands on dashboard | Landed on `/dashboard` | PASS |
| 6 | Dashboard | New account with no data | Empty state | "No leads yet" shown | PASS |
| 7 | Leads | Create lead with no name | "Name is required" | Shown | PASS |
| 8 | Leads | Create lead with no email and no phone | "Provide an email or a phone number" | Shown | PASS |
| 9 | Leads | Invalid email | "Enter a valid email address" | Shown | PASS |
| 10 | Leads | Negative budget | "Budget cannot be negative" | Shown | PASS |
| 11 | Leads | Create valid lead | Lead created, detail page opens, toast | Worked | PASS |
| 12 | Leads | Search by company text | List narrows to match | 1 of 3 shown | PASS |
| 13 | Leads | Search with no match | "No leads match your filters" | Shown | PASS |
| 14 | Leads | Change stage via dropdown | Toast confirms the move | Shown | PASS |
| 15 | Leads | Filter by stage | Only that stage listed | 1 lead shown | PASS |
| 16 | Leads | Edit lead company and save | New value shown on detail | Shown | PASS |
| 17 | Leads | Delete lead via confirm dialog | Lead removed from list | 2 remaining | PASS |
| 18 | Follow-ups | Schedule with empty title | "Title is required" | Shown | PASS |
| 19 | Follow-ups | Schedule one due yesterday | Appears flagged Overdue | Flagged | PASS |
| 20 | Follow-ups | Mark complete | Toast, moves to Completed | Worked | PASS |
| 21 | Follow-ups | Completed tab | Lists the completed item | Listed | PASS |
| 22 | Persistence | Refresh browser | Still signed in, data still shown | Worked | PASS |
| 23 | Dashboard | Counts after test data | Total 3, Won 1 | 3 and 1 | PASS |
| 24 | Responsive | 390px viewport | No horizontal scroll | None | PASS |
| 25 | Auth | Log out | Back to `/login` | Worked | PASS |
| 26 | Lead detail | Click a stage in the stepper | Lead moves to that stage, toast shown, stage marked pressed | Worked | PASS |
| 27 | Console | No unexpected console errors | None | 1 message: the 401 from test 3, which is deliberate | FAIL (expected) |

**Row 27 notes:** the only console error is the `401` the browser logs for the wrong-password attempt in test 3. It is not an application bug, but the row is marked FAIL because the strict "no errors at all" check did not pass as written. (Fonts are now bundled, so the earlier font-loading errors are gone.)

## Not yet tested

- MongoDB Atlas itself (see Environment above). Server-side rules, ownership, hashing and token handling are covered by the 39 backend database tests in `backend/test/api.test.js`, not by this browser checklist.
- API error states: 500 and offline/timeout screens were implemented but not triggered in this run.
- The Pending and Overdue dashboard cards were not asserted in the browser run (only Total and Won were). The backend tests check all five against known data.
- Keyboard-only and screen-reader pass, cross-browser (only Chromium used).
- Row 26 (stage stepper) was checked in a separate scripted run, not in the main 28-check walkthrough.
- Dark theme was checked by screenshot only, not by automated assertions.
