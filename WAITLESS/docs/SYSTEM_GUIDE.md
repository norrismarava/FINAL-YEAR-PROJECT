# WaitLess — Digital Hospital Queue Management System
## Complete System Guide, User Manual & Problem Statement

---

# TABLE OF CONTENTS

1. [Problem Solved](#1-problem-solved)
2. [How the System Works — End to End](#2-how-the-system-works--end-to-end)
3. [Screens Displayed at Each Department](#3-screens-displayed-at-each-department)
4. [Patient Guide — Step by Step](#4-patient-guide--step-by-step)
5. [Staff Guide — Step by Step](#5-staff-guide--step-by-step)
6. [Roadmap Verification — All 7 Phases Implemented](#6-roadmap-verification--all-7-phases-implemented)
7. [Unique Features That Make This World-Class](#7-unique-features-that-make-this-world-class)
8. [Deployment Guide](#8-deployment-guide)

---

# 1. Problem Solved

## The Crisis in Public Hospital Queues

Public hospitals in Zimbabwe — and across Sub-Saharan Africa — face a daily crisis in patient flow management. The current paper-based queue system at Chinhoyi Provincial Hospital creates suffering, inefficiency, and clinical danger. WaitLess was built to solve these specific, observed problems:

### Problem 1: Patients Wait Blindly for Hours

**Before:** Patients arrive at 6 AM, take a paper number, and sit in crowded corridors with no idea when they will be seen. A patient with a green (non-urgent) priority might wait 4–6 hours next to someone with a life-threatening condition. There is no visibility into queue position, no estimate of wait time, and no way to know if they are next or twenty patients away.

**After WaitLess:** Patients receive a digital ticket (e.g., `OPD-205`) and can track their live queue position on their phone at `/track`. They see exactly how many patients are ahead, their estimated wait time, and their current department. They can leave the waiting area and return when their turn approaches — they get a WhatsApp message before it is their turn.

### Problem 2: Triage Priority Is Not Enforced

**Before:** Paper queues operate on a first-come, first-served basis. A patient arriving with chest pain at 10 AM is placed behind 40 patients who arrived at 6 AM for routine checkups. Nurses try to physically identify urgent cases by walking through the corridor, but this is unreliable and dangerous.

**After WaitLess:** The four-tier triage system (Red / Yellow / Green / Black) is digitally enforced. When a triage nurse assigns a Red priority, the patient automatically jumps to the front of the queue. The system continuously monitors wait times and triggers **reassessment alerts** for Red and Yellow patients who have been waiting too long, ensuring no critical patient is forgotten.

### Problem 3: No Communication Between Hospital and Patient

**Before:** Once a patient takes a paper ticket, there is zero communication until a nurse shouts a number. If a patient steps outside for fresh air, uses the restroom, or goes to buy food, they risk missing their turn and losing their place in the queue entirely.

**After WaitLess:** Patients receive WhatsApp notifications at key moments:
- **Registration confirmation** — "You are registered. Your ticket is OPD-205. Track at waitless.app/track"
- **Near-turn alert** — "Your turn is approaching. Please return to the OPD waiting area."
- **Called notification** — "OPD-205, please proceed to Room 3."
- **Missed turn** — "You missed your turn. Please see the reception desk."
- **Transfer** — "You have been moved to the Laboratory queue. Your new ticket is LAB-206."
- **Prescription ready** — "Your prescription is ready at the Pharmacy window."
- **Test results ready** — "Your lab results are ready. Please return to the doctor."

### Problem 4: Staff Cannot See the Whole Hospital

**Before:** Each department operates in isolation. The OPD nurse does not know that 30 patients are backed up in the Laboratory. The hospital administrator has no real-time view of where bottlenecks are forming. Decisions are made reactively, after complaints.

**After WaitLess:** The staff dashboard provides a real-time command center showing:
- Live queue counts per department
- Patients currently being served
- Wait time metrics and trends
- Bottleneck detection alerts
- Reassessment alerts for at-risk patients
- Notification delivery status
- AI-powered wait time predictions and bottleneck analysis

### Problem 5: No Data for Hospital Management

**Before:** At the end of each day, someone manually counts paper tickets. There is no record of how long patients waited, which departments were slowest, or how many patients were seen vs. missed. Reports are estimates at best.

**After WaitLess:** The system automatically generates:
- **Daily patient reports** by department, gender, age, and triage priority
- **Average waiting time** per department with historical trends
- **Department performance** reports (patients served, service time, queue length)
- **No-show reports** correlating missed turns with notification delivery
- **Triage reports** with timing, outcomes, and override tracking
- **Lab turnaround time** reports
- **Staff workload** reports
- **Peak hours analysis** for resource planning
- **Queue congestion prediction** using AI
- **Resource allocation suggestions** using AI
- All exportable to **CSV, Excel, and PDF**

### Problem 6: Paper Systems Fail Silently

**Before:** If the paper ticket book runs out, or gets wet, or is misnumbered, the system breaks. There is no backup. There is no recovery.

**After WaitLess:** The system runs on the hospital LAN with MySQL persistence. If the internet goes down, core queue operations continue. WhatsApp messages queue and send automatically when connectivity returns. Form data auto-saves so staff never lose a half-completed registration. A service worker caches the frontend for offline access.

### Problem 7: Vulnerable Patients Are Disadvantaged

**Before:** Elderly patients, pregnant women, disabled persons, and children wait alongside everyone else. There is no systematic way to identify or prioritize vulnerable categories.

**After WaitLess:** Patient categories (Walk-in, Referred, Emergency, Elderly, Pregnant, Child, Disabled, Chronic) are captured at registration and visible to triage staff. The system supports confidential handling for OI Clinic patients (ART, TB, viral load, counselling, screening) with masked routing and restricted data views.

---

# 2. How the System Works — End to End

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PATIENT JOURNEY                        │
│                                                          │
│  Register → Triage → Queue → Called → Served → Complete  │
│                                                          │
│  At every step: WhatsApp + Push + Audio notifications    │
└─────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Reception   │ │  Triage     │ │  Clinician  │
│  Desk        │ │  Station    │ │  Rooms      │
└─────────────┘ └─────────────┘ └─────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + MySQL)                   │
│                                                          │
│  • Queue Service (registration, priority, calling)       │
│  • Notification Service (WhatsApp, push, retry queue)     │
│  • Triage Assessment (vitals, symptoms, emergency rules)  │
│  • Department Modules (pharmacy, lab, OI clinic)          │
│  • Reports & Analytics (10 report types + AI insights)    │
│  • Audit Trail (SHA-256 hash-chained, tamper-evident)     │
│  • SSE Real-time Events (live updates to all screens)     │
│  • Appointment System (booking, slots, reminders)         │
│  • AI Service (wait prediction, bottleneck, chatbot)      │
└─────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Public      │ │  Staff      │ │  Display    │
│  Queue Board │ │  Dashboard  │ │  Boards     │
│  (TV/Monitor)│ │  (Desktop)  │ │  (Per Dept) │
└─────────────┘ └─────────────┘ └─────────────┘
```

## The Complete Patient Flow

### Step 1: Registration (Reception Desk or Self-Service)

A patient arrives at the hospital. They can be registered in three ways:

**Option A — Staff Registration (Reception Desk):**
1. Reception staff log in at `/admin/register`
2. Search for returning patients by name, phone, national ID, patient number, or QR code scan
3. If new, capture: full name, national ID, phone number, address, date of birth, gender, patient category, next of kin name and phone, chief complaint, target department, WhatsApp notification consent
4. System generates a unique ticket (e.g., `OPD-205`) with a QR code
5. Patient receives a printed 80mm ticket with QR code and tracking URL
6. WhatsApp registration confirmation sent immediately
7. Patient appears in the department queue in real time

**Option B — Self-Registration (Phone):**
1. Patient visits `/self-register` on their phone browser
2. Fills in demographics and selects department
3. Receives digital ticket number and tracking link
4. Arrives at hospital and proceeds directly to triage

**Option C — Kiosk Check-In (Hospital Entrance):**
1. Patient approaches the kiosk tablet at `/kiosk`
2. Scans their patient QR code (camera-based) or enters phone number
3. Selects department and visit reason
4. Kiosk prints/ displays ticket number
5. Patient proceeds to waiting area

### Step 2: Triage Assessment

1. Triage nurse logs in at `/admin/triage`
2. Sees all waiting patients sorted by arrival time
3. Opens a patient's triage assessment form
4. Captures: chief complaint, symptoms, vital signs (BP, pulse, temperature, respiratory rate, oxygen saturation), pain level (0–10), severity, emergency indicators
5. System **automatically detects emergency triggers** based on vital signs thresholds
6. Nurse assigns priority: **Red** (resuscitation), **Yellow** (urgent), **Green** (standard), **Black** (deceased/expectant)
7. If Red is assigned, patient immediately jumps to front of queue
8. System broadcasts real-time event — all screens update instantly
9. If Red/Yellow patient waits too long, **reassessment alert** appears on dashboard

### Step 3: Queue Waiting

1. Patient waits in the waiting area or anywhere with phone access
2. Public queue board displays on TV screens: "Now Serving: OPD-203 | Next: OPD-204, OPD-205..."
3. Patient tracks position at `/track` by entering ticket code
4. System sends WhatsApp **near-turn notification** when patient is 2–3 positions away
5. Patient returns to waiting area

### Step 4: Called and Served

1. Clinician clicks "Call Next" on the staff dashboard
2. System calls the highest-priority, longest-waiting patient
3. Patient's ticket appears on the public board as "Now Serving"
4. **Audio announcement** calls the ticket number (if audio enabled)
5. WhatsApp "called" notification sent to patient
6. Patient proceeds to consultation room
7. After consultation, clinician can:
   - **Complete the visit** — patient is marked as served
   - **Transfer to another department** — patient moves to Lab/Pharmacy/Radiology queue
   - **Order tests** — lab/radiology orders created with lifecycle tracking
   - **Prescribe medication** — prescription routed to pharmacy

### Step 5: Department Handoff (if transferred)

1. If transferred to Laboratory: patient appears in Lab queue, gets new ticket (e.g., `LAB-206`)
2. Lab technician processes sample, tracks lifecycle: Pending → Sample Collected → In Progress → Completed
3. When results are ready: **test result notification** sent, patient routed back to doctor
4. If transferred to Pharmacy: patient appears in Pharmacy queue
5. Pharmacist dispenses medication, marks prescription ready
6. **Prescription ready notification** sent to patient
7. If out-of-stock: **stock flag** raised, patient notified

### Step 6: Completion and Feedback

1. Patient's visit is marked complete
2. Patient can submit **feedback** via the patient portal (satisfaction, cleanliness, communication, wait time ratings)
3. Hospital management views feedback in reports and analytics

---

# 3. Screens Displayed at Each Department

## Public Queue Board (`/queue`)
**Displayed on:** Large TV screens in the main waiting area

Shows three columns:
- **Now Serving** — Currently called ticket numbers per department (no patient names)
- **Waiting** — Upcoming ticket numbers in queue order
- **Missed** — Patients who missed their turn, eligible for recall

Updated in real time via Server-Sent Events. No patient names shown — only ticket codes for privacy.

## Department Display Board (`/department-board`)
**Displayed on:** TV screens at each department's waiting area

Shows:
- Department-specific queue (e.g., Pharmacy only shows Pharmacy tickets)
- Now serving ticket for that department
- Next 5–10 patients in that department's queue
- QR code for patients to scan and track on their phone
- Department name and hospital branding

## Patient Tracking Page (`/track`)
**Displayed on:** Patient's phone browser

Shows:
- Ticket code and department
- Current position in queue
- Number of patients ahead
- Estimated wait time
- Progress timeline (Registered → Triage → Waiting → Called → Served)
- Notification history (what messages were sent)
- Department directions (where to go next)

## Staff Dashboard (`/admin/dashboard`)
**Displayed on:** Staff desktop computers / tablets

Shows:
- Live metrics: total waiting, in service, transferred, completed today
- Real-time queue table with priority colors, wait times, department filters
- Action buttons: Call Next, Mark Missed, Recall, Transfer, Complete
- Safety alerts: reassessment alerts for long-waiting Red/Yellow patients
- Bottleneck alerts: departments with unusual load
- Notification panel: recent WhatsApp/push delivery status
- Analytics charts: queue trends, department load, priority distribution

## Triage Console (`/admin/triage`)
**Displayed on:** Triage nurse's desktop/tablet

Shows:
- List of waiting patients sorted by arrival time
- Triage assessment form with vitals, symptoms, pain scale, emergency indicators
- Priority assignment buttons (Red/Yellow/Green/Black)
- Emergency fast-track trigger
- Patient category badges (Elderly, Pregnant, Child, etc.)

## Pharmacy Module (`/admin/pharmacy`)
**Displayed on:** Pharmacist's desktop

Shows:
- Pharmacy queue with prescription status
- Prescription details per patient
- Stock availability flags
- Dispensing workflow: Pending → Ready → Collected
- Out-of-stock flagging with patient notification

## Laboratory Module (`/admin/laboratory`)
**Displayed on:** Lab technician's desktop

Shows:
- Lab queue with test order details
- Test lifecycle tracking: Pending → Sample Collected → In Progress → Completed
- Turnaround time per test
- Result-ready notifications and route-back to doctor

## OI Clinic Module (`/admin/oi-clinic`)
**Displayed on:** OI Clinic staff desktop

Shows:
- OI service streams: ART, TB, Viral Load, Counselling, Cervical Screening
- Confidential patient handling with masked display
- Visit tracking per service stream
- OI summary dashboard

## Admin Dashboard (`/admin/admin-dashboard`)
**Displayed on:** Hospital administrator's desktop

Shows:
- Hospital-wide overview with all departments
- AI-powered wait time predictions
- AI bottleneck analysis with recommendations
- Resource allocation suggestions
- Hospital configuration (name, departments, contact info)
- Multi-hospital management (for hospital networks)
- Sync/export/import controls for backup

## Reports & Analytics (`/admin/reports`, `/admin/analytics`)
**Displayed on:** Management desktop

Shows:
- 10 report types: Average Wait, Department Performance, No-Show, Triage, Lab Turnaround, Staff Workload, Out-of-Stock, Peak Hours, Congestion, Resource Allocation
- Date range filters
- Charts and tables
- Export buttons: CSV, Excel (XLSX), PDF

## Patient Portal (`/patient/*`)
**Displayed on:** Patient's phone browser

Pages:
- **Dashboard** (`/patient/dashboard`) — Active tickets, visit history, status timeline
- **Book Appointment** (`/patient/bookings`) — View available slots, book/cancel appointments
- **Feedback** (`/patient/feedback`) — Rate completed visits
- **Profile** (`/patient/profile`) — View/edit personal info, change password
- **Settings** (`/patient/settings`) — Notification preferences, push notification toggle

---

# 4. Patient Guide — Step by Step

## Getting Started

### How to Register
1. **At the hospital:** Go to the reception desk. The receptionist will capture your details and give you a ticket number (e.g., `OPD-205`) with a QR code.
2. **From your phone:** Visit the hospital's WaitLess app URL, tap "Get started today", fill in your details, and receive a digital ticket.
3. **At the kiosk:** Scan your patient QR code or enter your phone number at the kiosk tablet near the hospital entrance.

### How to Track Your Queue Position
1. Go to the tracking page (URL on your ticket or hospital website)
2. Enter your ticket code (e.g., `OPD-205`)
3. You will see:
   - Your current position in the queue
   - How many patients are ahead of you
   - Estimated wait time
   - What stage you are at (Registered, Triage, Waiting, Called)
   - Where to go next

### How to Get WhatsApp Updates
1. When registering, provide your WhatsApp number and give consent
2. You will automatically receive:
   - A confirmation message with your ticket number
   - A reminder when your turn is approaching
   - A "please proceed" message when called
   - A notification if you missed your turn
   - Updates if you are transferred to another department
   - A message when your prescription is ready at pharmacy
   - A message when your lab results are ready

### How to Book an Appointment
1. Log in to the patient portal
2. Go to "Book Appointment"
3. Select a date and service category
4. View available time slots
5. Book your slot
6. You will receive a reminder before your appointment

### How to Leave and Return
1. You do not need to stay in the waiting area the entire time
2. Track your position on your phone
3. When you receive the "near-turn" WhatsApp message, return to the waiting area
4. If you miss your turn, go to the reception desk — you will be recalled fairly

### How to Give Feedback
1. After your visit is complete, log in to the patient portal
2. Go to "Feedback"
3. Rate your experience: satisfaction, cleanliness, communication, wait time
4. Submit — your feedback helps improve the hospital

### Changing Language
1. Tap the language selector in the top navigation
2. Choose: English, chiShona, or isiNdebele
3. The entire interface switches to your language

---

# 5. Staff Guide — Step by Step

## For Reception Staff

### Logging In
1. Go to `/admin/login`
2. Enter your username or email and password
3. You will be redirected to the registration desk

### Registering a Patient
1. Click "Register" in the sidebar
2. **Returning patient?** Search by name, phone, national ID, patient number, or scan their QR code
3. **New patient?** Fill in all required fields:
   - Full name, national ID, date of birth, gender
   - Phone number (for WhatsApp notifications)
   - Address
   - Patient category (Walk-in, Referred, Emergency, Elderly, Pregnant, Child, Disabled, Chronic)
   - Next of kin name and phone
   - Chief complaint
   - Target department (OPD, Casualty, Pharmacy, Lab, Radiology, OI Clinic)
   - Notification consent checkbox
4. Click "Register Patient"
5. A ticket is generated (e.g., `OPD-205`)
6. Print the ticket or share to the patient's phone
7. Patient appears in the queue immediately

### Managing Patient Search
- Use the search bar to find any patient by various identifiers
- Click on a patient to see their visit history and current tickets
- Reuse existing patient profiles — no duplicates

## For Triage Nurses

### Performing Triage Assessment
1. Click "Triage" in the sidebar
2. You see all waiting patients, sorted by arrival time
3. Click on a patient to open the triage form
4. Capture:
   - **Chief complaint** (what the patient says is wrong)
   - **Vital signs:** Blood pressure, pulse, temperature, respiratory rate, oxygen saturation
   - **Pain level:** 0–10 scale
   - **Symptoms and severity**
   - **Emergency indicators:** The system auto-detects critical thresholds
5. Assign a priority:
   - **Red** — Resuscitation (immediate, life-threatening)
   - **Yellow** — Urgent (should be seen within 60 minutes)
   - **Green** — Standard (routine queue order)
   - **Black** — Deceased/expectant
6. The system automatically re-sorts the queue by priority
7. Red patients jump to the front immediately

### Responding to Reassessment Alerts
- If a Red or Yellow patient has been waiting too long, an alert appears on the dashboard
- Click the alert to re-evaluate the patient's condition
- You can upgrade priority if their condition has worsened

## For Clinicians

### Calling the Next Patient
1. Open the staff dashboard at `/admin/dashboard`
2. Click "Call Next" for your department
3. The system calls the highest-priority, longest-waiting patient
4. The patient's ticket appears on the public board
5. WhatsApp notification is sent to the patient
6. When the patient arrives, conduct the consultation

### After Consultation
You can:
- **Mark as Complete** — Patient visit is finished
- **Transfer to Department** — Move patient to Lab, Pharmacy, Radiology, or OI Clinic
- **Order Tests** — Create lab or radiology orders with test type and priority
- **Prescribe** — Route prescription to pharmacy

### Managing Missed Patients
1. If a patient does not respond when called, click "Mark as Missed"
2. The patient moves to the "Missed" lane on the board
3. A missed-turn WhatsApp notification is sent
4. When the patient returns, click "Recall" to reinsert them fairly

## For Pharmacists

### Pharmacy Workflow
1. Open the Pharmacy module at `/admin/pharmacy`
2. See all patients in the pharmacy queue with prescription status
3. Process each prescription:
   - Check stock availability
   - If out of stock, flag it — patient is automatically notified
   - Dispense medication
   - Mark as "Ready" — patient receives WhatsApp notification
   - Mark as "Collected" when patient picks up

## For Lab Technicians

### Laboratory Workflow
1. Open the Laboratory module at `/admin/laboratory`
2. See all pending test orders with details
3. Update test lifecycle:
   - **Pending** → Order received
   - **Sample Collected** → Specimen obtained
   - **In Progress** → Test running
   - **Completed** → Results available
4. When results are ready, the system:
   - Sends a notification to the patient
   - Routes the patient back to the doctor's queue

## For Administrators

### Managing Staff
1. Go to `/admin/staff` (admin only)
2. Create new staff accounts with appropriate roles
3. Assign departments to staff
4. Reset passwords if needed

### Viewing Audit Trail
1. Go to `/admin/audit` (admin only)
2. See every action taken in the system, with:
   - Who did it (staff identity)
   - When (timestamp)
   - What changed (before/after values)
   - Tamper-evident SHA-256 hash chain

### Generating Reports
1. Go to `/admin/reports`
2. Select report type and date range
3. View results in tables and charts
4. Export to CSV, Excel, or PDF

### Viewing Analytics
1. Go to `/admin/analytics`
2. See peak hours analysis, congestion prediction, resource allocation suggestions
3. Use AI insights to optimize staffing and department capacity

### Configuring the System
1. Go to `/admin/settings`
2. Configure hospital information, departments, triage thresholds
3. Manage notification settings
4. Configure multi-hospital settings if managing a network

### Managing Appointments
1. Go to `/admin/appointments`
2. View all appointments across departments
3. See follow-up schedules
4. Track appointment reminders

---

# 6. Roadmap Verification — All 7 Phases Implemented

## Phase 1: Patient Intake and Privacy ✅
- ✅ Electronic patient registration with full demographics
- ✅ Returning patient search (name, phone, national ID, patient number, QR code)
- ✅ Patient category identification (8 categories)
- ✅ Next of kin capture (name and phone)
- ✅ Notification consent capture
- ✅ Anonymous public token display (no patient names on boards)
- ✅ QR code patient/visit card

## Phase 2: Triage and Safety ✅
- ✅ Digital triage assessment with symptoms, vitals, pain level, risk indicators
- ✅ Colour-coded priority assignment (Red/Yellow/Green/Black) with manual nurse override
- ✅ Emergency fast-tracking for Red cases (auto-sort to front)
- ✅ Reassessment alerts for long-waiting Red/Yellow patients

## Phase 3: Queue Workflow ✅
- ✅ Department-specific queues (6 departments)
- ✅ Call next patient by department and priority
- ✅ Missed turn and recall handling
- ✅ Queue transfer between OPD, Lab, Radiology, Pharmacy, OI Clinic, and Review
- ✅ Waiting time estimation and bottleneck detection

## Phase 4: Department Modules ✅
- ✅ Doctor-to-lab routing with test order lifecycle (Pending → Sample Collected → In Progress → Completed)
- ✅ Doctor-to-pharmacy routing with prescription-ready notifications
- ✅ Pharmacy stock issue flags with patient notification
- ✅ OI Clinic service streams (ART, TB, Viral Load, Counselling, Screening)

## Phase 5: Dashboards and Reporting ✅
- ✅ Department dashboards
- ✅ Admin and hospital manager dashboards
- ✅ Daily patient report
- ✅ Waiting time report
- ✅ Department performance report
- ✅ No-show report
- ✅ Triage report
- ✅ Lab turnaround report
- ✅ Staff workload report
- ✅ Out-of-stock report
- ✅ Peak hours report
- ✅ Congestion report
- ✅ Resource allocation report
- ✅ CSV, Excel (XLSX), and PDF exports

## Phase 6: Notifications and Display Boards ✅
- ✅ WhatsApp queue notifications (registration, near-turn, called, missed, transfer, prescription ready, test results)
- ✅ Web push notifications (browser-based, patient opt-in)
- ✅ Notification retry queue with automatic and manual retry
- ✅ Notification audit log with delivery status and attempt tracking
- ✅ Waiting-area display board (public, anonymous)
- ✅ Department-specific display boards
- ✅ Audio calling for token numbers

## Phase 7: Advanced Readiness ✅
- ✅ Low-bandwidth/local network operation (service worker caching, offline indicator)
- ✅ Auto-save forms (form draft recovery for registration and triage)
- ✅ Appointment booking and reminders (patient portal + staff management)
- ✅ Multi-hospital configuration (hospital entity, per-facility settings)
- ✅ Multi-language support (English, chiShona, isiNdebele)
- ✅ Predictive waiting time (AI-powered wait time prediction)
- ✅ Bottleneck detection (AI-powered congestion analysis)
- ✅ Patient chatbot (AI assistant widget)
- ✅ Idle logout (automatic session timeout for security)
- ✅ Sync/backup/restore (export, import, backup controls)
- ✅ Action-attributed audit trail (SHA-256 hash-chained, tamper-evident)
- ✅ bcrypt password hashing (12 rounds for staff, secure hashing for patients)
- ✅ Role-based access control (admin, reception, triage, clinician)
- ✅ Code-splitting and lazy loading for performance

---

# 7. Unique Features That Make This World-Class

## What Sets WaitLess Apart from Other Queue Systems

### 1. Triage-Aware Queue Engine
Most queue systems are first-come, first-served. WaitLess enforces clinical triage priority — a Red patient who arrives at noon jumps ahead of 40 Green patients who arrived at 6 AM. The system continuously monitors and alerts if critical patients wait too long.

### 2. Zero-Cost WhatsApp Integration
Uses Meta's WhatsApp Cloud API service conversation window — patients receive updates at no per-message cost to the hospital. Messages queue when the internet is down and send automatically when connectivity returns.

### 3. AI-Powered Insights
- **Wait time prediction** — Uses historical data to predict how long a patient will wait
- **Bottleneck analysis** — Identifies which departments are congested and why
- **Resource allocation** — Suggests where to deploy staff for maximum impact
- **Patient chatbot** — AI assistant answers common patient questions

### 4. Offline-First Architecture
The system runs on the hospital LAN. A service worker caches the frontend. Core queue operations work without internet. WhatsApp messages queue and dispatch when connectivity returns. Form data auto-saves so staff never lose work.

### 5. Multi-Language Support
Full interface translations in English, chiShona, and isiNdebele — the three main languages of Zimbabwe. Patients who cannot read English can navigate the system in their mother tongue.

### 6. Tamper-Evident Audit Trail
Every action is recorded in a SHA-256 hash-chained audit log. Any tampering with historical records is mathematically detectable. This meets medical-legal compliance requirements.

### 7. Confidential OI Clinic Mode
Special handling for HIV/TB patients with masked routing and restricted data views — protecting patient privacy in stigmatized services.

### 8. Three Registration Channels
Staff desk registration, patient self-registration from phone, and kiosk check-in with QR scanning — covering every patient scenario from tech-savvy to elderly.

### 9. Real-Time Everything
Server-Sent Events push updates to all screens instantly — no page refresh needed. The public board, staff dashboard, and patient tracking page all update simultaneously.

### 10. Comprehensive Reporting Suite
10 different report types with CSV, Excel, and PDF export — giving hospital management the data they need to optimize operations, plan staffing, and demonstrate performance to regulators.

### 11. Patient Portal with Full Self-Service
Patients can register, track, book appointments, give feedback, manage their profile, and control notification preferences — all from their phone, without staff assistance.

### 12. Multi-Hospital Ready
The system supports hospital networks with per-facility configuration, making it scalable from a single clinic to a national hospital network.

---

# 8. Deployment Guide

## Prerequisites
- Node.js 18+ 
- MySQL 8+ (or use file-based storage for development)
- WhatsApp Business API credentials (for live notifications)

## Environment Variables

### Backend
```
PORT=4242
DB_PROVIDER=mysql          # or 'file' for development
DB_HOST=localhost
DB_USER=waitless
DB_PASSWORD=your_password
DB_NAME=waitless_app
JWT_SECRET=your_secret
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
INITIAL_ADMIN_PASSWORD=secure_password
CORS_ORIGIN=https://your-domain.com
```

### Frontend
```
VITE_API_BASE_URL=https://api.your-domain.com
```

## Steps

1. **Database Setup**
   ```bash
   mysql -u root -p < backend/db/schema.sql
   ```

2. **Backend**
   ```bash
   cd WAITLESS/backend
   npm install
   npm start
   ```

3. **Frontend**
   ```bash
   cd WAITLESS/frontend
   npm install
   npm run build
   # Serve dist/ with nginx or similar
   ```

4. **Production**
   - Run backend behind a reverse proxy (nginx)
   - Enable HTTPS (required for service worker, push notifications, WhatsApp webhooks)
   - Set up WhatsApp webhook to point to `https://api.your-domain.com/api/integrations/whatsapp/webhook`
   - Configure CORS_ORIGIN to your frontend domain
   - Seed initial admin account via INITIAL_ADMIN_PASSWORD

5. **Display Boards**
   - Mount TVs in waiting areas, open browser to `/queue` (main board) and `/department-board` (per department)
   - Set to kiosk mode (full screen, no address bar)

6. **Staff Access**
   - Staff access via desktop browsers at `/admin/login`
   - Create staff accounts via admin panel at `/admin/staff`

---

*WaitLess — Replacing confusion with a queue patients can trust.*
*Built for Chinhoyi Provincial Hospital. Ready for the world.*

---

# System Updates — October 2026 (current state)

This section reflects the system as deployed after the October stabilization pass.

## Queue announcements & audio
- Calls are **serialized FIFO**: each call holds the hero panel + speaker ~9s, then the next queued call takes over. Back-to-back calls no longer cut each other off.
- Per-item `holdMs` supported; board announcements are scoped to their department.
- **Recalls are silent** — returning a missed ticket to waiting is not announced; it is announced only when actually called again.
- Both "Call next patient" and per-ticket **CALL** emit `ticket.called` — identical display + audio on every call path.
- **Autoplay handling**: browsers require one user gesture before audio. Boards show a pulsing muted-volume icon (bottom-right) until speech is unlocked; a blocked first announcement replays automatically ~150ms after the first tap. For unattended TV displays, launch Chrome with `--autoplay-policy=no-user-gesture-required`.
- Speech engine is nudged every 1.5s (`resume()`) and resumed immediately before each utterance, so calls no longer land seconds late.
- Shared `AudioContext` (no per-call context leaks) and utterances are held in a ref to prevent Chrome GC cutting speech mid-word.

## Roles & navigation
- **Dentist** is a first-class staff role (clinician alias) — creation, permissions, navigation, landing.
- Sidebar shows **Dashboard, Triage, Pharmacy, Laboratory, OI Clinic, Staff, Patients** filtered per role; `/admin/staff` redirects to `/admin/users`; Users renamed to **Staff**.
- **Patients directory** (`/admin/patients`): searchable list of all `WL-P` profiles + patient accounts — accessible to admin, reception, clinician, triage.
- Staff dashboard/workspace is uniform across staff roles.

## Triage & severity
- **Reception** can assign the severity color (Red/Yellow/Green/Black) at the Triage page; vitals intake remains nurse-only. Priority chips recolor the queue everywhere.
- Clinicians (doctor + dentist) create **prescriptions and test orders** on the Triage page; the **Pharmacy** kanban lists every prescription across prescribers.
- `/admin/triage` is open to triage, clinician, and reception with role-scoped sections.

## Notifications (WhatsApp)
- Provider `whatsapp-web` (`WHATSAPP_PROVIDER`) sends from a linked WhatsApp account via whatsapp-web.js; session persists in `backend/.wwebjs_auth`, QR also written to `backend/whatsapp-qr.png` for easy scanning. Requires the backend host to stay online — run locally for demos; Render's ephemeral filesystem doesn't retain the session.
- Flow: self-register/pre-register sends **no** message. The `queue-registered` message (styled `*WaitLess — You're in the Queue*` with department, ticket, tracking link) fires on **confirm arrival** into a department queue; `queue-called` includes department + room.
- Meta Cloud API provider remains for production; `WHATSAPP_DEFAULT_COUNTRY_CODE=263` normalizes Zim numbers.

## Accounts & avatars
- Staff/patient avatars are stored **in the database** (`avatar_url MEDIUMTEXT`, data URLs) — they survive Render's ephemeral filesystem. A "Remove photo" action resets to the default initials avatar (`DELETE /api/profile/avatar`).
- Staff session TTL is 8h fixed (`AUTH_SESSION_TTL_MS`) — no idle logout.

## Operations notes
- Service worker (`public/sw.js`) uses stale-while-revalidate — bump `CACHE_NAME` after frontend changes if stale screens appear.
- Render free tier sleeps after ~15 min idle; keeping a board open prevents it (boards poll).
- `WAITLESS-OS` branch mirrors `main` as a backup snapshot.
