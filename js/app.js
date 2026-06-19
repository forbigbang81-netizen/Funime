/**
 * app.js — Entry point
 */
const Funime = window.Funime || {};

(function () {
    // Render the home view
    Funime.Router.renderHome();

    // Discover Consumet instance in background
    Funime.API.findConsumetInstance();

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        nav.style.borderBottomColor = window.scrollY > 80
            ? 'rgba(124,58,237,0.2)'
            : 'rgba(124,58,237,0.05)';
    });
})();

window.Funime = Funime;
