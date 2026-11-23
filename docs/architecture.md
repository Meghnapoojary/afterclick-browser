# AFTERCLICK MVP architecture (0.6.1)

## Process model

- Electron main process owns the desktop window, Chromium `WebContentsView` instances, browser navigation and local demo server.
- The React renderer owns the browser chrome, the single command dispatcher, integrated agent activity pane, provider comparison, demo checkout and evidence receipt.
- `preload.cjs` exposes named browser/agent operations to the React renderer.
- `view-preload.cjs` exposes a narrow command-submit bridge only when the active `WebContentsView` is displaying the local AFTERCLICK start page.
- Remote tabs run with Node integration disabled, context isolation enabled and sandboxing enabled.
- Electron Builder packages the renderer output, Electron process files and local assets into an ASAR-backed Windows application.

## Command lifecycle

1. User enters a command in either the centered start-page field or the browser omnibox.
2. A URL navigates directly. An ordinary query invokes AFTERCLICK Search and opens the branded local result page. Appointment-related supported requests start the controlled appointment workflow.
3. Unsupported autonomous tasks are not claimed as complete; the MVP explains its current appointment-only execution scope.
4. The agent creates a Goal Contract, opens three controlled provider websites, checks time and price constraints, and presents a comparison in the right activity pane.

## Appointment and payment lifecycle

1. User selects a provider and enters the name the appointment should be booked under.
2. User selects a clearly labelled demo payment method (UPI demo or card demo). Real payment credentials are never collected.
3. On explicit user confirmation, the local server creates an `AUTHORIZED_DEMO` payment record. No real money moves.
4. The provider page submits the appointment request with that authorization. A successful appointment commit writes one booking record and changes the payment record to `CAPTURED_DEMO`.
5. If the provider request is lost before commit, authoritative history returns zero records and the pending demo authorization is changed to `VOIDED_DEMO`. A new attempt needs fresh user approval and a new demo authorization.
6. If the provider commits then drops the response, AFTERCLICK queries the independent ledger, finds the booking, and does not resubmit.

## Outcome assurance states

- One matching ledger record: `VERIFIED`.
- More than one matching record: `DUPLICATE_DETECTED`; block further submissions.
- An authoritative query with zero matches: `NOT_BOOKED`; pending demo authorization is voided; a retry requires a new checkout and explicit approval.
- An unavailable or inconclusive history source: `UNCERTAIN`; keep the task on hold and expose a read-only recheck.

## AFTERCLICK Search

The React command dispatcher treats an input as a URL, a supported appointment task, a page-understanding request, or a general web query. General queries call the `agent:web-search` IPC operation. The Electron main process retrieves structured result links/snippets from DuckDuckGo's HTML endpoint, stores a short-lived result session in memory, and opens a local branded results document at `/search/:id`. Search result links navigate in the Chromium view. If structured results are unavailable or the page structure changes, AFTERCLICK displays an explicit fallback link to the provider's full results page. The right activity panel mirrors the query and source list. No Google result page is opened by the generic query path.

## Booking event stream and printable receipt

The Electron main process publishes `agent-stage` events to the React renderer during the controlled booking lifecycle: preflight history check, booking submission, provider response received or confirmation signal lost, independent history lookup, and final outcome. The React booking-journey view renders these events as a visible sequence. A lost browser response is explicitly distinguished from a failed booking; the authoritative local ledger determines `VERIFIED`, `NOT_BOOKED`, `UNCERTAIN` or `DUPLICATE_DETECTED`. The receipt view includes a dedicated print region. `window.print()` opens the desktop print dialog while print CSS hides browser chrome, agent controls and supporting audit widgets, leaving the appointment acknowledgement suitable for paper or Save as PDF.

## Trust and product boundaries

- All provider websites and booking/payment records are local test fixtures. No real clinic appointment is created and no real payment is processed.
- The appointment planner is deterministic. This version does not connect to an external LLM.
- General web search works, but autonomous task execution is currently appointment-only.
- The local ledger and payment records are in-memory; persistence is future work.
