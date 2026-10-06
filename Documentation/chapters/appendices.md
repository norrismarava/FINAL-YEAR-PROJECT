# Appendices

## Appendix A: Submission Deliverables

| Deliverable | Location or form | Purpose |
|---|---|---|
| Frontend source code | `WAITLESS/frontend/` | Patient, staff, administration, queue-board, and reporting interfaces |
| Backend source code | `WAITLESS/backend/` | Authentication, queue, triage, notification, reporting, audit, and department services |
| Database schema and repositories | Backend data and repository modules | Persistent representation of patients, tickets, notifications, users, and audit events |
| Automated tests | `WAITLESS/backend/test/` | Repeatable verification of selected critical paths |
| Deployment guide | `WAITLESS/DEPLOYMENT.md` | Environment, startup, and hosting guidance |
| Patient user manual | Included as Appendix D in the complete PDF | Guidance for registration, login, tracking, and notifications |
| Staff user manual | Included as Appendix E in the complete PDF | Guidance for queue, triage, department, report, and administration workflows |
| System diagrams | Embedded in Chapters 3 and 4 | Visual record of research, architecture, data, and workflow design |

## Appendix B: Verification Command Summary

| Verification | Command | Expected evidence |
|---|---|---|
| Backend automated tests | `npm test` from `WAITLESS/backend` | Test suites complete without failures |
| Frontend production build | `npm run build` from `WAITLESS/frontend` | Vite production assets generated successfully |
| Frontend lint | `npm run lint` from `WAITLESS/frontend` | No lint errors; warnings reviewed separately |
| Backend startup | `npm start` from `WAITLESS/backend` | API server listens on the configured port |

## Appendix C: Pre-Deployment Acceptance Checklist

- Obtain formal approval for pilot use and data handling.
- Replace development secrets with managed production secrets.
- Restrict CORS to approved hospital origins.
- Implement persistent session storage and test logout and expiry behaviour.
- Add authentication rate limiting and browser security headers.
- Verify department-level permissions for every staff role.
- Configure and verify the approved WhatsApp provider.
- Complete or remove web-push promises from the pilot scope.
- Configure encrypted backups and complete a restore drill.
- Conduct load testing on the intended hospital network and hardware.
- Complete staff UAT and the approved patient usability exercise.
- Review triage thresholds, translated clinical wording, and report definitions with authorised hospital staff.
- Train users and record incident, support, and escalation procedures.

## Appendix D: Patient and User Manual

The complete patient and user manual follows this appendix cover in the consolidated submission PDF.

## Appendix E: Staff User Manual

The complete staff manual follows the patient guide in the consolidated submission PDF.

