/**
 * api.js — Jikan (MAL) + Consumet (Gogoanime) API layer
 */
const Funime = window.Funime || {};

Funime.API = (() => {

    const JIKAN = 'https://api.jikan.moe/v4';

    const CONSUMET_INSTANCES = [
        'https://api.consumet.org',
        'https://consumet-api.fly.dev',
        'https://api.consumet.li',
        'https://consumet.tbd.moe'
    ];

    let consumetBase = null;

    /**
     * Find a working Consumet instance
     */
    async function findConsumetInstance() {
        if (consumetBase) return consumetBase;

        for (const inst of CONSUMET_INSTANCES) {
            try {
                const r = await fetch(`${inst}/anime/gogoanime/naruto`, {
                    signal: AbortSignal.timeout(4000)
                });
                if (r.ok) {
                    consumetBase = inst;
                    console.log('Consumet instance found:', inst);
                    return inst;
                }
            } catch (e) {
                continue;
            }
        }
        console.warn('No Consumet instance available');
        return null;
    }

    /**
     * GET request to Jikan API
     */
    async function jikanGet(path) {
        try {
            const r = await fetch(`${JIKAN}${path}`);
            if (!r.ok) throw new Error(`Jikan ${r.status}`);
            const d = await r.json();
            return d.data || [];
        } catch (e) {
            console.warn('Jikan error:', e);
            return [];
        }
    }

    /**
     * Search Gogoanime for an anime title via Consumet
     * Returns { id, title } of the best match
     */
    async function searchGogoAnime(title) {
        const inst = await findConsumetInstance();
        if (!inst) return null;

        try {
            const r = await fetch(`${inst}/anime/gogoanime/${encodeURIComponent(title)}`);
            const d = await r.json();

            if (d.results && d.results.length) {
                let best = d.results[0];
                const firstWord = title.toLowerCase().split(' ')[0];
                for (const res of d.results) {
                    if (res.title.toLowerCase().includes(firstWord)) {
                        best = res;
                        break;
                    }
                }
                return best;
            }
        } catch (e) {
            console.warn('GogoAnime search error:', e);
        }
        return null;
    }

    /**
     * Get episode list from Gogoanime via Consumet
     */
    async function getEpisodes(gogoId) {
        const inst = await findConsumetInstance();
        if (!inst) return [];

        try {
            const r = await fetch(`${inst}/anime/gogoanime/info/${gogoId}`);
            const d = await r.json();
            return d.episodes || [];
        } catch (e) {
            console.warn('GogoAnime info error:', e);
            return [];
        }
    }

    /**
     * Get streaming URLs for a specific episode
     */
    async function getStreamUrl(episodeId) {
        const inst = await findConsumetInstance();
        if (!inst) return null;

        try {
            const r = await fetch(`${inst}/anime/gogoanime/watch/${episodeId}`);
            const d = await r.json();

            if (d.sources && d.sources.length) {
                return {
                    sources: d.sources,
                    headers: d.headers || {}
                };
            }
        } catch (e) {
            console.warn('Stream fetch error:', e);
        }
        return null;
    }

    /**
     * Extract the best image URL from Jikan anime object
     */
    function getImage(anime) {
        return anime?.images?.jpg?.large_image_url
            || anime?.images?.jpg?.image_url
            || anime?.images?.webp?.large_image_url
            || 'https://via.placeholder.com/300x450/150028/7c3aed?text=No+Image';
    }

    // Expose public methods
    return {
        findConsumetInstance,
        jikanGet,
        searchGogoAnime,
        getEpisodes,
        getStreamUrl,
        getImage
    };

})();

window.Funime = Funime;
