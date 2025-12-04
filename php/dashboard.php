<?php
// Dashboard for CNMS Library
session_start();
require_once '../includes/db_config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$username = $_SESSION['username'];
$role = $_SESSION['role'];

// Sample borrowed books data
$borrowed_books = [
    ['title' => 'Fundamentals of Nursing', 'author' => 'Patricia Williams', 'due_date' => '2025-12-15'],
    ['title' => 'Medical Terminology', 'author' => 'Robert Brown', 'due_date' => '2025-12-20']
];

// Sample reserved books data
$reserved_books = [
    ['title' => 'Midwifery Essentials', 'author' => 'Sarah Johnson', 'reservation_date' => '2025-12-01']
];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - CNMS Library</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="../css/style.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="../index.html">CNMS Library</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="../index.html">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Catalog</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="#">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-12">
                <h2>Welcome, <?php echo htmlspecialchars($username); ?>!</h2>
                <p class="lead">Role: <?php echo ucfirst(htmlspecialchars($role)); ?></p>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Borrowed Books</h5>
                    </div>
                    <div class="card-body">
                        <?php if (count($borrowed_books) > 0): ?>
                            <ul class="list-group">
                                <?php foreach ($borrowed_books as $book): ?>
                                    <li class="list-group-item">
                                        <strong><?php echo htmlspecialchars($book['title']); ?></strong><br>
                                        <small>by <?php echo htmlspecialchars($book['author']); ?></small><br>
                                        <small>Due: <?php echo htmlspecialchars($book['due_date']); ?></small>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p>You have no borrowed books.</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Reserved Books</h5>
                    </div>
                    <div class="card-body">
                        <?php if (count($reserved_books) > 0): ?>
                            <ul class="list-group">
                                <?php foreach ($reserved_books as $book): ?>
                                    <li class="list-group-item">
                                        <strong><?php echo htmlspecialchars($book['title']); ?></strong><br>
                                        <small>by <?php echo htmlspecialchars($book['author']); ?></small><br>
                                        <small>Reserved: <?php echo htmlspecialchars($book['reservation_date']); ?></small>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p>You have no reserved books.</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Library Services</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">Search Catalog</a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">Renew Books</a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">Request Books</a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">View History</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>