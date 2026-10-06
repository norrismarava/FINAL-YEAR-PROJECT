# Chapter 1: Introduction

## 1.0 Introduction

Healthcare delivery in public hospitals is strongly influenced by the way patients are registered, prioritised, and moved between services. At the time of the study, many Zimbabwean public health facilities still relied on manual, paper-based processes for patient registration, triage, and queue management. These processes contributed to long waits, crowded waiting areas, weak operational visibility, and an increased risk that urgent cases could be delayed. This context provided the practical motivation for developing WaitLess.

This chapter introduced WaitLess, a digital queue management system designed for Zimbabwean public hospitals. The project was informed by a case study at Chinhoyi Provincial Hospital, where patient-flow processes, triage protocols, departmental workflows, and patient entry routes were documented and analysed. The work made the problem concrete: staff were not simply managing a line of people, but a set of clinically different journeys that crossed several departments and changed as new information became available.

A key feature of WaitLess was its integrated patient-notification workflow. The prototype supported WhatsApp delivery states and browser-based notification interactions so that a patient could receive queue updates without remaining beside a display screen. This directly addressed a gap observed during the case study: once a patient moved away from a waiting area, staff had no reliable way to communicate an approaching turn. The notification design therefore focused on timely updates, consent, retry visibility, and low operating cost. Actual production charges remained dependent on the messaging provider's policy and hospital configuration.

This chapter is organised as follows: Section 1.1 presents the background to the study, outlining the broader context of queue management in healthcare and the specific challenges observed in the Zimbabwean setting. Section 1.2 articulates the problem statement, contrasting the ideal situation with the reality observed at Chinhoyi Provincial Hospital and the resulting consequences. Section 1.3 states the aim and objectives of the project. Section 1.4 discusses the significance of the study, while Section 1.5 outlines its limitations and delimitations. Section 1.6 defines key terms used throughout the chapter, and Section 1.7 concludes with a summary and a preview of the next chapter.

## 1.1 Background of the study

Queue management in healthcare is defined as the systematic process of controlling the flow of patients from entry to exit within a healthcare facility (Preater, 2002). Effective queue management is critical to the functioning of any hospital, as it directly influences patient satisfaction, clinical outcomes, and staff productivity. In high-income countries, digital queue management systems (DQMS) are widely deployed, incorporating features such as electronic patient registration, automated triage prioritisation, real-time wait-time displays, and digital notifications to patients (Cayirli & Veral, 2003).

In Sub-Saharan Africa, including Zimbabwe, the healthcare system faces unique challenges. According to the World Health Organization (2019), the African region bears over 24% of the global disease burden while having access to only 3% of health workers and less than 1% of world health expenditure. The resulting strain manifests in overcrowded outpatient departments, inefficient manual patient registration, and chaotic queuing that can endanger critically ill patients who do not receive timely care.

Zimbabwe's public hospitals have historically operated with paper-based patient records and manual queue management. Evidence from other public-hospital settings showed that digitised records and queue analysis could reveal bottlenecks that were difficult to see in a paper workflow (Cho et al., 2017). Bidari et al. (2021) further showed that a queue-management intervention could reduce both actual and perceived waiting time while improving patient satisfaction.

The case study conducted at Chinhoyi Provincial Hospital corroborated these findings. The hospital operates a colour-coded triage system categorised into four priority levels: Priority I (Red) for critically ill patients such as those with respiratory arrest or severe burns, directed to the Casualty Resuscitation Room; Priority II (Yellow) for seriously ill but non-life-threatening cases directed to the Casualty Observation Ward; Priority III (Green) for ambulant patients with minor injuries directed to the Casualty Waiting Area; and Priority IV (Black) for deceased patients held until transfer to the mortuary. Despite this structured triage framework, the absence of a digital system to support these processes means that patient sorting relies entirely on manual observation and handwritten records.

The hospital's OPD Patient Flow Map revealed a structured but entirely paper-based pathway: patients began at registration (5 minutes), proceeded to nurse observation (5 minutes) and nurse consultation (10 minutes), waited at the doctor's queue line (10 minutes), then underwent doctor's consultation (10 minutes) before branching to laboratory (20 minutes), radiology (30 minutes), or direct admission. Results were then reviewed by a doctor (5 minutes), followed by pharmacy (10 minutes), the treatment room (10 minutes), and departure. The total expected journey time for a straightforward OPD visit was thus approximately 80 minutes under ideal conditions. In practice, the absence of digital tracking means bottlenecks are invisible to management and cannot be proactively addressed.

The hospital also operates an Opportunistic Infection (OI) Clinic, which serves HIV/AIDS patients requiring TB services, antiretroviral therapy (ART) resupply, viral load testing, cervical cancer screening, and counselling. Managing these multiple parallel service streams without a digital system creates confusion, missed appointments, and inequitable service distribution.

Digital workflow interventions have also produced measurable benefits in Sub-Saharan African hospitals. Mwanswila, Mollel and Mushi (2024) reported a 45% reduction in median outpatient waiting time after a programme of technical and process changes at Kilimanjaro Christian Medical Centre in Tanzania. At the same time, Furusa and Coleman (2018) found that e-health implementation in Zimbabwean public hospitals was shaped by infrastructure, staff ICT skills, technical support, security concerns, funding, and policy. WaitLess was therefore designed around local operational realities rather than assuming constant internet access, unlimited hardware, or specialist technical staff.

## 1.2 Problem Statement

### 1.2.1 Ideal Situation

In an ideal healthcare environment, every patient who enters a public hospital should be swiftly registered, electronically triaged according to the severity of their condition, and directed to the appropriate service area with minimal waiting time. Real-time digital dashboards should enable clinical staff and hospital administrators to monitor patient flow across all departments, identify bottlenecks instantly, and dynamically reallocate resources to prevent congestion. Patients should be notified when their turn is approaching via WhatsApp or web notification, even if they have temporarily left the hospital premises. Critically ill patients should be automatically flagged and fast-tracked, and all patient journey data should be recorded digitally for reporting, quality improvement, and health system planning.

### 1.2.2 Reality

The current reality at Chinhoyi Provincial Hospital, as evidenced by the case study, is significantly different. Patient registration, triage classification, and queue management are entirely manual and paper-based. There is no system to digitally track a patient's journey from the point of entry through triage, consultation, investigations, pharmacy, and discharge. Triage officers rely on visual assessment and handwritten records to assign patients to the colour-coded priority categories (Red, Yellow, Green, Black), with no digital support to flag deteriorating patients or compute waiting times.

The OPD flow map, while conceptually well-designed, is not supported by any digital infrastructure. Queue bottlenecks, such as delays at the laboratory (20 minutes) or radiology (30 minutes), cannot be monitored in real time. The OI Clinic manages multiple complex patient streams through paper-based files with no automated scheduling or queue prioritisation. Patient sources include both unreferred walk-in cases and referred cases from clinics, peripheral hospitals, and private practitioners, adding further complexity to patient flow management. Critically, patients who leave the hospital premises while waiting have no way of being notified when it is their turn, leading to no-shows and further disruption of the queue.

### 1.2.3 Consequences

The consequences of the current manual system include:

- Prolonged patient waiting times that regularly exceed 3-5 hours for a standard OPD visit, far beyond the expected 80 minutes under ideal conditions.

- Unmanaged congestion in OPD and casualty areas, with risk of adverse clinical outcomes when critically ill patients are not prioritised.

- Staff burnout due to manual administrative burden, including physical movement between departments to coordinate patient referrals.

- Inability to generate real-time or historical performance reports, preventing evidence-based staffing and resource decisions.

- Loss of institutional data due to paper records being misfiled or damaged.

- No-shows caused by patients who leave the premises without knowing when their turn will come, as there is no notification mechanism.

- Patients from referred facilities who arrive without prior digital notification experience additional, avoidable delays. 1.2.4 Proposed Solution This project developed of WaitLess, a web-based digital queue management system tailored for Zimbabwean public hospitals. The system digitised patient registration and triage, automate patient-to-department routing based on triage priority, provide real-time queue dashboards for clinical and administrative staff, generate waiting time estimates, and notify patients when their turn is approaching via WhatsApp or web push notification. It also produced automated reports for hospital management. The system was designed to function on low-bandwidth networks using locally hosted infrastructure, making it suitable for resource-constrained hospital settings. Problem Statement: Chinhoyi Provincial Hospital, like most public hospitals in Zimbabwe, manages patient registration, triage, and queue flow using entirely manual, paper-based processes. No digital system exists to track patient movement from entry through triage, consultation, investigations, and discharge, nor to monitor waiting times, alert staff to congestion, or notify patients of their queue status. This results in inequitable service delivery, preventable delays in care, and loss of operational data. A web-based digital queue management system tailored to Zimbabwe's triage protocols and hospital workflows would enable real-time patient tracking, automated priority routing, patient notifications via WhatsApp and web push, and data-driven hospital management.

### 1.2.4 Proposed Solution

The project developed WaitLess, a web-based digital queue management system tailored to Zimbabwean public hospitals. The system digitised patient registration and triage, routed patients into departmental queues, preserved clinical-priority ordering, displayed live queue state, supported patient notifications, and produced operational reports. It was designed for browser-based use on ordinary hospital computers and for local-area-network deployment so that core queue work could continue even when external connectivity was unreliable.

The problem addressed by the project can therefore be stated as follows: Chinhoyi Provincial Hospital managed registration, triage, and queue flow through disconnected paper processes that did not provide a live view of the patient's journey or a dependable notification channel. This reduced staff visibility, made delays difficult to investigate, and created avoidable missed turns. WaitLess addressed this problem through a single, role-aware workflow for patient registration, triage, departmental routing, live monitoring, and communication.

## 1.3 Project Aims and Objectives

### 1.3.1 Aim

The aim of this project was to design, develop, and evaluate a web-based digital queue management system for Zimbabwean public hospitals, using Chinhoyi Provincial Hospital as the primary case study.

### 1.3.2 Objectives

The following objectives were defined to guide the achievement of the project aim:

1. To analyse current patient flow, triage, and queue management processes at Chinhoyi Provincial Hospital and identify key system requirements, including the need for a patient notification mechanism, by May 2026.

2. To design and develop a web-based digital queue management system that supports colour-coded triage prioritisation, multi-department patient routing, real-time queue monitoring, and a WhatsApp and web push patient notification engine, by August 2026.

3. To evaluate the system's usability, efficiency, and suitability for deployment in low-bandwidth, resource-limited Zimbabwean hospital settings, including patient satisfaction with the notification system, by October 2026.

## 1.4 Significance of the Study

This study is significant in terms of societal impact, healthcare service improvement, academic contribution, and alignment with national digital health objectives.

- Societal Impact: Long patient waiting times in Zimbabwean public hospitals remain a major healthcare challenge. By digitising and streamlining queue management processes at Chinhoyi Provincial Hospital, the proposed system has the potential to improve patient experience and reduce congestion in waiting areas. The integration of patient notifications further allows patients to temporarily leave waiting areas without losing their queue position.

- Healthcare Worker Efficiency: The automation of queue coordination tasks reduces the administrative burden currently placed on nurses and hospital staff. This allows healthcare personnel to focus more on clinical responsibilities, thereby improving operational efficiency and potentially enhancing job satisfaction.

- Evidence-Based Management: The system generates both real-time and historical data relating to patient flow, waiting times, and departmental throughput. Such information can support hospital management in making informed decisions regarding staffing, scheduling, and resource allocation.

- Reduction of Missed Queue Turns: The integration of WhatsApp and web push notifications addresses the common problem of patients missing their queue turn after temporarily leaving the hospital premises. By notifying patients when their turn is approaching, the system improves queue continuity and reduces service disruptions.

- Academic Contribution: The study contributes to the growing body of knowledge in digital healthcare systems within sub-Saharan Africa, particularly in Zimbabwe. The project may serve as a reference model for similar queue management implementations in other public healthcare institutions.

- Alignment with National Health Objectives: The project aligns with Zimbabwe’s National Health Strategy 2021–2025 and the Digital Economy Blueprint, both of which encourage the adoption of digital technologies to improve healthcare service delivery and patient experience in public institutions.

## 1.5 Limitations and Delimitations of the Study

### 1.5.1 Limitations of the Study

The following limitations are acknowledged in this study:

- The case study was conducted at a single hospital, Chinhoyi Provincial Hospital, which may not fully represent the diversity of patient flow processes and infrastructure conditions across all Zimbabwean public hospitals.

- Intermittent internet connectivity at Chinhoyi Provincial Hospital may affect the WhatsApp notification and web push features of the system. However, the core queue management system is designed to function offline within the hospital local area network, with notifications queued for delivery once internet connectivity is restored.

- Variations in patient and staff digital literacy levels may affect system usability, thereby necessitating simple user interfaces and staff orientation sessions.

- Access to hospital records and patient flow data for baseline comparison may be limited due to the manual nature of existing systems and data privacy considerations.

- Intermittent power supply and limited hardware resources at the hospital may affect system deployment and testing activities.

- The limited timeframe allocated for the final-year project may restrict the depth of user acceptance testing and system evaluation conducted.

### 1.5.2 Delimitations of the Study

The study is delimited as follows:

- The system focuses exclusively on Chinhoyi Provincial Hospital as the case study institution. Generalisation to other hospitals is proposed but falls outside the scope of this project.

- The system covers five departments: Outpatient Department (OPD), Casualty/Triage, Pharmacy, Laboratory/Radiology, and Opportunistic Infection (OI) Clinic. Inpatient ward management and theatre scheduling are excluded from the scope of the project.

- Patient notifications are limited to WhatsApp Business API notifications and web push notifications only. SMS notifications and dedicated mobile applications are not included in this phase of the project.

- Public and department-specific queue boards were included in the prototype; procurement and physical installation of hospital display hardware remained outside the project scope.

- The system does not integrate with existing Hospital Information Systems (HIS) or Electronic Health Records (EHR) platforms in this phase.

- The project focuses on prototype development and pilot evaluation rather than full-scale production deployment.

## 1.6 Definition of terms

Queue Management System: A digital system used to organise, monitor, and manage the flow of patients waiting for healthcare services in order to improve efficiency and reduce waiting times.

Triage: The process of prioritising patients according to the severity and urgency of their medical condition to ensure timely medical attention.

Outpatient Department (OPD): A hospital department that provides registration, consultation, and treatment services to patients who do not require overnight admission.

Casualty Department: The hospital department responsible for the initial reception, triage, and emergency treatment of patients requiring urgent medical attention.

Opportunistic Infection (OI) Clinic: A specialised hospital clinic that provides care for HIV/AIDS patients, including antiretroviral therapy resupply, TB services, viral load testing, cervical cancer screening, and counselling.

Digital Health System: A technology-based healthcare solution designed to improve healthcare service delivery, patient management, and operational efficiency through the use of digital tools and platforms.

Web Push Notification: A browser-based notification sent from a web application to a user’s device to provide alerts or updates, even when the application is not actively open.

WhatsApp Business API: A communication platform provided by Meta that enables businesses and organisations to send automated messages and notifications to users through WhatsApp.

Local Area Network (LAN): A computer network that connects devices within a limited geographical area such as a hospital, office, or campus to enable communication and resource sharing.

Patient Flow: The movement of patients through different stages of healthcare service delivery, from registration and triage to consultation, treatment, and discharge.

Real-Time System: A system capable of processing and updating information immediately or with minimal delay as events occur.

Hospital Information System (HIS): An integrated digital system used by healthcare institutions to manage administrative, financial, and clinical operations.

Electronic Health Record (EHR): A digital version of a patient’s medical history and health information maintained over time by healthcare providers.

WebSocket: A communication protocol that enables continuous two-way communication between a client application and a server in real time.

Prototype: An initial working version of a system developed for testing, evaluation, and demonstration purposes before full deployment.

Application Programming Interface (API): A set of rules and protocols that allows different software applications or system components to communicate and exchange data with each other.

Departmental Queue: A queue assigned to a specific hospital department where patients wait to receive services related to that department.

Patient Notification System: A subsystem responsible for sending alerts and updates to patients regarding their queue status, appointment status, or service availability.

## 1.7 Conclusion

This chapter introduced the development of WaitLess, a digital queue management system designed for Zimbabwean public hospitals, with Chinhoyi Provincial Hospital serving as the case study institution. The chapter discussed the existing manual patient flow and triage processes currently used at the hospital and identified key inefficiencies associated with the absence of a digital queue management system.

The chapter further highlighted the significance of integrating digital queue coordination and patient notification mechanisms into public healthcare service delivery. Particular emphasis was placed on the use of WhatsApp Business API notifications and web push notifications to improve patient convenience and reduce missed queue turns without introducing recurring messaging costs to the hospital.

The aim, objectives, significance, limitations, and delimitations of the study were also presented to establish the boundaries and direction of the project. Collectively, these elements provide the foundation for the design and development of an affordable, scalable, and contextually appropriate queue management solution for Zimbabwean public healthcare institutions.

The next chapter reviews related literature and existing digital healthcare solutions relevant to queue management systems, patient flow optimisation, and healthcare digitalisation.
