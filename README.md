# VIDVATTA

**Knowledge. Opportunity. Empowerment.**

VIDVATTA is an independent scholarship-guidance and planning website for
students in Maharashtra. It brings a curated selection of MahaDBT-referenced
scheme listings, a limited eligibility screener, document checklists, and
local planning tools together in one browser-based journey.

VIDVATTA is not a Government of Maharashtra or MahaDBT service. It does not
connect to MahaDBT, submit applications, retrieve application status, or make
official eligibility decisions. Students must verify current rules and apply
through official government portals.

## Original problem statement

The hackathon problem statement is **“GRANTLY — Rethinking the Scholarship
Experience.”** It describes four challenges: discovering educational
assistance, understanding scholarship options, navigating application
processes, and keeping important information organized. **VIDVATTA is the
proposed solution** to those challenges; GRANTLY is not the product name.

## Why Maharashtra?

Scholarship rules are often determined by state, department, education level,
community category, course, and admission route. Maharashtra is VIDVATTA's
initial audience and implementation scope. The MahaDBT scholarship ecosystem
is the primary reference for the catalogue and official links, so students can
start with information relevant to Maharashtra rather than an incomplete
all-India directory.

MahaDBT is the authoritative source for current scheme details, application
windows, documents, and decisions. VIDVATTA is independently developed and is
not affiliated with, endorsed by, or operated by MahaDBT or the Government of
Maharashtra.

## Problem-to-feature mapping

| Original problem | VIDVATTA feature | What it does |
| --- | --- | --- |
| Discover educational financial assistance | Scholarship Discovery | Searches scheme names and departments; filters the selected directory by category and study level; links to official MahaDBT directories. |
| Understand available options | Eligibility Intelligence and Scholarship Comparison | Screens two represented rule sets, separates matching, failed, and unverified checks, and compares directory facts without treating a match as an award prediction. |
| Navigate application processes | Document Assistant, Student Roadmap, and official portal links | Tracks checklist marks locally, suggests a next step, and directs students to MahaDBT for official requirements and applications. |
| Keep important information organized | Application Tracker and Calendar Reminders | Saves manually entered statuses and personal dates in the current browser; it does not fetch application status or send notifications. |

The homepage section **“Your Scholarship Journey, Simplified”** links each
stage to its working module. The Student Roadmap adds the profile-first path:
profile, discovery, eligibility, documents, official portal, and manual
tracking.

## Features

- **Scholarship Discovery:** Search and filter school and college listings by
  category and study level. Each listing links to the relevant official
  directory. The current curated directory contains 72 entries (58 college
  and 14 school); one duplicate title and one unnamed placeholder were
  excluded. It is not a complete or live catalogue.
- **Eligibility Intelligence:** Screens only two rule sets represented in
  `eligibility-rules.js`: ST vocational training fee reimbursement and SEBC
  technical education tuition fee scholarship. Results show matching, failed,
  and unverified conditions. A failed SSC branch is left unverified rather
  than receiving an inferred benefit percentage. A potential match is not an
  approval or award prediction. The reusable matcher explains category and
  study-track scope; academic marks are not applied as a criterion because no
  verified threshold is represented for these rules.
- **Document Assistant:** Saves checklist marks for the two supported rule
  sets, shows a readiness percentage and remaining items, and links to the
  MahaDBT student directory. Readiness is self-reported, not document
  verification. It never accepts files, document numbers, or document
  metadata.
- **Application Tracker:** A six-stage, locally saved Kanban pipeline:
  Discovered, Eligibility Checked, Documents in Preparation, Ready to Apply,
  Submitted, and Completed / Result Awaited. Students can drag cards or use
  the stage selector, edit scheme/notes/deadlines, and remove entries.
- **Calendar Reminders:** Adds and removes personal reminders, validates
  titles and dates, and separates upcoming reminders from past entries.
- **Scholarship Comparison:** Compares two different listings by name,
  department, study level, category, and supported benefit details.
- **Fee-component estimate:** Applies the represented SEBC tuition and
  examination fee percentages to amounts entered by the student, only when
  the relevant rule checks are fully matched. The estimate is not an approved
  amount; ST training benefit amounts and other fee components are not
  estimated.
- **VIDVATTA AI guide:** Provides curated, rule-based answers in the browser.
  English and Marathi guidance covers matching, documents, fee percentages,
  official applications, and manual tracking. It is not a live AI model and
  does not send questions or profile details to an AI service.
- **Student Roadmap:** Shows completed steps and a next recommended action
  based on profile, discovery, eligibility, checklist, portal, and tracker
  activity.
- **Local profile and privacy controls:** Stores the demo profile and work
  data in this browser's `localStorage`; users can remove the saved profile.
  Eligibility collects an income band rather than an exact amount. Profile
  academic percentage is optional context and is not used to invent a
  matching threshold.

## Technology and architecture

VIDVATTA is a static front-end application built with HTML, CSS, and vanilla
JavaScript. There is no backend, database, build process, or runtime service.
See [ARCHITECTURE.md](./ARCHITECTURE.md) for the architecture diagrams and
runtime/data-flow details.

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic page structure, navigation, discovery filters, journey links, and workspace forms |
| `style.css` | Visual system, responsive layouts, focus states, and reduced-motion behavior |
| `scheme-catalog.js` | Scholarship listing data used by discovery, tracker, and comparison |
| `eligibility-rules.js` | Reusable rule matching, eligibility classification, and supported fee estimates; exports functions for Node tests |
| `local-profile-storage.js` | Local profile read/write/delete operations with testable error handling |
| `script.js` | DOM rendering, filtering, validation, and interaction wiring |
| `tests/` | Node rule/storage tests and Playwright browser tests |
| `assets/` | VIDVATTA logo and favicon |

User-provided text is rendered through text nodes and `textContent`, not
interpolated as HTML. No passwords, Aadhaar numbers, OTPs, bank details, or
document contents are requested or stored by the application. New income
answers use bands rather than exact family income amounts.

## Run locally

Install Node.js and Python, then open PowerShell in the project directory:

```powershell
npm install
python -m http.server 8000 --bind 127.0.0.1
```

Open [http://localhost:8000](http://localhost:8000/) in a browser. Stop the
server with `Ctrl+C`.

## Automated tests

Install the Playwright Chromium browser once:

```powershell
npx playwright install chromium
```

Run the unit and browser tests:

```powershell
npm test
```

The unit tests cover eligibility outcomes, unknown income, rule matching,
supported fee estimates, and local storage error cases. Playwright covers
initial loading, internal links, search and filters, eligibility validation,
checklist persistence/readiness, tracker CRUD and stage changes, reminders,
comparison, fee estimates, Marathi guidance, keyboard-operable mobile
navigation, browser page errors, and horizontal overflow at 360, 390, 768,
1024, and 1440 CSS pixels with both a fresh and populated dashboard.

## Deploy to Vercel

This is a static site; no build or server function is required.

1. Import the repository into Vercel.
2. Select the **Other** framework preset.
3. Set the project root to the directory containing `index.html`.
4. Leave the build and install commands empty; set the output directory to
   `.` (the project root).
5. Deploy and verify the site and assets in the Vercel preview.

The Playwright dependency is only for local development and does not change
the static runtime. Do not configure API keys or secrets for this project.

## Current limitations

- The scheme directory is curated and static. It is not a complete catalogue,
  live feed, or guarantee that a scheme is currently open.
- Only the two documented rule sets listed above are screened. Other
  directory entries must be checked directly with MahaDBT.
- The fee estimate supports only the represented SEBC tuition and examination
  fee components. It cannot infer an approved amount, other fee support, or
  the outcome of an application.
- Academic marks are collected only as optional profile context and are not
  used in matching because this implementation does not represent a verified
  marks threshold for the supported rule sets.
- Eligibility results are an informational checklist, not a government
  decision, approval, or probability of receiving funds.
- The local profile has no password, server account, encryption, or
  cross-device synchronization. Browser profile users may be able to read its
  `localStorage`.
- Application statuses and reminder dates are entered by the student. The
  site does not send notifications or fetch live MahaDBT status.
- No scholarship application is submitted from VIDVATTA.
- The rule-based guide is fixed content, not a live AI or government
  integration.

## Sources and license

The catalogue and official links reference the [MahaDBT 2.0
portal](https://mahadbt2.maharashtra.gov.in/), including its [college student
directory](https://mahadbt2.maharashtra.gov.in/college-student) and [school
student directory](https://mahadbt2.maharashtra.gov.in/school-student).
Displayed English scheme names may be reader-friendly translations; consult
MahaDBT for official wording and current requirements.

The VIDVATTA project software is available under the [MIT
License](./LICENSE). The license does not apply to third-party names,
trademarks, government content, or externally hosted fonts.
