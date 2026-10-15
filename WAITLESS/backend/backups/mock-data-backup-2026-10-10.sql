-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: waitless_queue
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tickets` (
  `id` char(36) NOT NULL,
  `ticket_code` varchar(20) NOT NULL,
  `sequence_number` int(11) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `patient_name` varchar(160) NOT NULL,
  `national_id` varchar(80) NOT NULL DEFAULT '',
  `dob` date DEFAULT NULL,
  `gender` varchar(40) NOT NULL DEFAULT 'unknown',
  `phone` varchar(80) NOT NULL DEFAULT '',
  `address` varchar(255) NOT NULL DEFAULT '',
  `patient_category` varchar(80) NOT NULL DEFAULT 'walk-in',
  `next_of_kin_name` varchar(160) NOT NULL DEFAULT '',
  `next_of_kin_phone` varchar(80) NOT NULL DEFAULT '',
  `notification_consent` tinyint(1) NOT NULL DEFAULT 0,
  `department` varchar(80) NOT NULL,
  `chief_complaint` text DEFAULT NULL,
  `priority` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `registered_at` datetime(3) NOT NULL,
  `triaged_at` datetime(3) DEFAULT NULL,
  `called_at` datetime(3) DEFAULT NULL,
  `service_started_at` datetime(3) DEFAULT NULL,
  `missed_at` datetime(3) DEFAULT NULL,
  `recalled_at` datetime(3) DEFAULT NULL,
  `transferred_at` datetime(3) DEFAULT NULL,
  `previous_department` varchar(80) NOT NULL DEFAULT '',
  `recall_count` int(11) NOT NULL DEFAULT 0,
  `completed_at` datetime(3) DEFAULT NULL,
  `whatsapp_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_code` (`ticket_code`),
  KEY `idx_tickets_department_status` (`department`,`status`),
  KEY `idx_tickets_priority_status` (`priority`,`status`),
  KEY `idx_tickets_registered_at` (`registered_at`),
  KEY `idx_tickets_patient_id` (`patient_id`),
  CONSTRAINT `fk_tickets_department` FOREIGN KEY (`department`) REFERENCES `departments` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES ('0f637f5b-c76e-400d-9ade-d63e590de648','PHA-111',111,'15069f89-816e-4f2b-b73d-35f25e7492bc','Vimbai Tavares','',NULL,'unknown','','','walk-in','','',0,'Pharmacy','Prescription collection','green','waiting','2026-09-21 09:11:48.139',NULL,NULL,NULL,NULL,NULL,NULL,'',0,NULL,0,'2026-09-21 09:35:48.186','2026-09-21 09:35:48.270'),('115d37d0-04e0-4e64-8a03-a2c24802b985','TRI-112',112,'478ad43d-740d-4536-b989-33846fcd984a','Kudzai Bhero','',NULL,'unknown','','','walk-in','','',0,'Casualty / Triage','Awaiting transfer','black','waiting','2026-09-21 09:22:48.139','2026-09-21 09:23:53.139',NULL,NULL,NULL,NULL,NULL,'',0,NULL,0,'2026-09-21 09:35:48.188','2026-09-21 09:35:48.307'),('25850f3f-1afa-4d80-85d3-ce44fd3618aa','LAB-109',109,'a7d82c7b-7b54-4357-ab2e-601541b3babf','Tatenda Rwizi','',NULL,'unknown','','','walk-in','','',0,'Laboratory','High fever','yellow','waiting','2026-09-21 09:19:48.139','2026-09-21 09:21:08.139',NULL,NULL,NULL,NULL,NULL,'',0,NULL,0,'2026-09-21 09:35:48.182','2026-09-21 09:35:48.298'),('301b55d8-da01-420e-b1f0-8c72a0ff012c','LAB-103',103,'be78cb49-369e-46bc-ace5-26a53433e1ab','Rumbidzai Ncube','',NULL,'unknown','','','walk-in','','',0,'Laboratory','CBC follow-up','green','in-service','2026-09-21 09:15:48.139',NULL,'2026-09-21 09:17:48.139','2026-09-21 09:16:48.139',NULL,NULL,NULL,'',0,NULL,0,'2026-09-21 09:35:48.164','2026-09-21 09:35:48.281'),('4371eb16-80d9-4fc5-b81e-1a1a6c422ea8','PHA-106',106,'81389f59-c7d2-49b2-a6c4-cafc19b5df43','Farai Gora','',NULL,'unknown','','','walk-in','','',0,'Pharmacy','Medication refill','green','waiting','2026-09-21 09:09:48.139',NULL,NULL,NULL,NULL,NULL,NULL,'',0,NULL,0,'2026-09-21 09:35:48.172','2026-09-21 09:35:48.263'),('5a103c92-bb25-43e5-b250-f82e1f7a1c02','TRI-101',101,'600b0bf8-cf53-46ae-86fb-19fe5198d1a1','Tariro Moyo','',NULL,'unknown','','','walk-in','','',1,'Casualty / Triage','Severe burns','red','in-service','2026-09-21 09:31:48.138','2026-09-21 09:32:08.138','2026-09-21 09:33:48.138','2026-09-21 09:32:48.138',NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.148','2026-09-21 09:35:48.378'),('6f34f042-2a29-4da1-ba10-1498e666dc2b','OPD-105',105,'c7691651-b5c3-4751-b0bf-6317ab73be15','Chipo Mlambo','',NULL,'unknown','','','walk-in','','',1,'OPD','Headache','green','waiting','2026-09-21 09:04:48.139',NULL,NULL,NULL,NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.170','2026-09-21 09:35:48.254'),('70c5652f-ec22-47b4-8389-b888e9ec7b93','OPD-102',102,'156f980c-1754-4952-a7be-d5299131df98','Brian Chuma','',NULL,'unknown','','','walk-in','','',1,'OPD','Shortness of breath','yellow','in-service','2026-09-21 09:23:48.139','2026-09-21 09:24:48.139','2026-09-21 09:25:48.139','2026-09-21 09:24:48.139',NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.156','2026-09-21 09:35:48.323'),('9a408c2f-d8e6-484e-ae7a-4f9df2ccf54e','TRI-104',104,'d50a7f5c-11f7-4f0b-8009-d0dce6d0c1b2','Tendai Sibanda','',NULL,'unknown','','','walk-in','','',1,'Casualty / Triage','Chest pain','yellow','waiting','2026-09-21 09:17:48.139','2026-09-21 09:19:18.139',NULL,NULL,NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.168','2026-09-21 09:35:48.288'),('a2738fd1-b530-410b-ac75-124a7f4583f0','TRI-107',107,'2e5c09c6-1a8d-4f7a-976d-1181ab441457','Nyasha Pinduka','',NULL,'unknown','','','walk-in','','',1,'Casualty / Triage','Respiratory distress','red','waiting','2026-09-21 09:28:48.139','2026-09-21 09:29:23.139',NULL,NULL,NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.174','2026-09-21 09:35:48.357'),('a41c665b-1b73-488b-9665-a86afbe94799','OIC-110',110,'9ea524d3-2c9f-497d-aaeb-72361d977cf0','Munyaradzi Dube','',NULL,'unknown','','','walk-in','','',1,'OI Clinic','ART review','green','waiting','2026-09-21 08:56:48.139',NULL,NULL,NULL,NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.184','2026-09-21 09:35:48.242'),('aa06d35a-2ea3-48f4-b838-9e4141e07ffe','RAD-108',108,'5addb56b-a82e-4938-8efc-505167680b79','Anesu Kuda','',NULL,'unknown','','','walk-in','','',1,'Radiology','X-ray review','green','waiting','2026-09-21 08:53:48.139',NULL,NULL,NULL,NULL,NULL,NULL,'',0,NULL,1,'2026-09-21 09:35:48.178','2026-09-21 09:35:48.230');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_profiles`
--

DROP TABLE IF EXISTS `patient_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_profiles` (
  `id` char(36) NOT NULL,
  `patient_number` varchar(24) NOT NULL,
  `full_name` varchar(160) NOT NULL,
  `national_id` varchar(80) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(40) NOT NULL DEFAULT 'unknown',
  `phone` varchar(80) DEFAULT NULL,
  `address` varchar(255) NOT NULL DEFAULT '',
  `patient_category` varchar(80) NOT NULL DEFAULT 'walk-in',
  `next_of_kin_name` varchar(160) NOT NULL DEFAULT '',
  `next_of_kin_phone` varchar(80) NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `last_visit_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_number` (`patient_number`),
  KEY `idx_patient_profiles_name` (`full_name`),
  KEY `idx_patient_profiles_national_id` (`national_id`),
  KEY `idx_patient_profiles_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_profiles`
--

LOCK TABLES `patient_profiles` WRITE;
/*!40000 ALTER TABLE `patient_profiles` DISABLE KEYS */;
INSERT INTO `patient_profiles` VALUES ('15069f89-816e-4f2b-b73d-35f25e7492bc','WL-P000005','Vimbai Tavares',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:11:48.139','2026-09-21 09:11:48.139','2026-09-21 09:11:48.139'),('156f980c-1754-4952-a7be-d5299131df98','WL-P000010','Brian Chuma',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:23:48.139','2026-09-21 09:23:48.139','2026-09-21 09:23:48.139'),('2e5c09c6-1a8d-4f7a-976d-1181ab441457','WL-P000011','Nyasha Pinduka',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:28:48.139','2026-09-21 09:28:48.139','2026-09-21 09:28:48.139'),('478ad43d-740d-4536-b989-33846fcd984a','WL-P000009','Kudzai Bhero',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:22:48.139','2026-09-21 09:22:48.139','2026-09-21 09:22:48.139'),('5addb56b-a82e-4938-8efc-505167680b79','WL-P000001','Anesu Kuda',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 08:53:48.139','2026-09-21 08:53:48.139','2026-09-21 08:53:48.139'),('600b0bf8-cf53-46ae-86fb-19fe5198d1a1','WL-P000012','Tariro Moyo',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:31:48.138','2026-09-21 09:31:48.138','2026-09-21 09:31:48.138'),('81389f59-c7d2-49b2-a6c4-cafc19b5df43','WL-P000004','Farai Gora',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:09:48.139','2026-09-21 09:09:48.139','2026-09-21 09:09:48.139'),('9ea524d3-2c9f-497d-aaeb-72361d977cf0','WL-P000002','Munyaradzi Dube',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 08:56:48.139','2026-09-21 08:56:48.139','2026-09-21 08:56:48.139'),('a7d82c7b-7b54-4357-ab2e-601541b3babf','WL-P000008','Tatenda Rwizi',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:19:48.139','2026-09-21 09:19:48.139','2026-09-21 09:19:48.139'),('be78cb49-369e-46bc-ace5-26a53433e1ab','WL-P000006','Rumbidzai Ncube',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:15:48.139','2026-09-21 09:15:48.139','2026-09-21 09:15:48.139'),('c7691651-b5c3-4751-b0bf-6317ab73be15','WL-P000003','Chipo Mlambo',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:04:48.139','2026-09-21 09:04:48.139','2026-09-21 09:04:48.139'),('d50a7f5c-11f7-4f0b-8009-d0dce6d0c1b2','WL-P000007','Tendai Sibanda',NULL,NULL,'unknown',NULL,'','walk-in','','','2026-09-21 09:17:48.139','2026-09-21 09:17:48.139','2026-09-21 09:17:48.139');
/*!40000 ALTER TABLE `patient_profiles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-10 12:20:14
