<?php
// Database configuration for CNMS Library
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'cnms_library');

// Create connection
function connectToDatabase() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch(PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
}

// Application settings
define('APP_NAME', 'CNMS Library');
define('APP_VERSION', '1.0.0');
define('LIBRARY_NAME', 'Sunyani Nursing and Midwifery Training College Library');
?>
