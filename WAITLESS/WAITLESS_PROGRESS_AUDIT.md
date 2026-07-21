# WaitLess Proposal and Amendments Progress Audit

Audit date: 21 July 2026

Documents reviewed:

- `WaitLess_Proposal_1.pdf`
- `WORLD CLASS WAITLESS -DIGITAL QUE SYSTEM AMMENDMENTS.pdf`

Implementation reviewed:

- `frontend/src`
- `backend/src`
- Active backend configuration and running API on port 4242

## 1. Executive Status

The current system is a usable queue-management prototype with a strong staff dashboard and a working live queue core. Registration, priority ordering, queue calls, missed turns, recalls, transfers, patient tracking, dashboard metrics, display-board notifications, and notification retry records are implemented.

It is not yet ready for production hospital deployment. Security, clinical-record depth, real notification delivery, offline continuity, reporting, appointments, specialist department workflows, testing, and evaluation remain incomplete.

### Expanded amendments score

The amendments contain 83 individually numbered features.

| Status | Count | Meaning |
| --- | ---: | --- |
| Complete | 22 | A working end-to-end implementation is visible in the current code. |
| Partial | 29 | Some UI, API, or business logic exists, but a required part is missing or unverified. |
| Not started | 32 | No substantive working implementation was found. |

Weighted progress: **44.0%**

Calculation: `(22 complete + 0.5 x 29 partial) / 83`. This is a requirements-coverage indicator, not an effort estimate. Large items such as offline operation, security, and multi-hospital support require more effort than many smaller items.

Overall assessment: **Core operational MVP works; production readiness and expanded scope are incomplete.**

## 2. Verification Performed

| Check | Result |
| --- | --- |
| Frontend production build | Passed (`vite build`, 2,532 modules transformed) |
| Frontend lint | Passed with 0 errors and 11 Fast Refresh warnings |
| Backend health endpoint | Passed |
| Public metadata endpoint | Passed; 6 departments returned |
| Public queue-board endpoint | Passed; current queue data returned |
| Automated test suites | Initial backend suite added; 2 returning-patient tests pass |
| Active persistence mode | MySQL |
| Active WhatsApp provider | Mock, not live Meta Cloud delivery |
| CORS policy | `*`, too broad for production |

The generated frontend bundle is large (about 1.86 MB before gzip), and Vite reports a chunk-size warning. This is a performance improvement item, especially for low-bandwidth use.

## 3. Proposal Objective Progress

| Proposal objective | Status | Evidence and remaining work |
| --- | --- | --- |
| Analyse patient flow and requirements by May 2026 | Partial | The proposal and 83-feature amendment set provide a strong requirements base. No repository evidence of signed stakeholder validation, formal SRS acceptance, or completed hospital workflow study was found. |
| Build triage, multi-department routing, live monitoring, WhatsApp, and web push by August 2026 | Partial | Registration, four-level priority, department queues, SSE live refresh, tracking, dashboard operations, and notification retry are present. Full triage assessments, automatic routing, real WhatsApp validation, and web push are missing. |
| Evaluate usability, efficiency, and low-bandwidth performance by October 2026 | Not started | No Jest/API/integration/UAT/performance suite, SUS results, patient satisfaction study, baseline comparison, or evaluation dataset was found. |

### Technical implementation compared with the proposal

| Proposal commitment | Current state |
| --- | --- |
| React frontend | Implemented |
| Node/Express REST backend | Node REST API is implemented with a custom HTTP router; Express is installed but not used for the current API |
| WebSocket real-time updates | Real-time behavior is implemented with Server-Sent Events plus polling fallback, not WebSocket |
| MySQL persistence | Active for patient profiles, tickets, and notifications; the runtime schema does not yet cover clinical triage assessments, appointments, prescriptions, tests, audit logs, feedback, or service logs |
| WhatsApp Business API | Meta Cloud provider code exists, but the active provider is `mock` |
| Web push | Not implemented |
| LAN/offline continuity | The server can operate on a local network and queue records are persistent, but offline interruption/recovery and browser form auto-save are not complete or tested |

## 4. Production Release Blockers

These should be resolved before a hospital pilot handles real patient information.

| Priority | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| Critical | Anyone can reach staff account creation and request the `admin` role | `/admin/staff-register` is public in `frontend/src/App.jsx`; `POST /api/auth/staff-register` has no staff-auth wrapper in `backend/src/index.js` | Restrict creation to authenticated administrators, enforce server-side role permissions, and remove the public route |
| Critical | Staff and patient passwords are stored and compared as plaintext | `backend/src/services/authService.js` and `backend/src/services/patientAuthService.js` | Hash with bcrypt/Argon2, migrate existing accounts, add password policy and secure reset handling |
| High | No action-attributed audit trail | No runtime audit table or API was found | Record login, registration, triage override, call, transfer, status change, retry, profile change, and administrative action with actor/time/before/after values |
| High | Runtime clinical data model is too shallow | Patient profiles, tickets, notifications, attempts, counters, and departments exist, but clinical workflow entities do not | Add encounters, triage observations, service events, orders, appointments, staff assignments, consent, feedback, and audit tables |
| High | Notification channels are not proposal-complete | Active WhatsApp mode is mock; web push is absent | Configure Meta Cloud in a test environment, add web push, and complete end-to-end delivery/failure/recovery tests |
| High | Automated quality coverage is still minimal | Two returning-patient tests exist; authentication, queue operations, notification, API, and browser workflows remain uncovered | Expand the test suite to priority ordering, authentication, RBAC, retries, transfer, recall, privacy, and outage recovery |
| High | Sessions are memory-only and CORS is unrestricted | Sessions use in-process maps; active `CORS_ORIGIN=*` | Persist/revoke sessions securely, rotate tokens, restrict origins, add secure headers and rate limiting |
| High | Triage is priority assignment, not a clinical assessment | `frontend/src/pages/triage.jsx` assigns color only | Capture vitals, symptoms, pain, severity, emergency indicators, assessor, timestamps, and reassessments |

## 5. Full Amendments Traceability Matrix

### Module 1: Patient Registration

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 1.1 | Electronic patient registration | Complete | Staff registration captures demographics, national ID, phone, address, category, next of kin, complaint, department, and consent; the backend creates a queue visit. |
| 1.2 | Returning-patient search and history | Complete | Persistent patient profiles and permanent patient numbers now link repeat visits across MySQL/file storage. Reception can search by name, phone, national ID, patient number, previous ticket, or a scanned WaitLess QR payload and reuse the record without duplication. |
| 1.3 | Unique queue token across print, phone, WhatsApp, and display | Partial | Unique tokens, tracking, WhatsApp records, and display use exist. Printing and department-style tokens such as `OPD-025` are absent. |
| 1.4 | QR patient card | Not started | No QR generation, scan, or patient-card workflow was found. |
| 1.5 | Patient category classification | Complete | Walk-in, referred, emergency, elderly, pregnant, child, disabled, and chronic categories are defined. |

### Module 2: Patient Self-Service

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 2.1 | Online pre-registration and arrival activation | Partial | Public self-registration exists, but it immediately creates a live queue ticket; receptionist verification/arrival activation is absent. |
| 2.2 | Self check-in by QR, phone, or kiosk | Not started | No arrival check-in workflow or kiosk/QR interface was found. |
| 2.3 | Live patient queue-status page | Complete | Tracking shows token, department, position, patients ahead, ETA, progress, directions, and notification history. |
| 2.4 | Patient feedback form | Not started | No satisfaction, cleanliness, communication, or wait-time feedback workflow/API was found. |

### Module 3: Triage

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 3.1 | Digital triage assessment | Partial | Chief complaint and priority are recorded. Symptoms, vitals, pain score, severity, emergency indicators, and a structured assessment record are absent. |
| 3.2 | Red/yellow/green/black classification | Complete | All four priorities and their sorting/display metadata are implemented. |
| 3.3 | Automatic emergency fast tracking and alert | Partial | Red tickets sort first and appear in critical metrics. There is no rules-based assessment that automatically assigns red or sends a dedicated emergency escalation. |
| 3.4 | Triage reassessment alerts | Complete | Red/yellow wait thresholds produce reassessment alerts on the dashboard. |
| 3.5 | Manual triage override | Complete | Authorized triage staff can change a ticket's priority. Audit attribution is still missing. |

### Module 4: Queue Management

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 4.1 | Automatic queue assignment after registration/triage | Partial | Registration places the patient in a selected department queue. Clinical rules do not automatically choose the department after triage. |
| 4.2 | Department-specific queues | Complete | Six departments are supported with filtered queue views and metrics. |
| 4.3 | Call next by priority, arrival, and department | Complete | Backend sorting and department call-next behavior are implemented. |
| 4.4 | Mark a missed turn | Complete | Called tickets can be marked missed and displayed in a recall lane. |
| 4.5 | Fair recall | Partial | Recall exists, but it resets registration time and sends the ticket to the back; configurable rules such as reinsertion after three patients are absent. |
| 4.6 | Queue transfer | Complete | Staff can transfer a non-completed ticket to another department and notify the patient. |
| 4.7 | Dynamic ETA | Partial | Position-aware ETA exists, but uses a fixed formula rather than historical service time, staffing, and priority mix. |
| 4.8 | Bottleneck detection | Partial | Busiest/current department load is displayed. Threshold alerts and predictive bottleneck detection are absent. |

### Module 5: Department Routing

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 5.1 | Automatic routing rules | Partial | Manual department selection and transfer exist; clinical workflow rules do not route automatically. |
| 5.2 | Doctor-to-laboratory order and return workflow | Not started | No test order, specimen, result, or route-back model was found. |
| 5.3 | Doctor-to-pharmacy workflow | Partial | Tickets can be transferred to Pharmacy, but there is no prescription, dispensing, ready, or collected workflow. |
| 5.4 | OI clinic service-stream routing | Not started | OI Clinic exists only as one department; ART/TB/viral-load/counselling/cervical streams are absent. |

### Module 6: Staff Dashboard

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 6.1 | Live queue dashboard | Complete | Live metrics, queue table, patient actions, alerts, and SSE/polling refresh are implemented. |
| 6.2 | Department dashboards | Partial | Department load pages and dashboard filtering exist, but staff are not fully restricted/scoped to their assigned department. |
| 6.3 | Administrator dashboard | Complete | Admin navigation, staff profile, queue overview, reports/analytics views, notifications, and settings are present. |
| 6.4 | Operational alert set | Partial | Critical, reassessment, and notification-failure signals exist. Explicit long-queue and no-staff alerts are missing. |

### Module 7: Notifications

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 7.1 | WhatsApp notifications | Partial | Registration, turn, call, missed, and transfer messages plus Meta Cloud integration code exist; active runtime delivery is mock and not end-to-end verified. |
| 7.2 | Web push notifications | Not started | Local browser notification preferences exist, but no push subscription, service worker, push server, or delivery API was found. |
| 7.3 | Automatic/manual retry | Complete | Retry scheduling, manual retry, bulk retry, attempt limits, and restart recovery are implemented. |
| 7.4 | Notification delivery log | Complete | Notification and attempt records include status, timestamps, provider ID, error details, and retry context. |
| 7.5 | Missed-turn notification | Complete | A missed-turn notification is dispatched when a called ticket is marked missed. |

### Module 8: Queue Display Screens

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 8.1 | Waiting-area display board | Complete | A public real-time board shows serving, waiting, and missed token numbers without patient names. |
| 8.2 | Department-specific display boards | Partial | Department data is available, but dedicated per-department board modes/screens were not found. |
| 8.3 | Audio calling | Not started | No speech/audio announcement system was found. |

### Module 9: Reporting

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 9.1 | Daily report by department/service/gender/age/triage | Not started | The Reports page shows current headline metrics only; required dimensions and historical query APIs are absent. |
| 9.2 | Average waiting time by department | Partial | An overall average exists; department historical averages and date filters are absent. |
| 9.3 | Department performance | Partial | Current load is visible, but historical patients served, service time, wait time, and queue length reports are absent. |
| 9.4 | No-show and notification-effect report | Partial | Missed counts and notification metrics exist separately; no historical correlation report exists. |
| 9.5 | Triage report | Partial | Current priority counts exist; triage timing, outcome, override, and trend reports are absent. |
| 9.6 | PDF/Excel/CSV export | Not started | No report export implementation was found. |

### Module 10: Analytics

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 10.1 | Peak-hours analysis | Not started | Notification volume by hour exists, but patient-arrival/service peak analysis does not. |
| 10.2 | Queue-congestion prediction | Not started | No predictive model or historical congestion forecast was found. |
| 10.3 | Resource-allocation suggestions | Not started | Current load is displayed without staffing recommendations. |

### Module 11: Security and Access Control

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 11.1 | Role-based access control | Partial | Route/API role checks exist for reception, triage, clinician, and admin. Public staff creation and incomplete department scoping prevent acceptance. |
| 11.2 | Secure individual login and action attribution | Partial | Individual staff login exists. Passwords are plaintext, sessions are memory-only, and operational actions do not record the staff actor. |
| 11.3 | Audit trail | Not started | Notification attempts are logged, but this is not a system/user action audit trail. |
| 11.4 | Automatic idle logout | Not started | Sessions expire after a fixed lifetime, but no inactivity timer or idle warning/logout was found. |

### Module 12: Privacy and Confidentiality

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 12.1 | Anonymous public displays | Complete | The public queue board uses ticket tokens rather than patient names. |
| 12.2 | Notification consent | Complete | Consent is captured and controls WhatsApp activation. |
| 12.3 | Confidential OI mode | Not started | No OI-specific privacy mode, masked routing, or restricted data view was found. |

### Module 13: Offline and Connectivity

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 13.1 | Local-network hosting | Partial | The Node/MySQL application can be hosted on a LAN, but a documented and tested hospital LAN deployment package was not found. |
| 13.2 | Core queue operation without internet | Partial | Core processing and MySQL do not require public internet, but outage/restart behavior and local-network failure recovery are not tested. |
| 13.3 | Queue notifications until internet returns | Partial | Persistent retry records and startup recovery exist. Actual disconnect/reconnect delivery with Meta Cloud is unverified, and web push is absent. |
| 13.4 | Local form auto-save | Not started | No IndexedDB/local draft recovery for registration or triage forms was found. |

### Module 14: Appointment Management

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 14.1 | Online appointment booking | Not started | The page named Appointments only shows active/waiting queue tickets; it has no dates, slots, booking, or service categories. |
| 14.2 | Follow-up scheduling | Not started | No follow-up entity or scheduler was found. |
| 14.3 | Appointment reminders | Not started | No appointment data or reminder scheduler was found. |

### Module 15: OI Clinic

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 15.1 | OI service-stream management | Not started | No ART, TB, viral-load, counselling, or cervical-screening workflow exists. |
| 15.2 | Confidential OI handling | Not started | No special OI masking/access policy exists. |
| 15.3 | Missed OI appointment follow-up | Not started | No OI appointment or follow-up workflow exists. |

### Module 16: Pharmacy

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 16.1 | Pharmacy prescription status | Partial | Pharmacy is a department queue, but prescriptions and ready/collected states are not modelled. |
| 16.2 | Prescription-ready notification | Not started | No prescription entity or ready event exists. |
| 16.3 | Out-of-stock flag and notification | Not started | No medicine/stock model or patient notification exists. |

### Module 17: Laboratory and Radiology

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 17.1 | Test queue with lifecycle states | Partial | Laboratory and Radiology queues exist, but pending/sample-collected/in-progress/completed test states do not. |
| 17.2 | Result-ready notification and return routing | Not started | No result entity, result-ready event, or route-back workflow was found. |
| 17.3 | Turnaround-time tracking | Not started | No order/result timestamps or turnaround report exists. |

### Module 18: Staff Management

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 18.1 | Staff profiles | Complete | Staff name, username/email, role, department, employee ID, phone, avatar, and profile editing exist. |
| 18.2 | Department assignment | Partial | A department is stored on the staff profile, but queue/API access is not fully constrained to that department. |
| 18.3 | Staff workload and shift reporting | Not started | No shift, assignment, service attribution, or per-staff workload model exists. |

### Module 19: Patient Experience

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 19.1 | ETA display | Complete | The tracking page presents position, patients ahead, and an estimated wait. Accuracy remains limited by the simple formula. |
| 19.2 | Leave-and-return support | Partial | Mobile tracking and near-turn notification logic support waiting away from the queue, but live WhatsApp delivery is not verified. |
| 19.3 | Department direction guidance | Complete | Tracking and transfer messages tell the patient the current/next department and action. |

### Module 20: Global System Features

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 20.1 | Multi-hospital support | Not started | No hospital/tenant entity, isolation, or per-facility configuration exists. |
| 20.2 | Multi-language support | Not started | No translation framework or language resources were found. |
| 20.3 | Configurable workflows and rules | Partial | A local settings page controls refresh preferences. Departments, roles, triage thresholds, hours, and workflow rules remain code-defined. |
| 20.4 | Cloud/local/hybrid deployment | Partial | File and MySQL adapters plus LAN/cloud deployment are possible. There is no hybrid synchronization, failover, or backup/restore workflow. |

### Module 21: AI and Smart Assistance

| ID | Requirement | Status | Current evidence / gap |
| --- | --- | --- | --- |
| 21.1 | AI waiting-time prediction | Not started | ETA is deterministic and uses a fixed formula, not AI/ML. |
| 21.2 | AI bottleneck detection | Not started | No predictive model or training/history pipeline exists. |
| 21.3 | Patient chatbot | Not started | No chatbot interface or backend integration was found. |

## 6. Recommended Delivery Order

### Phase 0: Secure the current system

1. Close public staff creation and enforce administrator-only staff/role management on the server.
2. Hash passwords, secure reset flows, persist/revoke sessions, restrict CORS, and add rate limiting/security headers.
3. Add an immutable action audit trail and include staff identity in every operational mutation.
4. Build the structured encounter, triage-observation, and service-event data model on the patient master.
5. Add automated tests around authentication, RBAC, priority ordering, transfer, recall, retry, and privacy.

### Phase 1: Complete the proposal MVP

1. Build the full triage assessment and emergency-rule workflow.
2. Verify Meta WhatsApp delivery with real sandbox credentials and implement web push.
3. Implement historical operational reports and PDF/Excel/CSV export.
4. Package and test LAN deployment, internet outage recovery, queued sends, and form draft recovery.
5. Run performance, low-bandwidth, integration, UAT, SUS, and patient-satisfaction evaluations.

### Phase 2: Complete hospital workflows

1. Add appointments and follow-up reminders.
2. Add laboratory/radiology orders, lifecycle states, results, route-back, and turnaround metrics.
3. Add pharmacy prescriptions, stock flags, ready/collected states, and notifications.
4. Add OI streams, confidential handling, and missed-appointment follow-up.
5. Add feedback, audio calling, department-specific boards, shifts, and staff workload reporting.

### Phase 3: Expanded platform capabilities

1. Add multi-hospital tenancy and per-hospital configuration.
2. Add multilingual content and workflow-rule administration.
3. Add predictive ETA/congestion only after enough clean historical service data exists.
4. Add the patient chatbot after privacy, consent, and escalation rules are approved.

## 7. Progress-Monitoring Rules

Use this audit as the baseline and update it at each milestone.

- A feature moves to **Complete** only when UI, API/business logic, persistence, permissions, error states, and relevant tests are present.
- A feature remains **Partial** when it is a mock, current-day-only view, local preference, unverified external integration, or UI without the required domain model.
- Link each completed requirement to a test case, demonstration screenshot, or UAT acceptance record.
- Recalculate the 83-feature coverage score after every accepted milestone.
- Track production readiness separately from feature count; all Critical and High release blockers must be closed before real-patient deployment.
