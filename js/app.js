/**
 * app.js — Application entry point and initialization
 */
const Funime = window.Funime || {};

(function () {

    /**
     * Render the home view on load
     */
    Funime.Router.renderHome();

    /**
     * Pre-discover a Consumet instance in the background
     */
    Funime.API.findConsumetInstance();

    /**
     * Navbar scroll effect
     */
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        const st = window.scrollY;
        if (st > 80) {
            nav.style.borderBottomColor = 'rgba(124,58,237,0.2)';
        } else {
            nav.style.borderBottomColor = 'rgba(124,58,237,0.05)';
        }
        lastScroll = st;
    });

})();

window.Funime = Funime;
