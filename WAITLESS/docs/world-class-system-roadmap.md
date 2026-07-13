# WaitLess World-Class System Roadmap

This roadmap turns the final-year project amendments into implementation slices that can be built and verified inside the current WaitLess codebase.

## Current Foundation

- React frontend with React Router, Tailwind CSS, Axios, live refresh hooks, and queue pages.
- Node.js backend with MySQL/file repository support, role-based staff login, ticket registration, triage, queue board, dashboard analytics, tracking, notifications, and live events.
- Active database: `waitless_app`.
- Default hospital model: Chinhoyi Provincial Hospital with OPD, Casualty / Triage, Pharmacy, Laboratory, Radiology, and OI Clinic.

## Branding And Theme

- Primary: Medical teal `#0F766E`.
- Secondary/accent: Hospital blue `#2563EB`.
- Status colours are separated from branding colours.
- Triage colours remain clinically meaningful: red, yellow, green, and black.
- Logo concept combines reduced waiting time, healthcare, patient flow, and completion.

## Phase 1: Patient Intake And Privacy

- Electronic patient registration.
- Returning patient search.
- Patient category identification.
- Next of kin capture.
- Notification consent.
- Anonymous public token display.
- QR code patient/visit card.

## Phase 2: Triage And Safety

- Digital triage assessment with symptoms, vitals, pain level, and risk indicators.
- Colour-coded priority assignment with manual nurse override.
- Emergency fast-tracking for red cases.
- Reassessment alerts for long-waiting red/yellow patients.

## Phase 3: Queue Workflow

- Department-specific queues.
- Call next patient by department and priority.
- Missed turn and recall handling.
- Queue transfer between OPD, lab, radiology, pharmacy, OI Clinic, and review queues.
- Waiting time estimation and bottleneck detection.

## Phase 4: Department Modules

- Doctor-to-lab routing and lab turnaround tracking.
- Doctor-to-pharmacy routing and prescription-ready notifications.
- Pharmacy stock issue flags.
- OI Clinic service streams for ART, TB, viral load, counselling, and screening.

## Phase 5: Dashboards And Reporting

- Department dashboards.
- Admin and hospital manager dashboards.
- Daily patient report.
- Waiting time report.
- Department performance report.
- No-show report.
- Triage report.
- CSV, Excel, and PDF exports.

## Phase 6: Notifications And Display Boards

- WhatsApp queue notifications.
- Web push notifications.
- Notification retry queue.
- Notification audit log.
- Waiting-area display board.
- Department display boards.
- Audio calling for token numbers.

## Phase 7: Advanced Readiness

- Low-bandwidth/local network operation.
- Auto-save forms.
- Appointment booking and reminders.
- Multi-hospital configuration.
- Multi-language labels and patient messages.
- Predictive waiting time and bottleneck alerts.

## Implementation Rule

Every feature should update both the user interface and the stored backend data where required. A feature is only considered complete when it can be run, built, and verified from the `WAITLESS` project folder.
