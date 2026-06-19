/**
 * api.js — MyAnimeList (via Jikan) + Consumet, with built-in fallback data
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

    // ============================================================
    // BUILT-IN FALLBACK DATASET — 48 popular anime from MAL
    // Used when the Jikan API is down or rate-limited
    // ============================================================
    const FALLBACK_ANIME = [
        { mal_id: 1535, title: "Death Note", title_english: "Death Note", score: 8.62, episodes: 37, year: 2006, genres: ["Mystery","Supernatural","Thriller"], synopsis: "A shinigami, as a god of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note. Light Yagami is a brilliant student who discovers a mysterious notebook.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/9/9453l.jpg" } } },
        { mal_id: 16498, title: "Shingeki no Kyojin", title_english: "Attack on Titan", score: 8.54, episodes: 25, year: 2013, genres: ["Action","Drama","Fantasy"], synopsis: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans. Eren Yeager vows to cleanse the earth of every last Titan.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg" } } },
        { mal_id: 11757, title: "Sword Art Online", title_english: "Sword Art Online", score: 7.20, episodes: 25, year: 2012, genres: ["Action","Adventure","Fantasy","Romance"], synopsis: "In the year 2022, virtual reality has progressed by leaps and bounds, and a massive online role-playing game called Sword Art Online is launched.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/11/39717l.jpg" } } },
        { mal_id: 5114, title: "Fullmetal Alchemist: Brotherhood", title_english: "Fullmetal Alchemist: Brotherhood", score: 9.10, episodes: 64, year: 2009, genres: ["Action","Adventure","Drama","Fantasy"], synopsis: "After a horrific alchemy experiment goes wrong, brothers Edward and Alphonse Elric search for the Philosopher's Stone to restore their bodies.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1208/94745l.jpg" } } },
        { mal_id: 9253, title: "Steins;Gate", title_english: "Steins;Gate", score: 9.07, episodes: 24, year: 2011, genres: ["Sci-Fi","Thriller"], synopsis: "The self-proclaimed mad scientist Rintarou Okabe creates a device that can send messages to the past, changing the flow of history.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/5/73199l.jpg" } } },
        { mal_id: 1, title: "Cowboy Bebop", title_english: "Cowboy Bebop", score: 8.75, episodes: 26, year: 1998, genres: ["Action","Award Winning","Sci-Fi"], synopsis: "In the year 2071, humanity has colonized several planets surrounding Earth. Spike Spiegel is a bounty hunter with a laid-back attitude.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/4/19644l.jpg" } } },
        { mal_id: 11061, title: "Hunter x Hunter (2011)", title_english: "Hunter x Hunter", score: 9.04, episodes: 148, year: 2011, genres: ["Action","Adventure","Fantasy"], synopsis: "Gon Freecss sets out on a quest to find his father, who abandoned him as a baby. Along the way, he discovers that his father is a world-renowned Hunter.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1337/99013l.jpg" } } },
        { mal_id: 21, title: "One Piece", title_english: "One Piece", score: 8.72, episodes: 1100, year: 1999, genres: ["Action","Adventure","Fantasy"], synopsis: "Gol D. Roger was known as the Pirate King. Monkey D. Luffy sets off on a journey to find the legendary treasure One Piece and become the next Pirate King.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/6/73245l.jpg" } } },
        { mal_id: 38000, title: "Kimetsu no Yaiba", title_english: "Demon Slayer: Kimetsu no Yaiba", score: 8.45, episodes: 26, year: 2019, genres: ["Action","Fantasy"], synopsis: "Ever since the death of his father, young Tanjirou takes it upon himself to support his family. When he finds his family slaughtered by demons, he embarks on a journey to become a demon slayer.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg" } } },
        { mal_id: 22319, title: "Tokyo Ghoul", title_english: "Tokyo Ghoul", score: 7.79, episodes: 12, year: 2014, genres: ["Action","Fantasy","Horror","Supernatural"], synopsis: "A college student named Ken Kaneki encounters a ghoul. After a violent encounter, Kaneki is transformed into a half-ghoul.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/5/64449l.jpg" } } },
        { mal_id: 31964, title: "Boku no Hero Academia", title_english: "My Hero Academia", score: 7.90, episodes: 13, year: 2016, genres: ["Action"], synopsis: "In a world where most of the population has superpowers, Izuku Midoriya is born without one. But he still dreams of becoming a hero.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/10/78745l.jpg" } } },
        { mal_id: 9969, title: "Gintama'", title_english: "Gintama Season 2", score: 9.03, episodes: 51, year: 2011, genres: ["Action","Comedy","Sci-Fi"], synopsis: "Gintoki, Shinpachi, and Kagura continue to scrape by in odd jobs. But beneath the comedy lies action-packed arcs.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/4/50361l.jpg" } } },
        { mal_id: 28977, title: "Gintama°", title_english: "Gintama Season 4", score: 9.06, episodes: 51, year: 2015, genres: ["Action","Comedy","Sci-Fi"], synopsis: "Gintoki and friends continue their comedic adventures in an alternate Edo period invaded by aliens.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/3/72078l.jpg" } } },
        { mal_id: 28851, title: "Koe no Katachi", title_english: "A Silent Voice", score: 8.93, episodes: 1, year: 2016, genres: ["Award Winning","Drama"], synopsis: "Shouya Ishida, a former bully, seeks out Shouko Nishimiya, the deaf girl he tormented in elementary school.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1122/96435l.jpg" } } },
        { mal_id: 32281, title: "Kimi no Na wa.", title_english: "Your Name.", score: 8.83, episodes: 1, year: 2016, genres: ["Award Winning","Drama","Romance","Supernatural"], synopsis: "Mitsuha and Taki are complete strangers living separate lives. But when Mitsuha makes a wish, they start swapping bodies.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/5/87048l.jpg" } } },
        { mal_id: 431, title: "Howl no Ugoku Shiro", title_english: "Howl's Moving Castle", score: 8.67, episodes: 1, year: 2004, genres: ["Adventure","Drama","Fantasy","Romance"], synopsis: "When Sophie is cursed by a witch, she finds herself in the body of an old woman. Her only hope is the wizard Howl and his magical moving castle.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/5/75810l.jpg" } } },
        { mal_id: 199, title: "Sen to Chihiro no Kamikakushi", title_english: "Spirited Away", score: 8.78, episodes: 1, year: 2001, genres: ["Adventure","Award Winning","Supernatural"], synopsis: "Chihiro stumbles into a magical world ruled by gods, witches, and spirits. She must work in a bathhouse to free herself and her parents.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/6/79597l.jpg" } } },
        { mal_id: 44511, title: "Chainsaw Man", title_english: "Chainsaw Man", score: 8.25, episodes: 12, year: 2022, genres: ["Action","Fantasy"], synopsis: "Denji is a teenage boy living with a Chainsaw Devil named Pochita. After being killed by a devil, Denji is revived as Chainsaw Man.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1806/126216l.jpg" } } },
        { mal_id: 50265, title: "Spy x Family", title_english: "SPY x FAMILY", score: 8.50, episodes: 12, year: 2022, genres: ["Action","Comedy"], synopsis: "A spy known as Twilight must build a fake family to complete a mission. But his new wife and daughter have secrets of their own.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1441/139614l.jpg" } } },
        { mal_id: 21, title: "One Piece", title_english: "One Piece", score: 8.72, episodes: 1100, year: 1999, genres: ["Action","Adventure","Fantasy"], synopsis: "Gol D. Roger was known as the Pirate King. Monkey D. Luffy sets off on a journey to find the legendary treasure One Piece.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/6/73245l.jpg" } } },
        { mal_id: 1735, title: "Naruto: Shippuuden", title_english: "Naruto Shippuden", score: 8.26, episodes: 500, year: 2007, genres: ["Action","Adventure","Fantasy"], synopsis: "It has been two and a half years since Naruto Uzumaki left Konohagakure. Now he returns to face new threats including Akatsuki.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/5/17407l.jpg" } } },
        { mal_id: 20, title: "Naruto", title_english: "Naruto", score: 8.00, episodes: 220, year: 2002, genres: ["Action","Adventure","Fantasy"], synopsis: "Moments prior to Naruto Uzumaki's birth, a huge demon known as the Kyuubi, the Nine-Tailed Fox, attacked Konohagakure.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/13/17405l.jpg" } } },
        { mal_id: 269, title: "Bleach", title_english: "Bleach", score: 7.92, episodes: 366, year: 2004, genres: ["Action","Adventure","Fantasy"], synopsis: "Ichigo Kurosaki is an ordinary high schooler—until his family is attacked by a Hollow, a corrupt spirit that seeks to devour human souls.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/3/40451l.jpg" } } },
        { mal_id: 51009, title: "Bleach: Sennen Kessen-hen", title_english: "Bleach: Thousand-Year Blood War", score: 9.05, episodes: 13, year: 2022, genres: ["Action","Adventure","Fantasy"], synopsis: "The peace is suddenly broken when warning sirens blare through the Soul Society. The Wandenreich declare war against the Shinigami.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1764/126627l.jpg" } } },
        { mal_id: 6547, title: "Angel Beats!", title_english: "Angel Beats!", score: 8.08, episodes: 13, year: 2010, genres: ["Action","Comedy","Drama","Supernatural"], synopsis: "Otonashi awakens only to learn he is dead. In the afterlife, he meets a girl named Yuri who leads the SSS, fighting against Angel.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/10/22061l.jpg" } } },
        { mal_id: 4181, title: "Clannad: After Story", title_english: "Clannad ~After Story~", score: 8.93, episodes: 24, year: 2008, genres: ["Drama","Romance","Supernatural"], synopsis: "Clannad: After Story continues the story of Tomoya Okazaki and Nagisa Furukawa as they navigate adulthood and family life.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1299/110774l.jpg" } } },
        { mal_id: 2167, title: "Clannad", title_english: "Clannad", score: 8.03, episodes: 23, year: 2007, genres: ["Comedy","Drama","Romance","Supernatural"], synopsis: "Tomoya Okazaki is a delinquent who thinks life is dull. He meets Nagisa Furukawa, and their meeting begins to change their lives.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1804/95033l.jpg" } } },
        { mal_id: 2904, title: "Code Geass: Hangyaku no Lelouch R2", title_english: "Code Geass: Lelouch of the Rebellion R2", score: 8.91, episodes: 25, year: 2008, genres: ["Action","Drama","Sci-Fi"], synopsis: "One year has passed since the Black Rebellion. Lelouch Lamperouge regains his memories and continues his rebellion against Britannia.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1088/135089l.jpg" } } },
        { mal_id: 1575, title: "Code Geass: Hangyaku no Lelouch", title_english: "Code Geass: Lelouch of the Rebellion", score: 8.70, episodes: 25, year: 2006, genres: ["Action","Drama","Sci-Fi"], synopsis: "In a world where Britannia has conquered Japan, an exiled prince named Lelouch gains the power of Geass to control anyone's actions.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1032/135088l.jpg" } } },
        { mal_id: 10620, title: "Mirai Nikki", title_english: "Future Diary", score: 7.42, episodes: 26, year: 2011, genres: ["Action","Supernatural","Thriller"], synopsis: "Yukiteru Amano is given a cell phone diary that can predict the future. He is thrust into a survival game against other diary holders.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/13/33465l.jpg" } } },
        { mal_id: 22535, title: "Kiseijuu: Sei no Kakuritsu", title_english: "Parasyte -the maxim-", score: 8.35, episodes: 24, year: 2014, genres: ["Action","Drama","Horror","Sci-Fi"], synopsis: "Parasitic aliens descend on Earth. Shinichi Izumi survives when one fails to take over his brain. Now sharing his body with the parasite Migi.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/3/73178l.jpg" } } },
        { mal_id: 30276, title: "One Punch Man", title_english: "One Punch Man", score: 8.50, episodes: 12, year: 2015, genres: ["Action","Comedy"], synopsis: "Saitama is a hero who can defeat any opponent with a single punch. But being overwhelmingly strong is surprisingly boring.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/12/73235l.jpg" } } },
        { mal_id: 9253, title: "Steins;Gate", title_english: "Steins;Gate", score: 9.07, episodes: 24, year: 2011, genres: ["Sci-Fi","Thriller"], synopsis: "The self-proclaimed mad scientist Okabe creates a device that can send messages to the past, changing the flow of history.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/5/73199l.jpg" } } },
        { mal_id: 33486, title: "Boku no Hero Academia 2nd Season", title_english: "My Hero Academia Season 2", score: 8.14, episodes: 25, year: 2017, genres: ["Action"], synopsis: "The U.A. Sports Festival is about to begin. It's a chance for students to show their quirks and be scouted by pro heroes.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1/84688l.jpg" } } },
        { mal_id: 37510, title: "Mob Psycho 100 II", title_english: "Mob Psycho 100 II", score: 8.78, episodes: 13, year: 2019, genres: ["Action","Comedy","Supernatural"], synopsis: "Mob continues to develop his psychic powers while navigating school life and trying to be a better person under his master Reigen.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1918/96303l.jpg" } } },
        { mal_id: 32182, title: "Mob Psycho 100", title_english: "Mob Psycho 100", score: 8.47, episodes: 12, year: 2016, genres: ["Action","Comedy","Supernatural"], synopsis: "Shigeo Kageyama, a.k.a. Mob, is a boy with immense psychic power. But he just wants to live a normal life.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/8/80356l.jpg" } } },
        { mal_id: 37991, title: "Dororo", title_english: "Dororo", score: 8.17, episodes: 24, year: 2019, genres: ["Action","Adventure","Supernatural"], synopsis: "A samurai lord trades his newborn son's organs for power. Years later, the boy Hyakkimaru sets out to defeat demons and reclaim his body.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1879/100467l.jpg" } } },
        { mal_id: 37521, title: "Vinland Saga", title_english: "Vinland Saga", score: 8.72, episodes: 24, year: 2019, genres: ["Action","Adventure","Drama"], synopsis: "Young Thorfinn grew up listening to tales of a mythical land called Vinland. Now he fights to avenge his father's killer.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1500/103005l.jpg" } } },
        { mal_id: 41467, title: "Bleach: Sennen Kessen-hen", title_english: "Bleach: Thousand-Year Blood War", score: 9.05, episodes: 13, year: 2022, genres: ["Action","Adventure","Fantasy"], synopsis: "Ichigo and the Soul Society face their deadliest enemy yet — the Wandenreich and their leader Yhwach.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1764/126627l.jpg" } } },
        { mal_id: 47917, title: "Bocchi the Rock!", title_english: "Bocchi the Rock!", score: 8.81, episodes: 12, year: 2022, genres: ["Comedy","Music"], synopsis: "Hitori Gotoh, a shy introverted girl, dreams of being in a band. When she's recruited by Nijika, she finally gets her chance.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1448/127956l.jpg" } } },
        { mal_id: 47778, title: "Cyberpunk: Edgerunners", title_english: "Cyberpunk: Edgerunners", score: 8.79, episodes: 10, year: 2022, genres: ["Action","Sci-Fi"], synopsis: "In the dystopian Night City, a street kid named David tries to survive by becoming an edgerunner — a cyberpunk mercenary.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1322/126478l.jpg" } } },
        { mal_id: 51535, title: "Oshi no Ko", title_english: "Oshi No Ko", score: 8.53, episodes: 11, year: 2023, genres: ["Drama","Supernatural"], synopsis: "A doctor who is a fan of a young idol is reborn as her child. He navigates the dark underbelly of the entertainment industry.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1812/134736l.jpg" } } },
        { mal_id: 48583, title: "Shingeki no Kyojin: The Final Season Part 2", title_english: "Attack on Titan Final Season Part 2", score: 8.70, episodes: 12, year: 2022, genres: ["Action","Drama","Fantasy"], synopsis: "Eren Yeager has set the Rumbling into motion. The remaining scouts must decide — save humanity or follow Eren.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1948/120625l.jpg" } } },
        { mal_id: 48569, title: "86", title_english: "86 EIGHTY-SIX", score: 8.17, episodes: 11, year: 2021, genres: ["Action","Drama","Sci-Fi"], synopsis: "In the Republic of San Magnolia, a war is fought by unmanned drones — or so the government claims. The truth is far darker.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1987/117507l.jpg" } } },
        { mal_id: 38000, title: "Kimetsu no Yaiba", title_english: "Demon Slayer", score: 8.45, episodes: 26, year: 2019, genres: ["Action","Fantasy"], synopsis: "Tanjirou fights to save his sister and avenge his family by becoming a demon slayer.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg" } } },
        { mal_id: 40748, title: "Jujutsu Kaisen", title_english: "Jujutsu Kaisen", score: 8.61, episodes: 24, year: 2020, genres: ["Action","Fantasy"], synopsis: "Yuji Itadori joins a secret organization of sorcerers to eliminate a powerful Curse after swallowing one of Sukuna's fingers.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1171/109222l.jpg" } } },
        { mal_id: 40356, title: "Tate no Yuusha no Nariagari", title_english: "The Rising of the Shield Hero", score: 7.94, episodes: 25, year: 2019, genres: ["Action","Adventure","Drama","Fantasy"], synopsis: "Naofumi Iwatani, the Shield Hero, is summoned to another world and must overcome betrayal and discrimination.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1490/101365l.jpg" } } },
        { mal_id: 34572, title: "Black Clover", title_english: "Black Clover", score: 8.14, episodes: 170, year: 2017, genres: ["Action","Comedy","Fantasy"], synopsis: "Asta is a boy born without magic power in a world where magic is everything. He still dreams of becoming the Wizard King.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/2/88336l.jpg" } } },
        { mal_id: 36474, title: "Sword Art Online: Alicization", title_english: "Sword Art Online: Alicization", score: 7.51, episodes: 24, year: 2018, genres: ["Action","Adventure","Fantasy"], synopsis: "Kirito wakes up in the Underworld, a new virtual world. With his new friend Eugeo, he sets off to find Alice.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1993/93837l.jpg" } } },
        { mal_id: 35073, title: "Overlord III", title_english: "Overlord III", score: 7.70, episodes: 13, year: 2018, genres: ["Action","Fantasy"], synopsis: "Ainz Ooal Gown continues to expand the Great Tomb of Nazarick's influence in the new world.", images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1428/91309l.jpg" } } },
    ];

    // Genre-filtered subsets from fallback
    const FALLBACK_BY_GENRE = {
        1: FALLBACK_ANIME.filter(a => a.genres.some(g => ["Action","Adventure"].includes(g))),     // Action
        4: FALLBACK_ANIME.filter(a => a.genres.includes("Comedy")),                                  // Comedy
        10: FALLBACK_ANIME.filter(a => a.genres.some(g => ["Fantasy","Supernatural"].includes(g))),  // Fantasy
        22: FALLBACK_ANIME.filter(a => a.genres.includes("Romance")),                                // Romance
    };

    // ============================================================
    // API METHODS
    // ============================================================

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
            } catch (e) { continue; }
        }
        console.warn('No Consumet instance available');
        return null;
    }

    /**
     * GET request to Jikan API with retry and fallback
     */
    async function jikanGet(path, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const r = await fetch(`https://api.jikan.moe/v4${path}`, {
                    signal: AbortSignal.timeout(10000)
                });
                if (r.status === 429) {
                    console.warn(`Jikan rate limited (attempt ${attempt + 1}), waiting...`);
                    await new Promise(res => setTimeout(res, 2000));
                    continue;
                }
                if (!r.ok) throw new Error(`Jikan ${r.status}`);
                const d = await r.json();
                return d.data || [];
            } catch (e) {
                console.warn(`Jikan error (attempt ${attempt + 1}):`, e.message);
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, 1200));
                }
            }
        }
        return []; // Return empty — caller should use fallback
    }

    /**
     * Get trending/top anime — with fallback
     */
    async function getTopAnime(limit = 20) {
        const api = await jikanGet(`/top/anime?filter=bypopularity&limit=${limit}&sfw=true`);
        if (api.length) return api;
        console.warn('Using fallback data for top anime');
        return FALLBACK_ANIME.slice(0, limit);
    }

    /**
     * Get current season anime — with fallback
     */
    async function getSeasonalAnime(limit = 20) {
        const api = await jikanGet(`/seasons/now?limit=${limit}&sfw=true`);
        if (api.length) return api;
        console.warn('Using fallback data for seasonal anime');
        return FALLBACK_ANIME.slice(5, 5 + limit);
    }

    /**
     * Get anime by genre — with fallback
     */
    async function getAnimeByGenre(genreId, limit = 20) {
        const api = await jikanGet(`/top/anime?genres=${genreId}&limit=${limit}&sfw=true`);
        if (api.length) return api;
        console.warn(`Using fallback data for genre ${genreId}`);
        const fallback = FALLBACK_BY_GENRE[genreId] || FALLBACK_ANIME;
        return fallback.slice(0, limit);
    }

    /**
     * Search anime — with fallback
     */
    async function searchAnime(query, limit = 24) {
        const api = await jikanGet(`/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`);
        if (api.length) return api;
        // Fallback: filter fallback data by query
        const q = query.toLowerCase();
        const filtered = FALLBACK_ANIME.filter(a =>
            (a.title_english || a.title || '').toLowerCase().includes(q) ||
            a.genres.some(g => g.toLowerCase().includes(q))
        );
        return filtered.length ? filtered : FALLBACK_ANIME.slice(0, 10);
    }

    /**
     * Get full anime detail by MAL ID — with fallback
     */
    async function getAnimeDetail(malId) {
        const api = await jikanGet(`/anime/${malId}/full`);
        if (api && api.mal_id) return api;
        // Fallback: find in local data
        const local = FALLBACK_ANIME.find(a => a.mal_id === malId);
        if (local) return local;
        return null;
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
                return { sources: d.sources, headers: d.headers || {} };
            }
        } catch (e) {
            console.warn('Stream fetch error:', e.message);
        }
        return null;
    }

    /**
     * Extract best image URL
     */
    function getImage(anime) {
        return anime?.images?.jpg?.large_image_url
            || anime?.images?.jpg?.image_url
            || anime?.images?.webp?.large_image_url
            || 'https://via.placeholder.com/300x450/150028/7c3aed?text=No+Image';
    }

    return {
        findConsumetInstance,
        jikanGet,
        getTopAnime,
        getSeasonalAnime,
        getAnimeByGenre,
        searchAnime,
        getAnimeDetail,
        searchGogoAnime,
        getEpisodes,
        getStreamUrl,
        getImage,
        FALLBACK_ANIME
    };

})();

window.Funime = Funime;
