# CNMS Library Management System

A library management system for Sunyani Nursing and Midwifery Training College built with the same frontend and backend technologies as the MLK Health Institute library website.

## Features

- **Frontend**: Vue.js, Bootstrap, jQuery, Highlight.js
- **Backend**: PHP
- **Database**: MySQL
- **Security**: HTTP/3, HSTS, SSL/TLS

## Project Structure

```
CNMS-Library/
├── assets/
├── css/
│   └── style.css
├── js/
│   └── main.js
├── php/
│   ├── login.php
│   ├── dashboard.php
│   ├── logout.php
│   └── search_books.php
├── includes/
│   └── db_config.php
├── index.html
├── search.html
└── database_schema.sql
```

## Technologies Used

### Frontend
- **Vue.js**: For dynamic user interfaces
- **Bootstrap 5**: For responsive design
- **jQuery**: For DOM manipulation
- **Highlight.js**: For syntax highlighting (can be extended)

### Backend
- **PHP**: Server-side scripting language
- **PDO**: Database abstraction layer
- **MySQL**: Database management system

## Setup Instructions

1. Clone or download the repository
2. Set up a web server with PHP support (Apache/Nginx)
3. Import the database schema:
   ```sql
   mysql -u username -p cnms_library < database_schema.sql
   ```
4. Update database credentials in `includes/db_config.php`
5. Configure your web server to serve the project directory

## Key Components

### Pages
- **index.html**: Homepage with library information
- **search.html**: Book search interface with Vue.js functionality
- **php/login.php**: User authentication page
- **php/dashboard.php**: User dashboard with borrowed/reserved books
- **php/logout.php**: User logout handler

### Database Tables
- `users`: User account information
- `books`: Book catalog
- `borrowed_books`: Track borrowed books
- `reserved_books`: Track reserved books
- `categories`: Book categories

## Security Features

- Password hashing with PHP's `password_hash()`
- Prepared statements to prevent SQL injection
- Session management for authentication
- HTTPS support (requires SSL certificate)

## Future Enhancements

- Integration with library management APIs
- Advanced search filters
- Book recommendation system
- Mobile-responsive design improvements
- Admin panel for librarians
- Email notifications for due dates

## License

This project is for educational purposes and is not licensed for commercial use.

## Contact

For questions or support, please contact the library administration.