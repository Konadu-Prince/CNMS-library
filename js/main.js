// Main JavaScript file for CNMS Library

// Initialize Vue app
const app = new Vue({
    el: '#app',
    data: {
        message: 'Welcome to CNMS Library',
        books: [],
        searchTerm: '',
        searchResults: []
    },
    methods: {
        searchBooks: function() {
            // This would normally call an API
            console.log('Searching for:', this.searchTerm);
            
            // Mock search results
            this.searchResults = [
                { id: 1, title: 'Fundamentals of Nursing', author: 'Patricia Williams', category: 'Nursing' },
                { id: 2, title: 'Midwifery Essentials', author: 'Sarah Johnson', category: 'Midwifery' },
                { id: 3, title: 'Medical Terminology', author: 'Robert Brown', category: 'Reference' }
            ];
        }
    },
    mounted: function() {
        console.log('CNMS Library App Initialized');
        
        // Mock book data
        this.books = [
            { id: 1, title: 'Fundamentals of Nursing', author: 'Patricia Williams', category: 'Nursing', available: true },
            { id: 2, title: 'Midwifery Essentials', author: 'Sarah Johnson', category: 'Midwifery', available: false },
            { id: 3, title: 'Medical Terminology', author: 'Robert Brown', category: 'Reference', available: true },
            { id: 4, title: 'Anatomy and Physiology', author: 'Emily Davis', category: 'Science', available: true }
        ];
    }
});

// jQuery document ready
$(document).ready(function() {
    console.log('jQuery loaded and DOM ready');
    
    // Smooth scrolling for navigation links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top
            }, 1000);
        }
    });
    
    // Form submission handling
    $('#searchForm').on('submit', function(e) {
        e.preventDefault();
        console.log('Search form submitted');
    });
});