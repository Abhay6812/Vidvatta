# VIDVATTA

VIDVATTA is an independent, Maharashtra-focused scholarship information and
student-planning website. It brings scheme listings, category-based browsing,
limited eligibility screening, and personal application-preparation tools
together in one responsive interface.

The project is a static front-end prototype built with HTML, CSS, and vanilla
JavaScript. It has no server-side application, database, authentication
service, or connection that submits applications to MahaDBT.

## Why focus on Maharashtra?

Scholarship opportunities and application rules are often tied to a particular
state, department, education level, community category, course, and admission
route. VIDVATTA focuses on Maharashtra because the MahaDBT portal is the
state's official scholarship directory and application destination, with
school and college schemes spanning multiple state departments.

This state-first scope helps students start with information relevant to
Maharashtra instead of presenting the site as a complete guide to scholarships
across India. It also makes it practical to organize listings by study level
and category, surface the official source for each listing, and explain what
students should verify before applying. VIDVATTA is a guide to those sources,
not a replacement for them.

## Relationship to MahaDBT

VIDVATTA uses the official MahaDBT 2.0 school and college student directories
as references for its scheme catalogue and links students back to MahaDBT for
official details and applications:

- [MahaDBT 2.0 portal](https://mahadbt2.maharashtra.gov.in/)
- [College student schemes](https://mahadbt2.maharashtra.gov.in/college-student)
- [School student schemes](https://mahadbt2.maharashtra.gov.in/school-student)

The catalogue contains 74 listings as represented in this project: 60 college
and 14 school entries. Some English titles are reader-friendly translations;
use the official portal for official wording. Listings and category tags are
for discovery only and do not establish eligibility.

VIDVATTA is independently developed and is **not affiliated with, endorsed by,
or operated by the Government of Maharashtra or MahaDBT**. The official portal
is authoritative. Scheme details, benefits, documents, application windows,
and eligibility rules may change; verify them on MahaDBT before acting.

## Features

### Find and explore schemes

- Browse the student catalogue across school and college levels.
- Search scheme names and departments, filter by study level, and browse
  category tags such as SC, ST, OBC, VJNT, SBC, SEBC, EWS, minority, merit,
  girls/women, and other scheme-specific groups.
- View selected featured schemes and follow links to the official MahaDBT
  directories for current details.
- Compare two catalogue listings by their name, department, level, and
  category tags.

### Eligibility Intelligence

- Create a local demo profile, enter study and household information, and
  answer additional scheme-specific questions.
- Screen against the two scheme rule sets currently represented in the
  application: ST vocational training fee reimbursement and SEBC technical
  education tuition fee scholarship.
- See a possible match, a failed check, or criteria that still need review.
- Show a published benefit percentage only when the represented official
  criteria support showing it. A fee-coverage percentage is not the chance of
  receiving an award or a promise of payment.

The catalogue has 74 listings, but the eligibility screener does **not**
evaluate all 74. Other scheme listings are for discovery and must be checked
individually on MahaDBT. The screener is informational, not an official
eligibility decision.

### Personal student workspace

- **Local profile:** Save a display name and optional education details in the
  current browser.
- **Document checklist:** Track preparation items for the two schemes
  supported by the screener. This is a checklist only; the site does not accept
  file uploads or document numbers.
- **Application tracker:** Manually record a scheme, your own progress status,
  and an optional follow-up date. It does not retrieve application status.
- **Calendar reminders:** Add personal reminder dates. These are not official
  deadlines and do not trigger notifications.
- **My Roadmap:** View suggested preparation steps and mark progress through
  the student journey.
- **VIDVATTA AI guide:** Get curated, rule-based next-step guidance in the
  browser. Despite the menu label, this prototype does not call an AI service.
- **Settings and privacy information:** Review the local-only profile model
  and delete the saved profile and eligibility answers.

### Responsive interface

- Sidebar navigation for the workspace, with a mobile menu for smaller
  screens.
- Responsive layouts intended for desktop, tablet, and phone widths.
- Introductory information, FAQs, and repeated links to official sources.

## Privacy and important limitations

- The account is a **local demo profile**, not secure authentication. It has no
  password, server account, or synchronization between browsers/devices.
- Profile details, eligibility answers, checklist progress, tracker items, and
  reminders are stored in this browser's `localStorage`. Browser storage is
  readable by someone with access to the browser profile and is not encrypted
  by VIDVATTA.
- The site does not send profile data to a VIDVATTA server. Do not enter
  Aadhaar numbers, OTPs, bank details, or other sensitive identifiers.
- Do not upload documents; the prototype has no document-upload feature.
- The site does not submit applications, retrieve live application status,
  fetch current deadlines, or send notifications.
- Only the two stated scheme rule sets are screened. Always confirm full
  criteria, documents, benefit calculations, current availability, and dates
  with the official portal or the relevant institute.

## Run locally

No package installation or build step is required. With Python installed, open
PowerShell in the project folder and run:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open [http://localhost:8000](http://localhost:8000/). Stop the server with
`Ctrl+C`.

Alternatively, open `index.html` directly in a modern browser. Serving the
folder over HTTP is recommended for consistent browser behavior.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page content, navigation, scheme sections, and workspace forms |
| `style.css` | Visual design, responsive layout, and component states |
| `script.js` | Catalogue rendering, filters, profile storage, screening, and workspace interactions |
| `scheme-catalog.js` | The school and college scheme listing data |
| `assets/vidvatta-logo.png` | VIDVATTA logo used in the workspace sidebar and as the browser favicon |
| `README.md` | Project overview, features, setup, and limitations |
| `LICENSE` | MIT License for the project software |

## Development checks

The project currently has no package manifest, build system, or automated test
suite. To check JavaScript syntax with Node.js:

```powershell
node --check .\script.js
node --check .\scheme-catalog.js
```

After changes, also verify the navigation and forms in a browser at desktop
and mobile widths. Test profile-dependent features with temporary data and
remove it afterward using **Settings** or the account dialog.

## Sources and attribution

MahaDBT scheme information and links are referenced for educational discovery.
The scheme catalogue includes names and categories drawn from the official
MahaDBT school and college directories; some displayed English titles are
reader-friendly translations. Verify official wording and rules on MahaDBT.

The interface loads Cormorant Garamond and DM Sans from Google Fonts when
network access is available. The project software's MIT license does not
relicense third-party names, trademarks, government content, or externally
hosted fonts; those remain subject to their respective terms.

## License

The VIDVATTA project software is available under the [MIT License](./LICENSE).
Third-party content and assets are not included in that grant; see
[Sources and attribution](#sources-and-attribution).
