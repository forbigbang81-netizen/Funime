/**
 * api.js — Jikan + Consumet API layer with retry logic
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
    let jikanReady = false;

    // Test if Jikan is reachable
    async function testJikan() {
        try {
            const r = await fetch(`${JIKAN}/top/anime?limit=1`, {
                signal: AbortSignal.timeout(8000)
            });
            if (r.ok) {
                jikanReady = true;
                console.log('Jikan API is reachable');
                return true;
            }
        } catch (e) {
            console.warn('Jikan API test failed:', e.message);
        }
        jikanReady = false;
        return false;
    }

    /**
     * Find a working Consumet instance
     */
    async function findConsumetInstance() {
        if (consumetBase) return consumetBase;

        for (const inst of CONSUMET_INSTANCES) {
            try {
                const r = await fetch(`${inst}/anime/gogoanime/naruto`, {
                    signal: AbortSignal.timeout(5000)
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
     * GET request to Jikan API with retry
     */
    async function jikanGet(path, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const r = await fetch(`${JIKAN}${path}`, {
                    signal: AbortSignal.timeout(10000)
                });
                if (r.status === 429) {
                    // Rate limited — wait and retry
                    console.warn(`Jikan rate limited on attempt ${attempt + 1}, waiting...`);
                    await new Promise(res => setTimeout(res, 1500));
                    continue;
                }
                if (!r.ok) throw new Error(`Jikan ${r.status}`);
                const d = await r.json();
                jikanReady = true;
                return d.data || [];
            } catch (e) {
                console.warn(`Jikan error (attempt ${attempt + 1}):`, e.message);
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, 1000));
                }
            }
        }
        jikanReady = false;
        return [];
    }

    /**
     * Search Gogoanime for an anime title
     */
    async function searchGogoAnime(title) {
        const inst = await findConsumetInstance();
        if (!inst) return null;

        try {
            const r = await fetch(`${inst}/anime/gogoanime/${encodeURIComponent(title)}`, {
                signal: AbortSignal.timeout(10000)
            });
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
            console.warn('GogoAnime search error:', e.message);
        }
        return null;
    }

    /**
     * Get episode list from Gogoanime
     */
    async function getEpisodes(gogoId) {
        const inst = await findConsumetInstance();
        if (!inst) return [];

        try {
            const r = await fetch(`${inst}/anime/gogoanime/info/${gogoId}`, {
                signal: AbortSignal.timeout(10000)
            });
            const d = await r.json();
            return d.episodes || [];
        } catch (e) {
            console.warn('GogoAnime info error:', e.message);
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
            const r = await fetch(`${inst}/anime/gogoanime/watch/${episodeId}`, {
                signal: AbortSignal.timeout(15000)
            });
            const d = await r.json();

            if (d.sources && d.sources.length) {
                return {
                    sources: d.sources,
                    headers: d.headers || {}
                };
            }
        } catch (e) {
            console.warn('Stream fetch error:', e.message);
        }
        return null;
    }

    /**
     * Extract best image URL from Jikan anime object
     */
    function getImage(anime) {
        return anime?.images?.jpg?.large_image_url
            || anime?.images?.jpg?.image_url
            || anime?.images?.webp?.large_image_url
            || 'https://via.placeholder.com/300x450/150028/7c3aed?text=No+Image';
    }

    /**
     * Check if Jikan is available
     */
    function isJikanReady() { return jikanReady; }

    return {
        testJikan,
        findConsumetInstance,
        jikanGet,
        searchGogoAnime,
        getEpisodes,
        getStreamUrl,
        getImage,
        isJikanReady
    };

})();

window.Funime = Funime;
