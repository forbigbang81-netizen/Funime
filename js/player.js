/**
 * player.js — Custom video player with HLS support
 */
const Funime = window.Funime || {};

Funime.Player = (() => {

    let hls = null;
    let currentSources = null;
    let currentHeaders = {};
    let hideTimer = null;

    /**
     * Helper: get DOM element by id
     */
    function $(id) { return document.getElementById(id); }

    /**
     * Helper: format seconds to m:ss
     */
    function formatTime(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    /**
     * Play a specific episode by index
     */
    async function playEpisode(index) {
        const state = Funime.Router.getState();
        if (index < 0 || index >= state.episodes.length) return;

        Funime.Router.getState().currentEpIndex = index;
        const ep = state.episodes[index];
        const video = $('videoPlayer');
        const overlay = $('playerOverlay');

        // Show player UI
        overlay.classList.remove('hidden');
        $('playerLoader').classList.remove('hidden');
        $('centerPlayBtn').classList.add('hidden');
        $('skipIntroBtn').classList.add('hidden');
        $('playerTitle').textContent = state.currentAnimeDetail?.title_english || state.currentAnimeDetail?.title || '';
        $('playerEpTitle').textContent = `Episode ${ep.number}`;

        // Update episode panel
        renderPlayerEpisodeList();

        // Destroy previous HLS instance
        if (hls) { hls.destroy(); hls = null; }

        // Fetch stream data
        const streamData = await Funime.API.getStreamUrl(ep.id);
        if (!streamData) {
            $('playerLoader').classList.add('hidden');
            Funime.Router.showToast('Failed to load stream. Try again.', 'error');
            return;
        }

        // Populate quality selector
        const qs = $('qualitySelect');
        qs.innerHTML = streamData.sources.map((s, i) =>
            `<option value="${i}">${s.quality || 'Auto'}</option>`
        ).join('');

        // Pick best quality
        let source = streamData.sources.find(s => s.quality === '1080p' && s.isM3U8)
            || streamData.sources.find(s => s.quality === '720p' && s.isM3U8)
            || streamData.sources.find(s => s.isM3U8)
            || streamData.sources[0];

        const srcIdx = streamData.sources.indexOf(source);
        if (srcIdx >= 0) qs.value = srcIdx;

        // Store for quality switching
        currentSources = streamData.sources;
        currentHeaders = streamData.headers;

        // Play via HLS or native
        loadSource(source, video);

        setupPlayerEvents();
        saveToHistory(ep.number);
    }

    /**
     * Load a source URL into the video element
     */
    function loadSource(source, video) {
        if (source.isM3U8 && Hls.isSupported()) {
            hls = new Hls({
                xhrSetup: (xhr) => {
                    if (currentHeaders?.Referer) xhr.setRequestHeader('Referer', currentHeaders.Referer);
                }
            });
            hls.loadSource(source.url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {
                    $('centerPlayBtn').classList.remove('hidden');
                });
                $('playerLoader').classList.add('hidden');
            });
            hls.on(Hls.Events.ERROR, (e, data) => {
                if (data.fatal) {
                    $('playerLoader').classList.add('hidden');
                    Funime.Router.showToast('Stream error. Try another quality.', 'error');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = source.url;
            video.play().catch(() => $('centerPlayBtn').classList.remove('hidden'));
            $('playerLoader').classList.add('hidden');
        } else {
            // Direct URL fallback
            video.src = source.url;
            video.play().catch(() => $('centerPlayBtn').classList.remove('hidden'));
            $('playerLoader').classList.add('hidden');
        }
    }

    /**
     * Switch quality during playback
     */
    function changeQuality(idx) {
        const source = currentSources?.[idx];
        if (!source) return;
        const video = $('videoPlayer');
        const currentTime = video.currentTime;

        if (hls) { hls.destroy(); hls = null; }

        loadSource(source, video);
        // Restore position after a short delay
        setTimeout(() => { video.currentTime = currentTime; }, 500);
    }

    /**
     * Toggle play / pause
     */
    function togglePlay() {
        const v = $('videoPlayer');
        if (v.paused) { v.play().catch(() => {}); }
        else { v.pause(); }
    }

    /**
     * Seek to a position (0-100 percent)
     */
    function seekTo(val) {
        const v = $('videoPlayer');
        v.currentTime = (val / 100) * (v.duration || 0);
    }

    /**
     * Set volume (0-1)
     */
    function setVolume(val) {
        $('videoPlayer').volume = val;
        updateVolIcon(val);
    }

    /**
     * Toggle mute
     */
    function toggleMute() {
        const v = $('videoPlayer');
        v.muted = !v.muted;
        updateVolIcon(v.muted ? 0 : v.volume);
    }

    /**
     * Update volume icon based on level
     */
    function updateVolIcon(vol) {
        const i = $('volIcon');
        if (vol === 0 || $('videoPlayer').muted) {
            i.className = 'fa-solid fa-volume-xmark text-lg';
        } else if (vol < 0.5) {
            i.className = 'fa-solid fa-volume-low text-lg';
        } else {
            i.className = 'fa-solid fa-volume-high text-lg';
        }
    }

    /**
     * Skip 85 seconds (skip intro)
     */
    function skipIntro() {
        $('videoPlayer').currentTime += 85;
    }

    /**
     * Toggle fullscreen mode
     */
    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            $('fsIcon').className = 'fa-solid fa-expand text-lg';
        } else {
            $('playerOverlay').requestFullscreen().catch(() => {});
            $('fsIcon').className = 'fa-solid fa-compress text-lg';
        }
    }

    /**
     * Toggle episode panel sidebar
     */
    function toggleEpisodePanel() {
        const panel = $('episodePanel');
        const isHidden = panel.classList.contains('hidden')
            || panel.style.transform === 'translateX(100%)';

        if (isHidden) {
            panel.classList.remove('hidden');
            requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });
        } else {
            panel.style.transform = 'translateX(100%)';
            setTimeout(() => panel.classList.add('hidden'), 300);
        }
    }

    /**
     * Go to previous episode
     */
    function prevEpisode() {
        const state = Funime.Router.getState();
        if (state.currentEpIndex > 0) {
            playEpisode(state.currentEpIndex - 1);
        } else {
            Funime.Router.showToast('This is the first episode', 'info');
        }
    }

    /**
     * Go to next episode
     */
    function nextEpisode() {
        const state = Funime.Router.getState();
        if (state.currentEpIndex < state.episodes.length - 1) {
            playEpisode(state.currentEpIndex + 1);
        } else {
            Funime.Router.showToast('No more episodes', 'info');
        }
    }

    /**
     * Render episode list inside player sidebar
     */
    function renderPlayerEpisodeList() {
        const state = Funime.Router.getState();
        const el = $('episodeList');
        el.innerHTML = state.episodes.map((ep, i) => `
            <div class="ep-item px-4 py-3 rounded-lg mb-1 ${i === state.currentEpIndex ? 'active' : ''}"
                 onclick="Funime.Player.playEpisode(${i}); Funime.Player.toggleEpisodePanel()">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent-light flex-shrink-0">${ep.number}</span>
                    <span class="text-sm text-white/80">Episode ${ep.number}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Exit player and clean up
     */
    function exitPlayer() {
        const v = $('videoPlayer');
        v.pause();
        if (hls) { hls.destroy(); hls = null; }
        $('playerOverlay').classList.add('hidden');
        $('episodePanel').classList.add('hidden');
        if (document.fullscreenElement) document.exitFullscreen();
        document.onkeydown = null;
    }

    /**
     * Set up video event listeners and auto-hide controls
     */
    function setupPlayerEvents() {
        const video = $('videoPlayer');
        const wrapper = $('playerWrapper');

        // Time update
        video.ontimeupdate = () => {
            $('progressBar').value = (video.currentTime / video.duration) * 100 || 0;
            $('currentTime').textContent = formatTime(video.currentTime);
            $('duration').textContent = formatTime(video.duration);

            // Skip intro button visibility (5s to 90s)
            if (video.currentTime > 5 && video.currentTime < 90) {
                $('skipIntroBtn').classList.remove('hidden');
            } else {
                $('skipIntroBtn').classList.add('hidden');
            }
        };

        video.onplay = () => {
            $('playPauseIcon').className = 'fa-solid fa-pause text-white text-sm';
            $('centerPlayBtn').classList.add('hidden');
        };
        video.onpause = () => {
            $('playPauseIcon').className = 'fa-solid fa-play text-white text-sm ml-0.5';
        };
        video.onended = () => {
            nextEpisode();
        };

        // Auto-hide cursor and controls
        const resetHide = () => {
            wrapper.classList.remove('player-hide-cursor');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                if (!video.paused) wrapper.classList.add('player-hide-cursor');
            }, 3000);
        };

        wrapper.onmousemove = resetHide;
        wrapper.onclick = (e) => {
            if (e.target === video || e.target === wrapper) {
                togglePlay();
                resetHide();
            }
        };

        // Double-click for fullscreen
        video.ondblclick = (e) => {
            e.preventDefault();
            toggleFullscreen();
        };

        // Keyboard shortcuts
        document.onkeydown = (e) => {
            if ($('playerOverlay').classList.contains('hidden')) return;
            switch (e.key) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'ArrowLeft': video.currentTime = Math.max(0, video.currentTime - 10); break;
                case 'ArrowRight': video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); break;
                case 'ArrowUp': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); $('volSlider').value = video.volume * 100; break;
                case 'ArrowDown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); $('volSlider').value = video.volume * 100; break;
                case 'f': toggleFullscreen(); break;
                case 'm': toggleMute(); break;
                case 'Escape': if (document.fullscreenElement) document.exitFullscreen(); else exitPlayer(); break;
                case 'n': nextEpisode(); break;
                case 'p': prevEpisode(); break;
            }
            resetHide();
        };
    }

    /**
     * Save watch progress to localStorage
     */
    function saveToHistory(epNum) {
        const anime = Funime.Router.getState().currentAnimeDetail;
        if (!anime) return;

        const entry = {
            malId: anime.mal_id,
            title: anime.title_english || anime.title,
            image: Funime.API.getImage(anime),
            episode: epNum,
            timestamp: Date.now()
        };

        let history = JSON.parse(localStorage.getItem('funime_history') || '[]');
        history = history.filter(h => h.malId !== entry.malId);
        history.unshift(entry);
        history = history.slice(0, 30);
        localStorage.setItem('funime_history', JSON.stringify(history));
    }

    return {
        playEpisode,
        changeQuality,
        togglePlay,
        seekTo,
        setVolume,
        toggleMute,
        skipIntro,
        toggleFullscreen,
        toggleEpisodePanel,
        prevEpisode,
        nextEpisode,
        exitPlayer
    };

})();

window.Funime = Funime;
