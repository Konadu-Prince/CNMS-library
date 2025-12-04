<?php
// Book search functionality for CNMS Library
require_once '../includes/db_config.php';

header('Content-Type: application/json');

// Get search term from GET parameter
$searchTerm = isset($_GET['term']) ? trim($_GET['term']) : '';

if (empty($searchTerm)) {
    echo json_encode(['error' => 'Search term is required']);
    exit;
}

try {
    $pdo = connectToDatabase();
    
    // Prepare SQL statement to search for books
    $stmt = $pdo->prepare("SELECT id, title, author, isbn, category, copies_available FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ?");
    
    $searchParam = "%{$searchTerm}%";
    $stmt->execute([$searchParam, $searchParam, $searchParam, $searchParam]);
    
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'results' => $books,
        'count' => count($books)
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}
?>
