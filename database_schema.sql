-- Database schema for CNMS Library Management System

-- Create database
CREATE DATABASE IF NOT EXISTS cnms_library;
USE cnms_library;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('student', 'faculty', 'librarian', 'admin') DEFAULT 'student',
    student_id VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    publication_year YEAR,
    publisher VARCHAR(100),
    edition VARCHAR(50),
    pages INT,
    language VARCHAR(50) DEFAULT 'English',
    copies_total INT DEFAULT 1,
    copies_available INT DEFAULT 1,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Borrowed books table
CREATE TABLE borrowed_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    fine DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Reserved books table
CREATE TABLE reserved_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('active', 'fulfilled', 'expired') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Nursing', 'Books related to nursing practice and theory'),
('Midwifery', 'Books related to midwifery practice and theory'),
('Medicine', 'General medical books'),
('Anatomy', 'Books about human anatomy'),
('Physiology', 'Books about human physiology'),
('Pharmacology', 'Books about drugs and medications'),
('Research', 'Research methodology and academic writing'),
('Reference', 'Dictionaries, encyclopedias, and reference materials');

-- Sample users
INSERT INTO users (username, email, password_hash, first_name, last_name, role, student_id) VALUES
('admin', 'admin@cnms.edu.gh', '$2y$10$examplehash', 'Admin', 'User', 'admin', NULL),
('librarian1', 'librarian@cnms.edu.gh', '$2y$10$examplehash', 'Librarian', 'One', 'librarian', NULL),
('student1', 'student1@cnms.edu.gh', '$2y$10$examplehash', 'John', 'Doe', 'student', 'STU001');

-- Sample books
INSERT INTO books (title, author, isbn, category, description, publication_year, publisher, copies_total, copies_available) VALUES
('Fundamentals of Nursing', 'Patricia Williams', '978-1234567890', 'Nursing', 'Essential nursing concepts and practices', 2023, 'Medical Publishers Inc.', 3, 2),
('Midwifery Essentials', 'Sarah Johnson', '978-0987654321', 'Midwifery', 'Comprehensive guide to midwifery practice', 2022, 'Healthcare Press', 2, 1),
('Medical Terminology', 'Robert Brown', '978-1112223334', 'Reference', 'Complete guide to medical terms', 2024, 'Academic Books Ltd.', 4, 3);