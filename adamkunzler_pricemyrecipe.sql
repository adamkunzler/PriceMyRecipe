-- phpMyAdmin SQL Dump
-- version 3.3.10.4
-- http://www.phpmyadmin.net
--
-- Host: mysql.adamkunzler.com
-- Generation Time: Jan 07, 2016 at 08:27 AM
-- Server version: 5.6.25
-- PHP Version: 5.5.26

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `adamkunzler_pricemyrecipe`
--

-- --------------------------------------------------------

--
-- Table structure for table `pmr_ingredient`
--

CREATE TABLE IF NOT EXISTS `pmr_ingredient` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `measureType` varchar(6) NOT NULL,
  `gramsPerCup` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `pmr_recipe`
--

CREATE TABLE IF NOT EXISTS `pmr_recipe` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `numServings` int(11) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `pmr_recipe_ingredient`
--

CREATE TABLE IF NOT EXISTS `pmr_recipe_ingredient` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ingredientId` int(11) NOT NULL,
  `recipeId` int(11) NOT NULL,
  `storeIngredientId` int(11) NOT NULL,
  `wholeAmount` int(11) NOT NULL,
  `partialAmount` varchar(3) NOT NULL,
  `measurementType` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recipeId` (`recipeId`),
  KEY `ingredientId` (`ingredientId`),
  KEY `storeIngredientId` (`storeIngredientId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `pmr_store`
--

CREATE TABLE IF NOT EXISTS `pmr_store` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `pmr_store_ingredient`
--

CREATE TABLE IF NOT EXISTS `pmr_store_ingredient` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ingredientId` int(11) NOT NULL,
  `storeId` int(11) NOT NULL,
  `quantity` decimal(10,0) NOT NULL,
  `quantityType` varchar(50) NOT NULL,
  `cost` double NOT NULL,
  `isOrganic` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ingredientId` (`ingredientId`),
  KEY `storeId` (`storeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `pmr_users`
--

CREATE TABLE IF NOT EXISTS `pmr_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password` varchar(50) NOT NULL,
  `isAdmin` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `pmr_recipe`
--
ALTER TABLE `pmr_recipe`
  ADD CONSTRAINT `pmr_recipe_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `pmr_users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `pmr_recipe_ingredient`
--
ALTER TABLE `pmr_recipe_ingredient`
  ADD CONSTRAINT `pmr_recipe_ingredient_ibfk_1` FOREIGN KEY (`ingredientId`) REFERENCES `pmr_ingredient` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `pmr_recipe_ingredient_ibfk_2` FOREIGN KEY (`recipeId`) REFERENCES `pmr_recipe` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `pmr_recipe_ingredient_ibfk_3` FOREIGN KEY (`storeIngredientId`) REFERENCES `pmr_store_ingredient` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `pmr_store`
--
ALTER TABLE `pmr_store`
  ADD CONSTRAINT `pmr_store_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `pmr_users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `pmr_store_ingredient`
--
ALTER TABLE `pmr_store_ingredient`
  ADD CONSTRAINT `pmr_store_ingredient_ibfk_1` FOREIGN KEY (`ingredientId`) REFERENCES `pmr_ingredient` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `pmr_store_ingredient_ibfk_2` FOREIGN KEY (`storeId`) REFERENCES `pmr_store` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
