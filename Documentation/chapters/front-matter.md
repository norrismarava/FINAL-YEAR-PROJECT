# WaitLess: A Digital Queue Management System for Zimbabwean Public Hospitals

**Case Study: Chinhoyi Provincial Hospital**

**Submitted by**

| Team member | Email address |
|---|---|
| Shadreck Mapuranga | mapurangashadreck03@gmail.com |
| Norris Marava | norrismarava44@gmail.com |
| Kelvin Ncube | kevincube19@gmail.com |

**Supervisor:** H. Musabayeka  
**Institution:** Chinhoyi University of Technology  
**School:** School of Engineering Science and Technology  
**Department:** Department of ICT and Electronics  
**Place:** Chinhoyi, Zimbabwe  
**Date:** August 2026

> A project submitted in partial fulfilment of the requirements for the Bachelor of Science Honours Degree in Information Technology.

## Declaration and Release Form

We declare that this project documentation is our original work except where sources have been acknowledged through citation and reference. The software artefact, analysis, diagrams, testing evidence, and written discussion were prepared for the WaitLess final-year project. We understand the University's requirements concerning academic integrity and accept responsibility for the accuracy of the submission.

We grant Chinhoyi University of Technology permission to make this project available for academic consultation and examination, subject to applicable privacy, intellectual-property, and institutional policies.

| Name | Signature | Date |
|---|---|---|
| Shadreck Mapuranga | ____________________ | ____________________ |
| Norris Marava | ____________________ | ____________________ |
| Kelvin Ncube | ____________________ | ____________________ |

## Approval Form

This project documentation has been submitted for examination with the approval of the project supervisor.

| Role | Name | Signature | Date |
|---|---|---|---|
| Project Supervisor | H. Musabayeka | ____________________ | ____________________ |
| Department/Examiner | ____________________ | ____________________ | ____________________ |

## Originality and Antiplagiarism Statement

The authors confirm that all ideas, findings, diagrams, and words drawn from other sources have been acknowledged. An institution-generated similarity or antiplagiarism report should be attached in accordance with Chinhoyi University of Technology policy before the final bound submission. No similarity score has been invented or inserted into this document.

## Acknowledgements

We gratefully acknowledge our supervisor, H. Musabayeka, for the direction and critical questions that helped us turn an ambitious idea into a more disciplined project. We also thank the School of Engineering Science and Technology and the Department of ICT and Electronics for the academic foundation and facilities that supported the work.

The project was shaped by the everyday reality of hospital service delivery. We therefore acknowledge the healthcare workers whose routines, constraints, and commitment informed the way we thought about patient flow. Finally, we thank our families, classmates, and friends for their patience, encouragement, and practical support throughout the long cycles of design, coding, testing, correction, and documentation.

## Dedication

This work is dedicated to patients who spend precious time waiting for care, and to the healthcare workers who keep services moving despite limited resources. It is also dedicated to our families, whose support made the project possible.

## Abstract

Public hospitals in Zimbabwe often coordinate registration, triage, and queues through paper records and verbal calls, making patient flow difficult to monitor and missed turns difficult to prevent. This project developed WaitLess, a web-based digital queue management system using Chinhoyi Provincial Hospital as a case study. A pragmatic methodology combined workflow observation, document review, literature review, design science research, iterative software development, and prototype evaluation. The resulting artefact integrated patient registration, colour-coded triage, priority-aware departmental queues, real-time staff dashboards, patient tracking, anonymous queue boards, notification logging and retry, reporting, appointments, and selected pharmacy, laboratory, and OI workflows. Verification produced 12 passing automated backend tests, 39 controlled functional walkthroughs, and a successful frontend production build. The evaluation showed that the prototype could represent an end-to-end patient journey and provide shared operational visibility. It did not yet prove a reduction in hospital waiting time or improved clinical outcomes because a live authorised pilot had not been completed. Production deployment still required persistent sessions, restricted CORS, rate limiting, security headers, provider verification, backup and restore testing, load testing, and user acceptance. The project concluded that WaitLess provided a credible pilot-ready foundation for context-appropriate digital queue management, subject to those controls and evaluations.

## List of Abbreviations

| Abbreviation | Meaning |
|---|---|
| API | Application Programming Interface |
| ART | Antiretroviral Therapy |
| CORS | Cross-Origin Resource Sharing |
| CUT | Chinhoyi University of Technology |
| DFD | Data Flow Diagram |
| DQMS | Digital Queue Management System |
| DSR | Design Science Research |
| EHR | Electronic Health Record |
| ERD | Entity-Relationship Diagram |
| HIS | Hospital Information System |
| ICT | Information and Communication Technology |
| LAN | Local Area Network |
| OI | Opportunistic Infection |
| OPD | Outpatient Department |
| QR | Quick Response |
| RBAC | Role-Based Access Control |
| SSE | Server-Sent Events |
| SUS | System Usability Scale |
| UAT | User Acceptance Testing |
