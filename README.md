# AFTERCLICK

**Browse. Understand. Act. Verify.**  
*A browser that turns intentions into verified outcomes.*

AFTERCLICK is an Electron desktop-browser MVP that brings normal browsing and a guided task workflow into one interface. A single command bar routes website addresses, web searches, page-understanding requests and the currently supported appointment-booking demonstration. The integrated activity panel shows the agent's plan, approvals, actions and evidence.

> **MVP notice:** Appointment providers, booking history and checkout are controlled local demo fixtures. No real appointment is created and no real payment is processed. The appointment planner is deterministic in this version; AFTERCLICK does not yet connect to an external LLM.

## What the MVP demonstrates

| Capability | Demonstration |
| --- | --- |
| Desktop browser | Electron + Chromium `WebContentsView`, multiple tabs, address bar, navigation and ordinary website browsing |
| One command surface | The home-page command field and browser omnibox share the same dispatcher |
| AFTERCLICK Search | General queries are presented in a branded results page with source links and snippets |
| Page understanding | Extracts visible page text and produces a short extractive summary |
| Goal Contract | Captures the requested outcome, preconditions, constraints and expected postconditions for the supported task |
| Multi-site research | Opens three controlled provider pages and reads their appointment details |
| Comparison | Filters appointment options against the time window and price limit, then recommends an eligible option |
| Human approval | Requires the user to choose a provider, enter the appointment name and approve the demo checkout before submitting |
| Outcome assurance | Checks an independent local booking ledger instead of trusting a browser success message |
| Recovery | Demonstrates both a committed booking with a lost response and a request dropped before commit |
| Evidence receipt | Shows the booking details, simulated payment state, booking reference, history result and action journal; the acknowledgement is printable / Save as PDF |

## The key demonstration: execution is not completion

The Carewell test provider intentionally creates the appointment record and then drops the confirmation response. AFTERCLICK displays the connection interruption, pauses the workflow, checks the independent booking ledger, finds exactly one matching record and reports `LOST · RECOVERED`. It does not submit the booking a second time.

The Northstar test provider demonstrates the other branch: its first request is dropped before a booking is committed. AFTERCLICK confirms an authoritative zero-result history check, marks the task `NOT_BOOKED`, and requires a fresh user approval and demo payment authorization before a new attempt.

If the history source itself is unavailable or inconclusive, the task remains `UNCERTAIN`; the follow-up action is read-only and does not resubmit the booking.

## Project architecture

- **Electron main process:** owns the desktop window, Chromium `WebContentsView` tabs, browser navigation, local demo server, local provider fixtures, simulated payment records, booking ledger and workflow orchestration.
- **React + TypeScript renderer:** owns the browser chrome, shared command dispatcher, agent activity panel, provider comparison, demo checkout and printable receipt.
- **Preload bridges:** expose a narrow set of named browser and agent operations through `contextBridge`. Remote websites do not receive Node.js integration.
- **Vite:** builds the renderer into `dist/`.
- **Electron Builder:** packages the desktop app and creates a Windows x64 NSIS installer.

See [`docs/architecture.md`](docs/architecture.md) for the process model and task lifecycle, [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md) for the first GitHub push, and [`docs/INSTALLER.md`](docs/INSTALLER.md) for Windows packaging.

## Quick start: run from source

### Requirements

- Windows 10/11, macOS or Linux on an Electron-supported desktop environment
- Node.js 22.12 or newer
- npm 10 or newer

### Install and start

```bash
npm install
npm run dev
```

On Windows, `start.bat` can also install dependencies if needed and start the development application.

### Production renderer build

```bash
npm run build
npm start
```

## Windows installer

AFTERCLICK uses Electron Builder's NSIS target. The installer provides a setup wizard, lets the user choose an installation directory, and can create Start Menu and desktop shortcuts.

On a Windows x64 machine, either double-click `build-installer.bat`, or run:

```powershell
npm install
npm run dist:win
```

The installer is generated in `release/` with a name similar to:

```text
AFTERCLICK-Setup-0.6.1-x64.exe
```

Other packaging commands:

```powershell
# Create an unpacked Windows app directory for troubleshooting
npm run pack:win

# Create a portable executable rather than an install wizard
npm run dist:win:portable
```

Read [`docs/INSTALLER.md`](docs/INSTALLER.md) for local packaging, GitHub Actions and release-tag instructions.

### Downloading a built installer

After the repository is published, pushes to `main` and manual workflow runs build a Windows installer and upload it as a GitHub Actions artifact. Pushing a version tag such as `v0.6.1` also creates a GitHub Release and attaches the `.exe` installer. The release is produced by `.github/workflows/windows-installer.yml`.

The installer is currently **unsigned** because no Authenticode certificate is configured. This is acceptable for a hackathon MVP, but a public production release should be signed and should publish checksums.

## Demo walkthrough

1. Start AFTERCLICK. The browser opens a clean new-tab page with one command field.
2. Enter a normal query such as `best budget laptops` to use AFTERCLICK Search, or enter a website URL to navigate.
3. Enter: `Find an appointment tomorrow between 4 PM and 6 PM, under ₹500. Compare three providers and recommend the best available option.`
4. AFTERCLICK opens three controlled provider pages and compares their fees, slots, ratings and areas.
5. Select a provider and continue to the demo checkout. Enter the name for the appointment and select `UPI demo` or `Card demo`.
6. Read the notice explaining that checkout is a simulation, then explicitly authorize the demo payment and booking.
7. For Carewell, observe the request being submitted, the confirmation response being lost, and the independent booking-history check. The provider ledger confirms one booking, so AFTERCLICK reports `LOST · RECOVERED` without resubmitting.
8. Open the receipt to inspect the booked-under name, provider, date, time, area, booking reference, simulated payment reference and verification result. Use **Print / Save PDF** to print the acknowledgement or save it as a PDF.
9. Start a fresh task and select Northstar to test the pre-commit failure and explicitly approved retry path.
10. Use **Test temporary history outage (demo)** to test `UNCERTAIN`. The recheck is read-only and does not submit another booking.

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── windows-installer.yml  # CI build and tagged GitHub Release
├── docs/
│   ├── architecture.md            # Electron/browser/agent architecture
│   ├── GITHUB_SETUP.md            # First repository push instructions
│   └── INSTALLER.md               # Windows packaging instructions
├── electron/
│   ├── assets/                    # Mascots and application icon
│   ├── main.cjs                   # Browser, local server and workflow orchestration
│   ├── preload.cjs                # Narrow renderer bridge
│   └── view-preload.cjs           # Start-page-only command bridge
├── scripts/
│   └── dev.cjs                    # Development server and Electron lifecycle
├── src/
│   ├── App.tsx                    # Browser UI, agent activity, checkout and receipt
│   ├── global.d.ts                # Renderer API/data types
│   ├── main.tsx                   # React entry point
│   └── styles.css                 # AFTERCLICK UI styles
├── build-installer.bat            # One-click local Windows installer build
├── start.bat
├── CHANGELOG.md
├── index.html
├── package.json                  # Electron, Vite and NSIS build configuration
├── tsconfig.json
└── vite.config.mts
```

## Security and scope boundaries

- External pages run with Node integration disabled, context isolation enabled and sandboxing enabled.
- The renderer receives named operations through `contextBridge`; raw `ipcRenderer` and Node APIs are not exposed to the React UI.
- The start-page command bridge is restricted to the local AFTERCLICK origin.
- Demo providers and the booking/payment ledgers are local test fixtures. No real clinic booking is made and no real money is charged.
- Demo payment methods do not collect card details, UPI PINs or bank credentials.
- Task execution is currently limited to the controlled appointment workflow. Unsupported autonomous tasks are not claimed as completed.
- Appointment planning and provider ranking are deterministic; this MVP has no external LLM integration.
- Search retrieves and presents result links/snippets. It does not yet synthesize a research answer with an LLM.
- Booking and demo payment records are in memory and reset when the local demo server restarts.
- This is a hackathon MVP, not a hardened browser product. Production work would require permission mediation, stricter navigation/download policies, persistent storage, real provider adapters, a compliant payment integration, signing and security review.

## Current version

**0.6.1** — packaging and repository preparation on top of the 0.6.0 visual recovery and printable acknowledgement build. See [`CHANGELOG.md`](CHANGELOG.md).
