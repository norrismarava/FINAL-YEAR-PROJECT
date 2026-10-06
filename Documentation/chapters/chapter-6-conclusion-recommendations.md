# Chapter 6: Summary, Maintenance and Recommendations

## 6.1 Introduction

This chapter concludes the documentation of the WaitLess Digital Queue Management System by summarising the project's achievements, assessing the system against its original objectives, identifying limitations, and presenting recommendations for maintenance and future work. The discussion is grounded in the implemented prototype, source-code review, automated tests, documented functional walkthroughs, and production-build verification. Claims about hospital outcomes are deliberately separated from claims about software behaviour.

---

## 6.2 Project Summary

### 6.2.1 Problem Addressed

Chinhoyi Provincial Hospital, like many public healthcare facilities in Zimbabwe, relied on manual queue management — physical tokens, paper registers, and verbal calls — resulting in long waits, patient anxiety, no-shows, and operational inefficiency. The WaitLess system was proposed to replace this with a real-time, web-based digital queue management platform.

### 6.2.2 Solution Delivered

WaitLess is a full-stack web application built with React 19 and Node.js, featuring:

- **Real-time queue management** with Server-Sent Events (SSE) for instant updates across all connected devices
- **Role-based access control** for admin, reception, triage, and clinician staff roles
- **Patient registration** with returning-patient search, QR card generation, and unique department-scoped tokens
- **Triage assessment** with emergency vital auto-classification and manual override
- **Priority-based queue ordering** (Red > Yellow > Green) with longest-wait tie-breaking
- **Queue operations** including call-next, mark missed, recall, and department transfers
- **WhatsApp Cloud API integration** with retry logic and consent-based notifications
- **Patient self-service** including self-registration, kiosk check-in, ticket tracking, and patient portal
- **Public and department-specific display boards** showing now-serving, waiting, and missed columns
- **Reporting** with average wait time, department performance, no-show, and triage reports
- **Extended hospital workflows** for appointments, pharmacy stock and dispensing, laboratory orders, and OI service streams
- **Accessible queue communication** through anonymous boards, audio calls, multilingual interface support, and browser notification controls
- **Administrative tools** for staff profiles, profile images, system settings, exports, and operational navigation
- **Immutable audit trail** with SHA-256 hash chain for tamper detection
- **Dual-mode storage** supporting both MySQL and file-based JSON persistence

### 6.2.3 Technical Architecture Summary

| Layer | Technology | Key Decisions |
|-------|-----------|---------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Radix UI, Lucide icons | SPA with lazy-loaded routes, context-based state, custom hooks for API access |
| Backend | Node.js (ESM), custom HTTP router, no framework | Lightweight router with path parameters; avoids Express overhead |
| Real-time | Server-Sent Events (SSE) | Chosen over WebSocket for unidirectional simplicity; polling fallback |
| Database | MySQL (mysql2) or JSON files | Dual-mode repository pattern; file mode for development/testing |
| Security | bcrypt, RBAC, audit hash chain | bcrypt cost 12; session tokens; role-expansion middleware |
| Notifications | WhatsApp Cloud API v23.0 | Retry with exponential backoff; mock provider for testing |

---

## 6.3 Achievement of Objectives

### 6.3.1 Original Objectives Assessment

| Objective | Status | Evidence |
|-----------|--------|----------|
| Replace manual queue with digital system | ✅ Achieved | Full registration-to-completion workflow implemented |
| Real-time queue updates | ✅ Achieved | SSE with < 500 ms latency; polling fallback |
| Support reduction of patient wait times | ✅ Functionally supported | Priority ordering, ETA display, tracking, bottleneck visibility; a live hospital pilot is still required to measure the actual reduction |
| Improve patient experience | ✅ Implemented at prototype level | Self-registration, kiosk, tracking, queue boards, audio calls, and notification workflows; representative user evaluation remains outstanding |
| Role-based staff access | ✅ Achieved | Four roles with route-level and data-level enforcement |
| Triage integration | ✅ Achieved | Triage assessment with emergency auto-classification |
| WhatsApp notifications | ⚠️ Deployment-dependent | Cloud API adapter, logs, and retry workflow were implemented; live provider verification requires approved production credentials |
| Reporting and analytics | ✅ Achieved | Operational, wait-time, department, triage, notification, and export workflows implemented |
| Audit trail | ✅ Achieved | Hash-chained, tamper-detectable, admin-only access |
| Constrained-network operation | ⚠️ Partial | Core LAN workflows, retry queues, and local draft recovery were implemented; hybrid local/cloud synchronisation remains future work |

### 6.3.2 Requirements Coverage at Documentation Freeze

The earlier progress audit was useful while the prototype was being built, but its numerical percentage became stale as extended modules were added. The final assessment therefore reports capability coverage and remaining deployment risk instead of presenting an outdated weighted score.

| Capability group | Final assessment | Remaining qualification |
|---|---|---|
| Registration, returning-patient handling, and ticketing | Implemented | Requires live master-data governance |
| Triage, reassessment, and priority queueing | Implemented | Clinical rules require hospital approval before deployment |
| Queue actions, transfer, recall, tracking, and displays | Implemented | Concurrent load testing remains outstanding |
| Notifications and delivery analytics | Partially production-ready | Live WhatsApp and full push delivery require provider credentials and deployment verification |
| Reports and exports | Implemented | Report definitions require management sign-off |
| Appointments, pharmacy, laboratory, and OI workflows | Implemented as prototype modules | Requires department-specific acceptance testing |
| Authentication, role access, and audit history | Implemented with hardening work remaining | Persistent sessions, rate limiting, security headers, and a restricted CORS policy are still required |
| Offline and operational continuity | Partially implemented | Backup automation, restore drills, and local/cloud synchronisation remain outstanding |

The prototype therefore covered the intended academic scope and supported an end-to-end demonstration, while production deployment remained conditional on operational, security, and user-acceptance work.

### 6.3.3 Key Achievements

1. **Functional queue management core** — Registration, priority ordering, calls, misses, recalls, and transfers all work end-to-end
2. **Real-time architecture** — SSE provides near-instant updates; polling fallback ensures compatibility
3. **Security foundation** — bcrypt hashing, RBAC, password policy, immutable audit trail with hash chain verification
4. **Dual-mode persistence** — Repository pattern abstracts MySQL and file storage, enabling development without database setup
5. **Patient self-service** — Self-registration, kiosk check-in, ticket tracking, and patient portal reduce reception workload
6. **Automated test coverage** — 12 unit tests covering critical security and patient-handling paths, all passing
7. **Production build verified** — Frontend compiles successfully (2,633 modules transformed on 10 August 2026); backend starts and serves the documented endpoints

---

## 6.4 Limitations

### 6.4.1 Technical Limitations

| Limitation | Impact | Severity |
|-----------|--------|----------|
| In-memory session storage | All staff sessions lost on server restart; users must re-login | High |
| No rate limiting on auth endpoints | Susceptible to brute-force attacks | Medium |
| CORS configured as `*` | Allows any origin; must be restricted for production | High |
| No security headers (HSTS, X-Frame-Options) | Missing browser-level protections | Medium |
| Frontend bundle > 2 MB (raw) | Slower initial load on low-bandwidth connections | Medium |
| Some operational modules retain JSON-backed persistence | Data management is split across persistence mechanisms | Medium |
| ETA uses fixed formula, not predictive | Less accurate during unusual load patterns | Low |
| No automated UI tests | Frontend regressions detected manually only | Medium |

### 6.4.2 Functional Limitations

| Limitation | Impact | Severity |
|-----------|--------|----------|
| WhatsApp delivery unverified with live credentials | Notification reliability unknown in production | High |
| Full web-push backend delivery is incomplete | Browser controls exist, but background delivery is not production-ready | Medium |
| Department-level permission rules need full acceptance testing | A role may receive broader access than intended if configuration is wrong | High |
| Advanced wait prediction uses limited prototype data | Estimates may be inaccurate during unusual demand | Medium |
| No feedback collection | No patient satisfaction data captured | Low |
| No staff shift management | Workload distribution not tracked | Low |
| No multi-hospital tenancy | System supports single hospital only | Low |
| Translation coverage requires clinical review | Some translated labels may need terminology approval | Low |

### 6.4.3 Operational Limitations

| Limitation | Impact | Severity |
|-----------|--------|----------|
| No hybrid cloud/local sync | Cannot failover between local and cloud deployment | Medium |
| No automated backup/restore | Data loss risk if manual backups not performed | High |
| Deployment guidance has not been validated by a hospital IT team | The documented runbook may need local environment changes | Medium |
| No load testing performed | System behaviour under concurrent load unknown | Medium |
| Usability testing not yet administered | SUS scores and user feedback not collected | Medium |

---

## 6.5 Lessons Learned

### 6.5.1 Technical Lessons

1. **Custom router over Express** — Building a lightweight HTTP router (92 lines) provided full control over request processing, path parameter extraction, and middleware composition. This avoided framework overhead and deepened understanding of Node.js HTTP internals. However, it also meant missing built-in features like rate limiting, request validation, and OpenAPI documentation that frameworks provide.

2. **SSE over WebSocket** — Server-Sent Events proved sufficient for the unidirectional update pattern used by the prototype. EventSource provided automatic reconnection and a simpler client model. The trade-off was the absence of client-to-server streaming, which the queue workflow did not require.

3. **Dual-mode repository pattern** — Abstracting storage behind a repository interface with file and MySQL implementations was valuable for development and testing. Tests run against file storage without database setup, while production uses MySQL. The pattern added minimal complexity and significant flexibility.

4. **Hash-chained audit trail** — Using SHA-256 hash chaining for audit events provides cryptographic tamper detection without external dependencies. The implementation redacts sensitive fields before storage and verifies chain integrity on every read. This was a high-value security feature with modest implementation effort.

5. **Context-based state management** — React Context with custom hooks (`useApiResource`, `useApiAction`, `useLiveRefresh`) provided clean state management without Redux. The pattern works well for the system's complexity level but may need restructuring if the application grows significantly.

### 6.5.2 Project Management Lessons

1. **Requirements traceability** — Maintaining a feature audit matrix helped prevent requirements from being silently dropped. The experience also showed that status counts had to be refreshed before publication; a percentage without a current evidence date could quickly become misleading.

2. **Iterative development** — Building the core queue management loop first (register → triage → call → complete) provided a demonstrable MVP early, allowing stakeholder feedback before expanding scope.

3. **Testing early** — Implementing automated tests for security-critical paths (password hashing, audit integrity, RBAC) before feature expansion caught regressions and provided confidence in the security foundation.

4. **Documentation alongside development** — Writing documentation after implementation, rather than before, ensured accuracy. However, this meant documentation lagged behind code changes, creating a maintenance burden.

---

## 6.6 System Maintenance and Recommendations

### 6.6.1 Immediate Actions (Pre-Production)

These items must be completed before deploying WaitLess in a real hospital environment:

| Priority | Recommendation | Rationale | Estimated Effort |
|----------|---------------|-----------|-----------------|
| P0 | Restrict CORS origin to hospital LAN IP range | Security — prevents cross-origin attacks | 1 hour |
| P0 | Implement database-backed session persistence | Reliability — sessions survive server restart | 1–2 days |
| P0 | Verify WhatsApp Cloud API with live credentials | Functionality — confirms notification delivery | 1 day |
| P0 | Validate the deployment runbook and complete a backup/restore drill | Operations — proves recoverability in the target environment | 1–2 days |
| P1 | Add rate limiting on `/api/auth/login` | Security — prevents brute-force attacks | 4 hours |
| P1 | Add security headers (HSTS, X-Content-Type-Options, X-Frame-Options) | Security — hardens browser protections | 2 hours |
| P1 | Conduct load testing (50+ concurrent users) | Reliability — validates performance under load | 1–2 days |
| P1 | Administer SUS questionnaire with hospital staff | Usability — collects user feedback before deployment | 1 week |
| P2 | Implement automated database backups | Reliability — prevents data loss | 1 day |
| P2 | Add automated UI tests (Playwright or Cypress) | Quality — catches frontend regressions | 3–5 days |

### 6.6.2 Short-Term Pilot Work (Next 3 Months)

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| P1 | Run department-specific acceptance tests for appointments, laboratory, pharmacy, and OI workflows | Confirms that prototype states match real departmental practice |
| P1 | Complete persistent session storage and department-level permission tests | Prevents avoidable account and access-control failures |
| P1 | Complete production web-push configuration or formally remove it from the pilot scope | Keeps the deployed promise aligned with actual capability |
| P2 | Review Shona and Ndebele clinical terminology with hospital staff | Prevents ambiguous or unsafe wording |
| P2 | Validate report definitions and exports with hospital management | Ensures that indicators support actual decisions |
| P2 | Add automated end-to-end browser tests for the critical patient journey | Reduces regression risk across pages |
| P3 | Pilot patient feedback collection with an approved consent process | Provides evidence for usability and satisfaction |
| P3 | Add staff shift and workload analysis | Supports staffing review after reliable operational data exist |

### 6.6.3 Medium-Term Enhancements (3–6 Months)

| Recommendation | Rationale |
|---------------|-----------|
| Implement configurable workflows and rules at runtime | Allows hospital administrators to adjust thresholds, departments, and routing without code changes |
| Add hybrid cloud/local deployment with sync | Enables failover between local server and cloud; ensures continuity during network outages |
| Implement automated offline/reconnect testing | Validates system behaviour during internet outages and recovery |
| Add code splitting and bundle optimisation | Reduces initial load time for low-bandwidth connections |
| Implement idle logout with client-side detection | Enhances security by logging out inactive sessions |
| Add CSRF protection for state-changing operations | Defends against cross-site request forgery attacks |
| Complete and monitor standards-based web push delivery | Provides an additional channel beyond WhatsApp |

### 6.6.4 Long-Term Vision (6–12 Months)

| Recommendation | Rationale |
|---------------|-----------|
| Multi-hospital tenancy with per-facility configuration | Enables deployment across multiple hospitals with data isolation |
| Multi-language support (Shona, Ndebele, French) | Serves diverse patient populations in Zimbabwe and beyond |
| AI-based waiting time prediction | Uses historical service data to predict wait times more accurately than fixed formula |
| AI-based bottleneck detection | Identifies congestion patterns and recommends staffing adjustments |
| Patient chatbot for FAQs and navigation | Reduces reception workload; guides patients through self-service |
| Integration with Hospital Information Systems (HIS) | Connects queue management with patient records, billing, and clinical systems |
| Mobile application (React Native) | Provides native mobile experience for patients and staff |
| FHIR-compatible API layer | Enables interoperability with standards-compliant healthcare systems |

---

## 6.7 Future Research Directions

1. **Predictive queue modelling** — Applying machine learning to historical service-time data to predict wait times, detect anomalies, and recommend staffing adjustments. This requires sufficient clean historical data (6+ months of operation).

2. **Patient flow optimisation** — Analysing queue data to identify systemic bottlenecks, optimal department routing, and staffing patterns. Research could apply queueing theory models (M/M/c, priority queues) to the hospital's actual data.

3. **Digital health equity** — Studying the impact of digital queue management on patient outcomes across demographic groups (elderly, rural, low-literacy) to ensure the system does not exacerbate health disparities.

4. **WhatsApp API effectiveness** — Measuring the impact of WhatsApp notifications on no-show rates, patient satisfaction, and queue efficiency compared to the pre-digital baseline.

5. **Offline-first architecture patterns** — Researching robust sync mechanisms for healthcare applications that must operate in environments with intermittent internet connectivity, particularly in resource-limited settings.

---

## 6.8 Project Significance

The WaitLess Digital Queue Management System demonstrates that modern web technologies can address real healthcare operational challenges in resource-limited settings. Key contributions include:

1. **Practical solution for Zimbabwean healthcare** — Designed specifically for Chinhoyi Provincial Hospital's constraints (intermittent internet, limited IT staff, LAN deployment), the system is adaptable to similar facilities across the region.

2. **Lightweight architecture** — The custom router, SSE-based real-time, and dual-mode storage demonstrate that full-featured healthcare applications can be built without heavy frameworks, reducing complexity and maintenance burden.

3. **Security by design** — The hash-chained audit trail, bcrypt password hashing, and role-based access control establish a security foundation that can be extended as the system grows.

4. **Scalable foundation** — The modular architecture (services, repositories, controllers, contexts) supports incremental feature addition without requiring rewrites.

5. **Documentation as a first-class deliverable** — This documentation set (Chapters 1–6) provides a complete record of the system's analysis, design, implementation, testing, and evaluation, serving as both an academic submission and a technical reference for future developers.

---

## 6.9 Conclusion

The WaitLess Digital Queue Management System was conceived to replace manual queue management at Chinhoyi Provincial Hospital with a real-time, web-based platform. The system successfully delivers a functional queue management core — patient registration, triage assessment, priority-based ordering, real-time updates, WhatsApp notifications, patient self-service, display boards, reporting, and audit trail — built on a modern technology stack (React 19, Node.js, MySQL, SSE).

At the documentation freeze, the core operational workflow was functional and had been verified through 12 passing automated backend tests, a documented set of 39 functional walkthroughs, and a successful frontend production build. Extended modules for appointments, pharmacy, laboratory work, OI services, reports, multilingual presentation, audio calls, profile management, and offline draft recovery had also been added. The manual walkthroughs remained repeatable acceptance evidence rather than a substitute for automated end-to-end testing or formal hospital UAT.

The system was not yet ready for unsupervised use with real patient data. Critical work remained in CORS restriction, persistent sessions, rate limiting, security headers, live WhatsApp verification, web-push completion, backup and restore testing, load testing, and formal usability evaluation. Several extended modules also required department-specific acceptance testing and consolidation into the production persistence model.

Nevertheless, the architecture provides a solid, extensible foundation. The recommendations in this chapter outline a clear path from the current state to a production-ready system, followed by short-term functional enhancements and a long-term vision for multi-hospital deployment, AI-assisted optimisation, and HIS integration.

The WaitLess system demonstrates that thoughtful application of modern web technologies, combined with a deep understanding of the operational context, can produce meaningful improvements in healthcare service delivery — even in resource-limited environments.

---
