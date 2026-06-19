/**
 * components.js — UI rendering functions (cards, rows, hero, detail, etc.)
 */
const Funime = window.Funime || {};

Funime.Components = (() => {

    /**
     * Generate HTML for a single anime card
     */
    function animeCardHTML(anime) {
        const score = anime.score ? anime.score.toFixed(1) : 'N/A';
        const eps = anime.episodes ? `${anime.episodes} Ep` : '';
        const title = anime.title_english || anime.title || 'Unknown';
        const img = Funime.API.getImage(anime);

        return `
        <div class="anime-card" onclick="Funime.Router.openDetail(${anime.mal_id})">
            <img class="card-img" src="${img}" alt="${title}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x450/150028/7c3aed?text=No+Image'">
            <div class="card-overlay">
                <div class="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-play text-white text-lg ml-0.5"></i>
                </div>
            </div>
            <div class="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <div class="flex items-center gap-1.5 mb-1">
                    <span class="score-badge">${score}</span>
                    ${eps ? `<span class="text-[10px] text-white/60">${eps}</span>` : ''}
                </div>
                <p class="text-xs font-semibold text-white leading-tight line-clamp-2">${title}</p>
            </div>
        </div>`;
    }

    /**
     * Generate skeleton placeholder cards
     */
    function skeletonCards(n = 8) {
        return Array(n).fill(
            '<div class="anime-card"><div class="skeleton w-full" style="height:260px"></div></div>'
        ).join('');
    }

    /**
     * Generate a horizontal scroll row section
     */
    function rowHTML(title, id, data) {
        const cards = data.length
            ? data.map(animeCardHTML).join('')
            : skeletonCards(10);

        return `
        <section class="row-container relative mb-8 fade-in">
            <div class="max-w-[1400px] mx-auto px-4 sm:px-6">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="font-display font-bold text-xl sm:text-2xl">${title}</h2>
                    <div class="flex gap-2">
                        <button class="scroll-btn w-8 h-8 rounded-full bg-surface border border-accent/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/30 transition-all"
                            onclick="Funime.Components.scrollRow('${id}', -1)">
                            <i class="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                        <button class="scroll-btn w-8 h-8 rounded-full bg-surface border border-accent/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/30 transition-all"
                            onclick="Funime.Components.scrollRow('${id}', 1)">
                            <i class="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
                <div id="${id}" class="scroll-row">${cards}</div>
            </div>
        </section>`;
    }

    /**
     * Scroll a row left or right
     */
    function scrollRow(id, dir) {
        const el = document.getElementById(id);
        if (el) el.scrollBy({ left: dir * 600, behavior: 'smooth' });
    }

    /**
     * Render the hero section for a featured anime
     */
    function heroHTML(anime) {
        if (!anime) return '';
        const title = anime.title_english || anime.title;
        const score = anime.score?.toFixed(1) || 'N/A';
        const year = anime.year || anime.aired?.prop?.from?.year || '';
        const genres = (anime.genres || []).map(g => g.name).slice(0, 4);
        const syn = (anime.synopsis || '').substring(0, 200)
            + (anime.synopsis?.length > 200 ? '...' : '');
        const img = Funime.API.getImage(anime);

        return `
        <div class="fade-in">
            <div class="flex items-center gap-3 mb-3">
                <span class="score-badge text-sm"><i class="fa-solid fa-star mr-1"></i>${score}</span>
                ${year ? `<span class="text-sm text-white/60">${year}</span>` : ''}
                <span class="flex items-center gap-1.5 text-sm text-green-400"><span class="pulse-dot"></span>HD</span>
            </div>
            <h1 class="font-display font-black text-3xl sm:text-5xl lg:text-6xl leading-tight mb-4">${title}</h1>
            <div class="flex flex-wrap gap-2 mb-4">
                ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>
            <p class="text-sm sm:text-base text-white/70 leading-relaxed mb-6 max-w-lg">${syn}</p>
            <div class="flex gap-3">
                <button onclick="Funime.Router.openDetail(${anime.mal_id})"
                    class="px-7 py-3 bg-accent hover:bg-accent-dark rounded-lg font-display font-bold text-sm flex items-center gap-2 transition-colors glow-purple">
                    <i class="fa-solid fa-play"></i> Watch Now
                </button>
                <button onclick="Funime.Router.openDetail(${anime.mal_id})"
                    class="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-display font-semibold text-sm flex items-center gap-2 transition-colors backdrop-blur-sm">
                    <i class="fa-solid fa-circle-info"></i> Details
                </button>
            </div>
        </div>`;
    }

    /**
     * Render the detail page for a specific anime
     */
    function detailHTML(anime) {
        const title = anime.title_english || anime.title;
        const score = anime.score?.toFixed(1) || 'N/A';
        const year = anime.year || anime.aired?.prop?.from?.year || '';
        const status = anime.status || '';
        const eps = anime.episodes || '?';
        const rating = anime.rating || '';
        const duration = anime.duration || '';
        const genres = (anime.genres || []).map(g => g.name);
        const studios = (anime.studios || []).map(s => s.name).join(', ');
        const syn = anime.synopsis || 'No synopsis available.';
        const img = Funime.API.getImage(anime);

        return `
        <!-- Banner -->
        <div class="relative h-[45vh] sm:h-[55vh] overflow-hidden">
            <img src="${img}" class="w-full h-full object-cover object-center" alt="">
            <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-bg via-bg/50 to-transparent"></div>
        </div>
        <!-- Detail Content -->
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-40 relative z-10 pb-16">
            <div class="flex flex-col md:flex-row gap-6 sm:gap-8">
                <div class="flex-shrink-0">
                    <img src="${img}" class="w-48 sm:w-56 rounded-xl shadow-2xl glow-purple" alt="${title}">
                </div>
                <div class="flex-1 fade-in">
                    <h1 class="font-display font-black text-2xl sm:text-4xl leading-tight mb-3">${title}</h1>
                    ${anime.title_japanese ? `<p class="text-sm text-white/50 mb-3">${anime.title_japanese}</p>` : ''}
                    <div class="flex flex-wrap items-center gap-3 mb-4">
                        <span class="score-badge text-sm"><i class="fa-solid fa-star mr-1"></i>${score}</span>
                        ${year ? `<span class="text-sm text-white/60">${year}</span>` : ''}
                        <span class="text-sm text-white/60">${eps} Episodes</span>
                        ${status ? `<span class="text-sm text-accent-light">${status}</span>` : ''}
                    </div>
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
                        ${studios ? `<div><span class="text-white/40">Studio:</span> <span class="text-white/80">${studios}</span></div>` : ''}
                        ${duration ? `<div><span class="text-white/40">Duration:</span> <span class="text-white/80">${duration}</span></div>` : ''}
                        ${rating ? `<div><span class="text-white/40">Rating:</span> <span class="text-white/80">${rating}</span></div>` : ''}
                        ${anime.source ? `<div><span class="text-white/40">Source:</span> <span class="text-white/80">${anime.source}</span></div>` : ''}
                    </div>
                    <p class="text-sm text-white/70 leading-relaxed max-w-2xl mb-6">${syn}</p>
                    <button onclick="Funime.Router.playFirstEpisode()"
                        class="px-8 py-3.5 bg-accent hover:bg-accent-dark rounded-lg font-display font-bold text-sm flex items-center gap-2 transition-colors glow-purple">
                        <i class="fa-solid fa-play"></i> Watch Now
                    </button>
                </div>
            </div>
            <!-- Episodes Section -->
            <div class="mt-10">
                <h2 class="font-display font-bold text-xl mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-list text-accent text-lg"></i> Episodes
                </h2>
                <div id="epContainer">
                    <p class="text-muted py-4">Loading episodes...</p>
                </div>
            </div>
        </div>`;
    }

    /**
     * Render episode grid buttons
     */
    function episodeGridHTML(episodes) {
        if (!episodes.length) {
            return '<p class="text-muted py-4">No episodes available.</p>';
        }

        const showCount = Math.min(episodes.length, 24);

        const buttons = episodes.slice(0, showCount).map((ep, i) => `
            <button onclick="Funime.Player.playEpisode(${i})"
                class="py-2.5 px-2 bg-surface border border-accent/15 rounded-lg text-sm font-semibold hover:bg-accent/30 hover:border-accent/50 transition-all text-center">
                ${ep.number}
            </button>
        `).join('');

        const showMore = episodes.length > showCount
            ? `<button onclick="Funime.Components.showAllEpisodes()" class="mt-3 text-sm text-accent-light hover:text-white transition-colors">Show all ${episodes.length} episodes <i class="fa-solid fa-chevron-down ml-1"></i></button>`
            : '';

        return `
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2" id="epGrid">
            ${buttons}
        </div>
        ${showMore}`;
    }

    /**
     * Show all episodes (expand beyond initial 24)
     */
    function showAllEpisodes() {
        const episodes = Funime.Router.getState().episodes;
        const el = document.getElementById('epGrid');
        if (!el || !episodes.length) return;

        el.innerHTML = episodes.map((ep, i) => `
            <button onclick="Funime.Player.playEpisode(${i})"
                class="py-2.5 px-2 bg-surface border border-accent/15 rounded-lg text-sm font-semibold hover:bg-accent/30 hover:border-accent/50 transition-all text-center">
                ${ep.number}
            </button>
        `).join('');
    }

    return {
        animeCardHTML,
        skeletonCards,
        rowHTML,
        scrollRow,
        heroHTML,
        detailHTML,
        episodeGridHTML,
        showAllEpisodes
    };

})();

window.Funime = Funime;
