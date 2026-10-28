# Frontend Test Checklist

**What was run:** a scripted Playwright (Chromium) walkthrough of the production build (`npm run build` + `vite preview`) at 1440×900, plus a 390×844 mobile pass.

**Important:** the backend does not exist yet. These tests ran against a **throwaway mock of the API contract** (kept outside the repo), so they prove the UI logic and contract handling, **not** the real backend, hashing, JWT verification or MongoDB persistence. "Persistence" below means the session and data survived a browser refresh against the mock only.

Re-run this checklist against the real API once it is built.

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
| 22 | Persistence | Refresh browser | Still signed in, data still shown (mock) | Worked | PASS |
| 23 | Dashboard | Counts after test data | Total 3, Won 1 | 3 and 1 | PASS |
| 24 | Responsive | 390px viewport | No horizontal scroll | None | PASS |
| 25 | Auth | Log out | Back to `/login` | Worked | PASS |
| 26 | Console | No unexpected console errors | None | 2 messages, both explained below | FAIL (environmental) |

**Row 26 notes:** the two console errors were (a) Google Fonts blocked by the sandbox network (so screenshots used fallback fonts), and (b) the deliberate `401` from test 3. Neither is an application bug, but the row is marked FAIL because the strict check did not pass as written.

## Not yet tested

- Anything involving the real backend: password hashing, JWT expiry/signature checks, record-ownership checks (403/404), duplicate-email 409, server-side validation, MongoDB persistence.
- API error states: 500 and offline/timeout screens were implemented but not triggered in this run.
- Dashboard "Pending follow-ups" and "Overdue" metrics against real data (the mock computed them, the real API must).
- Keyboard-only and screen-reader pass, cross-browser (only Chromium used).
