-- Create the database
CREATE DATABASE virmatics;

-- Use the database
USE virmatics;

-- Create tickets table
CREATE TABLE tickets (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Open', 'In Progress', 'Closed') DEFAULT 'Open',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    assignedTo VARCHAR(100),
    createdBy VARCHAR(100),
    dueDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table: Removals
-- ============================
CREATE TABLE IF NOT EXISTS removals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    reg VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(150) NOT NULL,
    status ENUM('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending'
);

-- ============================
-- Table: Interventions
-- ============================
CREATE TABLE IF NOT EXISTS interventions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    reg VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(150) NOT NULL,
    status ENUM('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending'
);

-- ============================
-- Table: Installations
-- ============================
CREATE TABLE IF NOT EXISTS installations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    reg VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(150) NOT NULL,
    status ENUM('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending'
);

-- ============================
-- Table: Remarks
-- ============================
CREATE TABLE IF NOT EXISTS remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    reg VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(100) NOT NULL,     -- e.g. "Damage", "Accident"
    severity ENUM('Low','Medium','High','Critical') DEFAULT 'Low',
    status ENUM('Open','In Review','Resolved','Closed') DEFAULT 'Open'
);

-- ============================
-- Sample Data
-- ============================

-- Tickets
INSERT INTO tickets (id, title, description, status, priority, assignedTo, createdBy, dueDate) VALUES
('TKT-1001', 'Complete March Consumables', 'Need to compile all consumables used in March for Eastern Mix', 'Open', 'High', 'Anushree Soondrum', 'Anushree Soondrum', '2025-03-31'),
('TKT-1002', 'Send Mail to Inicia Partners', 'Send unused vehicles list to Inicia by the end of the week', 'In Progress', 'Medium', 'Anushree Soondrum', 'Izdihar Fatadin-Bhugeloo', '2025-04-05');

-- Removals
INSERT INTO removals (company, reg, date, location, status) VALUES
('Eastern Mix Ltd', 'REG-1234', '2025-03-01', 'Port Louis', 'Completed'),
('Virmatics Ltd', 'REG-5678', '2025-03-05', 'Curepipe', 'Pending');

-- Interventions
INSERT INTO interventions (company, reg, date, location, status) VALUES
('Eastern Mix Ltd', 'REG-9988', '2025-03-03', 'Quatre Bornes', 'In Progress');

-- Installations
INSERT INTO installations (company, reg, date, location, status) VALUES
('Virmatics Ltd', 'REG-1122', '2025-03-07', 'Ebene Cybercity', 'Completed');

-- Remarks
INSERT INTO remarks (company, reg, date, type, severity, status) VALUES
('Eastern Mix Ltd', 'REG-4455', '2025-03-10', 'Accident Report', 'High', 'In Review'),
('Virmatics Ltd', 'REG-7788', '2025-03-12', 'Maintenance Issue', 'Medium', 'Open');
