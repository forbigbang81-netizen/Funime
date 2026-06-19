/**
 * router.js — View management, navigation, state, and search
 */
const Funime = window.Funime || {};

Funime.Router = (() => {

    /**
     * Application state
     */
    const state = {
        view: 'home',
        topAnime: [],
        seasonalAnime: [],
        actionAnime: [],
        romanceAnime: [],
        fantasyAnime: [],
        searchResults: [],
        currentAnimeDetail: null,
        gogoAnime: null,
        episodes: [],
        currentEpIndex: -1,
        watchHistory: JSON.parse(localStorage.getItem('funime_history') || '[]'),
        navStack: []
    };

    /**
     * Helper: delay
     */
    const delay = ms => new Promise(r => setTimeout(r, ms));

    /**
     * Helper: get main content element
     */
    function main() { return document.getElementById('mainContent'); }

    /**
     * Expose state to other modules
     */
    function getState() { return state; }

    /**
     * Show a toast notification
     */
    function showToast(msg, type = 'info') {
        const colors = { info: 'bg-accent', error: 'bg-red-600', success: 'bg-green-600' };
        const t = document.createElement('div');
        t.className = `toast ${colors[type]} text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium max-w-sm`;
        t.textContent = msg;
        document.getElementById('toastContainer').appendChild(t);
        setTimeout(() => t.remove(), 3200);
    }

    /**
     * Navigate to a view
     */
    function navigate(view) {
        state.view = view;
        state.navStack = [];
        if (view === 'home') renderHome();
    }

    // ==========================================
    // HOME VIEW
    // ==========================================

    function renderHome() {
        main().innerHTML = `
        <!-- Hero Section -->
        <section id="heroSection" class="relative h-[70vh] sm:h-[80vh] overflow-hidden">
            <div id="heroBg" class="absolute inset-0 bg-skeleton"></div>
            <div class="hero-gradient absolute inset-0 z-10"></div>
            <div class="relative z-20 h-full flex items-center">
                <div class="max-w-[1400px] mx-auto px-4 sm:px-6 w-full">
                    <div id="heroContent" class="max-w-xl"></div>
                </div>
            </div>
        </section>
        <!-- Continue Watching -->
        <div id="continueRow"></div>
        <!-- Anime Rows -->
        <div id="animeRows" class="py-8"></div>`;

        loadHomeData();
    }

    async function loadHomeData() {
        const C = Funime.Components;

        // Load hero
        const top = await Funime.API.jikanGet('/top/anime?filter=bypopularity&limit=10&sfw=true');
        state.topAnime = top;
        if (top.length) {
            const featured = top[Math.floor(Math.random() * Math.min(5, top.length))];
            const heroBg = document.getElementById('heroBg');
            heroBg.innerHTML = `<img src="${Funime.API.getImage(featured)}" class="w-full h-full object-cover object-center" alt="">`;
            document.getElementById('heroContent').innerHTML = C.heroHTML(featured);
        }

        // Trending row
        const rowsEl = document.getElementById('animeRows');
        rowsEl.innerHTML = C.rowHTML('Trending Now', 'rowTrend', top);

        // Seasonal row
        rowsEl.innerHTML += C.rowHTML('This Season', 'rowSeason', []);
        const seasonal = await Funime.API.jikanGet('/seasons/now?limit=20&sfw=true');
        state.seasonalAnime = seasonal;
        document.getElementById('rowSeason').innerHTML = seasonal.map(C.animeCardHTML).join('');

        // Action row
        await delay(350);
        rowsEl.innerHTML += C.rowHTML('Action', 'rowAction', []);
        const action = await Funime.API.jikanGet('/top/anime?genres=1&limit=20&sfw=true');
        state.actionAnime = action;
        document.getElementById('rowAction').innerHTML = action.map(C.animeCardHTML).join('');

        // Romance row
        await delay(350);
        rowsEl.innerHTML += C.rowHTML('Romance', 'rowRomance', []);
        const romance = await Funime.API.jikanGet('/top/anime?genres=22&limit=20&sfw=true');
        state.romanceAnime = romance;
        document.getElementById('rowRomance').innerHTML = romance.map(C.animeCardHTML).join('');

        // Fantasy row
        await delay(350);
        rowsEl.innerHTML += C.rowHTML('Fantasy', 'rowFantasy', []);
        const fantasy = await Funime.API.jikanGet('/top/anime?genres=10&limit=20&sfw=true');
        state.fantasyAnime = fantasy;
        document.getElementById('rowFantasy').innerHTML = fantasy.map(C.animeCardHTML).join('');

        // Continue watching
        renderContinueWatching();
    }

    function renderContinueWatching() {
        const history = state.watchHistory.slice(0, 10);
        if (!history.length) return;
        const C = Funime.Components;
        document.getElementById('continueRow').innerHTML = C.rowHTML('Continue Watching', 'rowContinue',
            history.map(h => ({
                mal_id: h.malId,
                title_english: h.title,
                title: h.title,
                images: { jpg: { large_image_url: h.image } },
                score: null,
                episodes: null
            }))
        );
    }

    // ==========================================
    // SEARCH VIEW
    // ==========================================

    async function doSearch() {
        const input = document.getElementById('searchInput');
        const q = input.value.trim();
        if (!q) return;

        state.navStack = [];
        state.view = 'search';
        const C = Funime.Components;

        main().innerHTML = `
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
            <h2 class="font-display font-bold text-2xl mb-6">Search: "${q}"</h2>
            <div id="searchGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${C.skeletonCards(12)}
            </div>
        </div>`;

        const results = await Funime.API.jikanGet(`/anime?q=${encodeURIComponent(q)}&limit=24&sfw=true`);
        state.searchResults = results;

        const grid = document.getElementById('searchGrid');
        grid.innerHTML = results.length
            ? results.map(C.animeCardHTML).join('')
            : '<p class="text-muted col-span-full text-center py-12">No results found.</p>';
    }

    // ==========================================
    // GENRE VIEW
    // ==========================================

    async function loadGenre(genreId) {
        state.navStack = [];
        state.view = 'genre';
        const genreNames = { 1: 'Action', 22: 'Romance', 10: 'Fantasy', 4: 'Comedy' };
        const name = genreNames[genreId] || 'Genre';
        const C = Funime.Components;

        main().innerHTML = `
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
            <h2 class="font-display font-bold text-2xl mb-6">${name} Anime</h2>
            <div id="genreGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${C.skeletonCards(12)}
            </div>
        </div>`;

        const results = await Funime.API.jikanGet(`/top/anime?genres=${genreId}&limit=24&sfw=true`);
        document.getElementById('genreGrid').innerHTML = results.map(C.animeCardHTML).join('');
    }

    // ==========================================
    // DETAIL VIEW
    // ==========================================

    async function openDetail(malId) {
        state.navStack.push(state.view);
        state.view = 'detail';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const C = Funime.Components;

        main().innerHTML = `<div class="min-h-screen flex items-center justify-center">
            <i class="fa-solid fa-circle-notch fa-spin text-accent text-4xl"></i>
        </div>`;

        const anime = await Funime.API.jikanGet(`/anime/${malId}/full`);
        if (!anime || !anime.mal_id) {
            main().innerHTML = '<p class="text-center py-20 text-muted">Anime not found.</p>';
            return;
        }
        state.currentAnimeDetail = anime;
        state.episodes = [];
        state.currentEpIndex = -1;

        // Render detail page
        main().innerHTML = C.detailHTML(anime);

        // Try to load episodes from Gogoanime
        const title = anime.title_english || anime.title;
        const gogoResult = await Funime.API.searchGogoAnime(title);

        if (gogoResult) {
            state.gogoAnime = gogoResult;
            const episodes = await Funime.API.getEpisodes(gogoResult.id);
            state.episodes = episodes;

            const epContainer = document.getElementById('epContainer');
            if (epContainer) {
                epContainer.innerHTML = episodes.length
                    ? C.episodeGridHTML(episodes)
                    : '<p class="text-muted py-4">No episodes found on streaming source.</p>';
            }
        } else {
            const epContainer = document.getElementById('epContainer');
            if (epContainer) {
                epContainer.innerHTML = '<p class="text-red-400 py-4">Streaming source unavailable. Try again later.</p>';
            }
        }
    }

    /**
     * Play the first available episode
     */
    function playFirstEpisode() {
        if (state.episodes.length) {
            Funime.Player.playEpisode(0);
        } else {
            showToast('Episodes not loaded yet. Please wait.', 'info');
        }
    }

    return {
        getState,
        showToast,
        navigate,
        doSearch,
        loadGenre,
        openDetail,
        playFirstEpisode,
        renderHome
    };

})();

window.Funime = Funime;
