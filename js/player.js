/**
 * player.js — Custom video player with HLS support
 */
const Funime = window.Funime || {};

Funime.Player = (() => {

    let hls = null;
    let currentSources = null;
    let currentHeaders = {};
    let hideTimer = null;

    function $(id) { return document.getElementById(id); }

    function formatTime(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    async function playEpisode(index) {
        const state = Funime.Router.getState();
        if (index < 0 || index >= state.episodes.length) return;

        state.currentEpIndex = index;
        const ep = state.episodes[index];
        const video = $('videoPlayer');
        const overlay = $('playerOverlay');

        overlay.classList.remove('hidden');
        $('playerLoader').classList.remove('hidden');
        $('centerPlayBtn').classList.add('hidden');
        $('skipIntroBtn').classList.add('hidden');
        $('playerTitle').textContent = state.currentAnimeDetail?.title_english || state.currentAnimeDetail?.title || '';
        $('playerEpTitle').textContent = `Episode ${ep.number}`;

        renderPlayerEpisodeList();

        if (hls) { hls.destroy(); hls = null; }

        const streamData = await Funime.API.getStreamUrl(ep.id);
        if (!streamData) {
            $('playerLoader').classList.add('hidden');
            Funime.Router.showToast('Failed to load stream. The Consumet API may be down.', 'error');
            return;
        }

        const qs = $('qualitySelect');
        qs.innerHTML = streamData.sources.map((s, i) =>
            `<option value="${i}">${s.quality || 'Auto'}</option>`
        ).join('');

        let source = streamData.sources.find(s => s.quality === '1080p' && s.isM3U8)
            || streamData.sources.find(s => s.quality === '720p' && s.isM3U8)
            || streamData.sources.find(s => s.isM3U8)
            || streamData.sources[0];

        const srcIdx = streamData.sources.indexOf(source);
        if (srcIdx >= 0) qs.value = srcIdx;

        currentSources = streamData.sources;
        currentHeaders = streamData.headers;

        loadSource(source, video);
        setupPlayerEvents();
        saveToHistory(ep.number);
    }

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
            video.src = source.url;
            video.play().catch(() => $('centerPlayBtn').classList.remove('hidden'));
            $('playerLoader').classList.add('hidden');
        } else {
            video.src = source.url;
            video.play().catch(() => $('centerPlayBtn').classList.remove('hidden'));
            $('playerLoader').classList.add('hidden');
        }
    }

    function changeQuality(idx) {
        const source = currentSources?.[idx];
        if (!source) return;
        const video = $('videoPlayer');
        const currentTime = video.currentTime;
        if (hls) { hls.destroy(); hls = null; }
        loadSource(source, video);
        setTimeout(() => { video.currentTime = currentTime; }, 500);
    }

    function togglePlay() {
        const v = $('videoPlayer');
        if (v.paused) v.play().catch(() => {});
        else v.pause();
    }

    function seekTo(val) {
        const v = $('videoPlayer');
        v.currentTime = (val / 100) * (v.duration || 0);
    }

    function setVolume(val) {
        $('videoPlayer').volume = val;
        updateVolIcon(val);
    }

    function toggleMute() {
        const v = $('videoPlayer');
        v.muted = !v.muted;
        updateVolIcon(v.muted ? 0 : v.volume);
    }

    function updateVolIcon(vol) {
        const i = $('volIcon');
        if (vol === 0 || $('videoPlayer').muted) i.className = 'fa-solid fa-volume-xmark text-lg';
        else if (vol < 0.5) i.className = 'fa-solid fa-volume-low text-lg';
        else i.className = 'fa-solid fa-volume-high text-lg';
    }

    function skipIntro() { $('videoPlayer').currentTime += 85; }

    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            $('fsIcon').className = 'fa-solid fa-expand text-lg';
        } else {
            $('playerOverlay').requestFullscreen().catch(() => {});
            $('fsIcon').className = 'fa-solid fa-compress text-lg';
        }
    }

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

    function prevEpisode() {
        const state = Funime.Router.getState();
        if (state.currentEpIndex > 0) playEpisode(state.currentEpIndex - 1);
        else Funime.Router.showToast('This is the first episode', 'info');
    }

    function nextEpisode() {
        const state = Funime.Router.getState();
        if (state.currentEpIndex < state.episodes.length - 1) playEpisode(state.currentEpIndex + 1);
        else Funime.Router.showToast('No more episodes', 'info');
    }

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

    function exitPlayer() {
        const v = $('videoPlayer');
        v.pause();
        if (hls) { hls.destroy(); hls = null; }
        $('playerOverlay').classList.add('hidden');
        $('episodePanel').classList.add('hidden');
        if (document.fullscreenElement) document.exitFullscreen();
        document.onkeydown = null;
    }

    function setupPlayerEvents() {
        const video = $('videoPlayer');
        const wrapper = $('playerWrapper');

        video.ontimeupdate = () => {
            $('progressBar').value = (video.currentTime / video.duration) * 100 || 0;
            $('currentTime').textContent = formatTime(video.currentTime);
            $('duration').textContent = formatTime(video.duration);
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
        video.onended = () => nextEpisode();

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

        video.ondblclick = (e) => { e.preventDefault(); toggleFullscreen(); };

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
        playEpisode, changeQuality, togglePlay, seekTo,
        setVolume, toggleMute, skipIntro, toggleFullscreen,
        toggleEpisodePanel, prevEpisode, nextEpisode, exitPlayer
    };

})();

window.Funime = Funime;
