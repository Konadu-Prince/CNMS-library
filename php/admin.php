<?php
// Admin panel for CNMS Library
session_start();
require_once '../includes/db_config.php';

// Check if user is logged in and is an admin/librarian
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'librarian')) {
    header('Location: login.php');
    exit;
}

$username = $_SESSION['username'];
$role = $_SESSION['role'];

// Handle form submissions
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['add_book'])) {
        // Add new book
        $title = trim($_POST['title']);
        $author = trim($_POST['author']);
        $isbn = trim($_POST['isbn']);
        $category = trim($_POST['category']);
        $copies = (int)$_POST['copies'];
        
        if (!empty($title) && !empty($author)) {
            try {
                $pdo = connectToDatabase();
                $stmt = $pdo->prepare("INSERT INTO books (title, author, isbn, category, copies_total, copies_available) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$title, $author, $isbn, $category, $copies, $copies]);
                $message = 'Book added successfully!';
            } catch (PDOException $e) {
                $message = 'Error adding book: ' . $e->getMessage();
            }
        } else {
            $message = 'Title and author are required.';
        }
    } elseif (isset($_POST['delete_book'])) {
        // Delete book
        $book_id = (int)$_POST['book_id'];
        try {
            $pdo = connectToDatabase();
            $stmt = $pdo->prepare("DELETE FROM books WHERE id = ?");
            $stmt->execute([$book_id]);
            $message = 'Book deleted successfully!';
        } catch (PDOException $e) {
            $message = 'Error deleting book: ' . $e->getMessage();
        }
    }
}

// Fetch all books
try {
    $pdo = connectToDatabase();
    $stmt = $pdo->query("SELECT * FROM books ORDER BY title");
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $books = [];
    $message = 'Error fetching books: ' . $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - CNMS Library</title>
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
                        <a class="nav-link" href="../search.html">Catalog</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="dashboard.php">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="#">Admin Panel</a>
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
                <h2>Admin Panel</h2>
                <p class="lead">Welcome, <?php echo htmlspecialchars($username); ?> (<?php echo ucfirst(htmlspecialchars($role)); ?>)</p>
                
                <?php if (!empty($message)): ?>
                    <div class="alert alert-info"><?php echo htmlspecialchars($message); ?></div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Add New Book Form -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Add New Book</h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" action="">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="title" class="form-label">Title *</label>
                                    <input type="text" class="form-control" id="title" name="title" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="author" class="form-label">Author *</label>
                                    <input type="text" class="form-control" id="author" name="author" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="isbn" class="form-label">ISBN</label>
                                    <input type="text" class="form-control" id="isbn" name="isbn">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="category" class="form-label">Category</label>
                                    <input type="text" class="form-control" id="category" name="category">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="copies" class="form-label">Number of Copies</label>
                                    <input type="number" class="form-control" id="copies" name="copies" min="1" value="1">
                                </div>
                            </div>
                            <button type="submit" name="add_book" class="btn btn-primary">Add Book</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Books Inventory -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Books Inventory</h5>
                    </div>
                    <div class="card-body">
                        <?php if (count($books) > 0): ?>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Author</th>
                                            <th>ISBN</th>
                                            <th>Category</th>
                                            <th>Total Copies</th>
                                            <th>Available</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($books as $book): ?>
                                            <tr>
                                                <td><?php echo htmlspecialchars($book['title']); ?></td>
                                                <td><?php echo htmlspecialchars($book['author']); ?></td>
                                                <td><?php echo htmlspecialchars($book['isbn']); ?></td>
                                                <td><?php echo htmlspecialchars($book['category']); ?></td>
                                                <td><?php echo htmlspecialchars($book['copies_total']); ?></td>
                                                <td><?php echo htmlspecialchars($book['copies_available']); ?></td>
                                                <td>
                                                    <form method="POST" action="" style="display:inline;">
                                                        <input type="hidden" name="book_id" value="<?php echo $book['id']; ?>">
                                                        <button type="submit" name="delete_book" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this book?')">Delete</button>
                                                    </form>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php else: ?>
                            <p>No books found in the inventory.</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>