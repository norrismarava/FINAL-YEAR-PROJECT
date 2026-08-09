# WaitLess Digital Queue System — Project Documentation

**Institution:** Chinhoyi University of Technology  
**Project:** WaitLess — Digital Hospital Queue Management System  
**Target Hospital:** Chinhoyi Provincial Hospital, Zimbabwe  
**Group:** Team WaitLess

---

## Table of Contents

| Chapter | Title | File |
|---------|-------|------|
| 1 | Introduction | *(Completed — see "WaitLess Chapter 1+2 final.pdf")* |
| 2 | Literature Review | *(Completed — see "WaitLess Chapter 1+2 final.pdf")* |
| 3 | System Analysis & Design | [chapter-3-system-analysis-design.md](./chapter-3-system-analysis-design.md) |
| 4 | Implementation | [chapter-4-implementation.md](./chapter-4-implementation.md) |
| 5 | Testing & Evaluation | [chapter-5-testing-evaluation.md](./chapter-5-testing-evaluation.md) |
| 6 | Conclusion & Recommendations | [chapter-6-conclusion-recommendations.md](./chapter-6-conclusion-recommendations.md) |

---

## About This Documentation

This documentation continues from the completed Chapter 1 (Introduction) and Chapter 2 (Literature Review), which are available in the parent `Documentation/` folder as a single PDF.

Chapters 3–6 are authored in Markdown with embedded Mermaid.js diagrams. To view the diagrams rendered visually:

- **VS Code:** Install the "Markdown Preview Mermaid Support" extension
- **GitHub:** Diagrams render automatically in Markdown previews
- **Other:** Use any Mermaid-compatible Markdown viewer

### Diagrams Included

| # | Diagram | Type | Chapter |
|---|---------|------|---------|
| 1 | System use case diagram | Use Case | 3 |
| 2 | Patient registration use case | Use Case | 3 |
| 3 | Triage use case | Use Case | 3 |
| 4 | Queue management use case | Use Case | 3 |
| 5 | Notification use case | Use Case | 3 |
| 6 | High-level system architecture | Architecture | 3 |
| 7 | Deployment architecture | Deployment | 3 |
| 8 | Entity-relationship diagram | ERD | 3 |
| 9 | Context diagram (DFD Level 0) | DFD | 3 |
| 10 | DFD Level 1 — major processes | DFD | 3 |
| 11 | Patient registration sequence | Sequence | 3 |
| 12 | Triage assessment sequence | Sequence | 3 |
| 13 | Call-next-patient sequence | Sequence | 3 |
| 14 | Notification dispatch sequence | Sequence | 3 |
| 15 | Patient journey activity | Activity | 3 |
| 16 | Triage workflow activity | Activity | 3 |
| 17 | Notification retry lifecycle | Activity | 3 |
| 18 | Navigation route map | Sitemap | 3 |
| 19 | RBAC access control matrix | Matrix | 3 |
| 20 | Component hierarchy | Tree | 4 |
| 21 | Testing strategy overview | Table | 5 |
| 22 | Requirements traceability matrix | Table | 5 |
| 23 | OWASP Top 10 compliance checklist | Table | 5 |
| 24 | Requirements coverage summary | Table | 6 |
| 25 | Project objectives assessment | Table | 6 |
| 26 | Phased recommendation roadmap | Table | 6 |

### Source Material

All technical content is derived from the actual codebase in `WAITLESS/`, including:

- 30+ frontend page components
- 11 backend service modules
- 5 backend controllers
- 2 repository implementations (MySQL + file)
- 10 database tables
- 83 individually tracked requirements (see `WAITLESS_PROGRESS_AUDIT.md`)
- 12 automated backend unit tests (see `backend/test/`)
- 39 manual functional test cases (see Chapter 5)

---

## Chapter Summaries

| Chapter | Sections | Key Content |
|---------|----------|-------------|
| 3 | 3.1–3.10 | Requirements analysis, use case modelling, system architecture, data design (ERD, DFD), process design (sequence, activity), UI design, security design |
| 4 | 4.1–4.10 | Technology stack, system structure, backend implementation (router, services, controllers), frontend implementation (components, state, real-time), database, integrations, deployment |
| 5 | 5.1–5.9 | Testing strategy, 12 automated tests, 39 manual test cases, build verification, API verification, usability evaluation (SUS), performance analysis, security evaluation (OWASP), coverage analysis |
| 6 | 6.1–6.9 | Project summary, objectives achievement, limitations, lessons learned, phased recommendations (P0–P3), future research, project significance, conclusion |
