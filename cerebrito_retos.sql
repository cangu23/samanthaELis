-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: cerebrito
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `retos`
--

LOCK TABLES `retos` WRITE;
/*!40000 ALTER TABLE `retos` DISABLE KEYS */;
INSERT INTO `retos` VALUES (1,'Quiz: Hardware Básico','Pon a prueba tu conocimiento sobre componentes de hardware','quiz',1,1,300,100,10,1,'2026-05-28 19:54:03'),(2,'Velocidad: Sistemas Operativos','Responde rápido sobre SO','speed_race',1,2,120,150,8,1,'2026-05-28 19:54:03'),(3,'Crucigrama: Redes','Completa el crucigrama de conceptos de redes','crossword',2,4,400,100,8,1,'2026-05-28 19:54:03'),(4,'Quiz: Protocolos','Preguntas sobre protocolos de red','quiz',2,5,300,150,10,1,'2026-05-28 19:54:03'),(5,'Sopa de Letras: Programación','Encuentra los términos de programación','word_search',3,7,300,100,8,1,'2026-05-28 19:54:03'),(6,'Ordenar: Algoritmos','Organiza los pasos de los algoritmos','drag_drop',3,8,300,150,8,1,'2026-05-28 19:54:03'),(7,'Quiz: SQL Básico','Preguntas sobre consultas SQL','quiz',4,11,300,150,10,1,'2026-05-28 19:54:03'),(8,'Quiz: Seguridad','Pon a prueba tu conocimiento en ciberseguridad','quiz',5,13,300,100,10,1,'2026-05-28 19:54:03');
/*!40000 ALTER TABLE `retos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-10 13:19:10
