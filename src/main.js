// Create a Promise that will resolve when the Spotify SDK is ready.
let resolveSdkReadyPromise;
const sdkReadyPromise = new Promise(resolve => {
    resolveSdkReadyPromise = resolve;
});

// Define the global callback function. The Spotify SDK will call this.
window.onSpotifyWebPlaybackSDKReady = () => {
    resolveSdkReadyPromise();
};

document.addEventListener('DOMContentLoaded', async () => {
    // Access the Client ID from environment variables
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    const SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';

    const loginView = document.getElementById('login-view'),
        playerView = document.getElementById('player-view'),
        loginBtn = document.getElementById('login-btn'),
        logoutBtn = document.getElementById('logout-btn'),
        playlistBtn = document.getElementById('playlist-btn'),
        playlistMenu = document.getElementById('playlist-menu'),
        repeatBtn = document.getElementById('repeat-btn'),
        queueBtn = document.getElementById('queue-btn'),
        queueModal = document.getElementById('queue-modal'),
        closeQueueBtn = document.getElementById('close-queue-btn'),
        queueContent = document.getElementById('queue-content');

    let player = null,
        progressInterval = null,
        accessToken = null;

    function generateRandomString(length) {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    async function generateCodeChallenge(codeVerifier) {
        function base64encode(string) {
            return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return base64encode(digest);
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
        loginView.classList.remove('hidden');
        loginBtn.addEventListener('click', redirectToAuthCodeFlow);
    } else {
        try {
            accessToken = await getAccessToken(code);
            await initializePlayer(accessToken);
        } catch (error) {
            console.error("Error:", error);
            loginView.classList.remove('hidden');
        }
    }

    async function redirectToAuthCodeFlow() {
        if (!CLIENT_ID) {
            alert('Lỗi: Bạn chưa cấu hình VITE_SPOTIFY_CLIENT_ID trong tệp .env');
            return;
        }
        const verifier = generateRandomString(128);
        const challenge = await generateCodeChallenge(verifier);
        localStorage.setItem("verifier", verifier);
        const authParams = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: "code",
            redirect_uri: REDIRECT_URI,
            scope: SCOPES,
            code_challenge_method: "S256",
            code_challenge: challenge
        });
        document.location = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
    }

    async function getAccessToken(code) {
        const verifier = localStorage.getItem("verifier");
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier
        });
        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });
        if (!result.ok) throw new Error('Could not get token');
        const {
            access_token
        } = await result.json();
        return access_token;
    }

    function createParticles() {
        const container = document.getElementById('particles-container');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 3 + 1;
            p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${Math.random() * 15 + 10}s;animation-delay:${Math.random() * -25}s;`;
            container.appendChild(p);
        }
    }
    createParticles();

    async function initializePlayer(token) {
        loginView.classList.add('hidden');
        playerView.classList.remove('hidden');

        await sdkReadyPromise;

        player = new Spotify.Player({
            name: 'Player Station - Music Station',
            getOAuthToken: cb => {
                cb(token);
            },
            volume: 0.5
        });
        let deviceId = null;

        async function fetchAndPopulatePlaylists(token) {
            playlistMenu.innerHTML = '';
            try {
                const result = await fetch(`https://api.spotify.com/v1/me/playlists`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!result.ok) throw new Error('Could not fetch playlists');
                const data = await result.json();

                if (data.items.length === 0) {
                    playlistMenu.innerHTML = '<span class="px-4 py-2 text-sm text-gray-400">No playlists found.</span>';
                    return null;
                }

                data.items.forEach(playlist => {
                    if (!playlist.name) return;
                    const item = document.createElement('button');
                    item.className = 'block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 truncate';
                    item.textContent = playlist.name;
                    item.onclick = () => {
                        startPlayback(token, deviceId, playlist.uri);
                        playlistMenu.classList.add('hidden');
                    };
                    playlistMenu.appendChild(item);
                });
                return data.items[0].uri;
            } catch (e) {
                console.error("Failed to fetch playlists:", e);
                playlistMenu.innerHTML = '<span class="px-4 py-2 text-sm text-red-400">Error loading playlists.</span>';
                return null;
            }
        }

        const firstPlaylistUri = await fetchAndPopulatePlaylists(token);

        player.addListener('ready', ({
            device_id
        }) => {
            deviceId = device_id;
            if (firstPlaylistUri) {
                startPlayback(token, deviceId, firstPlaylistUri);
            }
        });
        player.addListener('not_ready', () => {
            deviceId = null;
        });
        player.addListener('player_state_changed', (state) => {
            if (!state) return;
            updateUI(state);
        });
        player.connect();

        document.getElementById('play-pause-btn').addEventListener('click', () => player.togglePlay());
        document.getElementById('next-btn').addEventListener('click', () => player.nextTrack());
        document.getElementById('prev-btn').addEventListener('click', () => player.previousTrack());
        document.getElementById('volume-slider').addEventListener('input', (e) => player.setVolume(parseFloat(e.target.value)));
        logoutBtn.addEventListener('click', () => {
            player.disconnect();
            localStorage.removeItem('verifier');
            window.location.href = REDIRECT_URI.split('?')[0];
        });

        repeatBtn.addEventListener('click', () => setRepeatMode(token));
        queueBtn.addEventListener('click', () => fetchAndShowQueue(token));
        closeQueueBtn.addEventListener('click', () => queueModal.classList.add('hidden'));
        queueModal.addEventListener('click', (e) => {
            if (e.target === queueModal) queueModal.classList.add('hidden');
        });

        playlistBtn.addEventListener('click', () => playlistMenu.classList.toggle('hidden'));
        document.addEventListener('click', (e) => {
            if (!playlistBtn.contains(e.target) && !playlistMenu.contains(e.target)) playlistMenu.classList.add('hidden');
        });
    }

    function formatTime(ms) {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }

    function updateUI(state) {
        const track = state.track_window.current_track;
        document.getElementById('cover-art').src = track.album.images[0].url;
        document.getElementById('song-title').textContent = track.name;
        document.getElementById('song-artist').textContent = track.artists.map(a => a.name).join(', ');
        document.getElementById('total-time').textContent = formatTime(state.duration);
        updateRepeatIcon(state.repeat_mode);

        const playIcon = document.getElementById('play-icon'),
            pauseIcon = document.getElementById('pause-icon');
        if (state.paused) {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            clearInterval(progressInterval);
        } else {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            clearInterval(progressInterval);
            let currentPosition = state.position;
            progressInterval = setInterval(() => {
                currentPosition += 1000;
                document.getElementById('progress-bar').style.width = `${(currentPosition / state.duration) * 100}%`;
                document.getElementById('current-time').textContent = formatTime(currentPosition);
            }, 1000);
        }
        document.getElementById('progress-bar').style.width = `${(state.position / state.duration) * 100}%`;
        document.getElementById('current-time').textContent = formatTime(state.position);
    }

    async function startPlayback(token, device_id, playlistUri) {
        if (!device_id || !playlistUri) return;
        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    context_uri: playlistUri
                })
            });
        } catch (e) {
            console.error("Failed to start playback:", e);
        }
    }

    let repeatMode = 0;
    async function setRepeatMode(token) {
        repeatMode = (repeatMode + 1) % 3;
        const states = ['off', 'context', 'track'];
        try {
            await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${states[repeatMode]}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            updateRepeatIcon(repeatMode);
        } catch (e) {
            console.error("Failed to set repeat mode:", e);
        }
    }

    function updateRepeatIcon(mode) {
        repeatMode = mode;
        repeatBtn.classList.toggle('active', mode > 0);
        document.querySelector('.repeat-off-icon').classList.toggle('hidden', mode !== 0);
        document.querySelector('.repeat-context-icon').classList.toggle('hidden', mode !== 1);
        document.querySelector('.repeat-track-icon').classList.toggle('hidden', mode !== 2);
    }

    async function fetchAndShowQueue(token) {
        try {
            const result = await fetch(`https://api.spotify.com/v1/me/player/queue`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!result.ok) throw new Error('Could not fetch queue');
            const data = await result.json();

            queueContent.innerHTML = '';
            if (data.queue.length === 0) {
                queueContent.innerHTML = '<p class="text-gray-400 text-center">Không có bài hát nào trong hàng đợi.</p>';
            } else {
                data.queue.forEach(track => {
                    const trackEl = document.createElement('div');
                    trackEl.className = 'flex items-center space-x-3 p-2 rounded-md hover:bg-white/10';
                    trackEl.innerHTML = `
                                <img src="${track.album.images[2]?.url || 'https://placehold.co/40x40/1a1a1a/ffffff?text=?'}" class="w-10 h-10 rounded flex-shrink-0">
                                <div class="min-w-0 flex-1">
                                    <p class="font-semibold text-white truncate">${track.name}</p>
                                    <p class="text-xs text-gray-400 truncate">${track.artists.map(a => a.name).join(', ')}</p>
                                </div>
                            `;
                    queueContent.appendChild(trackEl);
                });
            }
            queueModal.classList.remove('hidden');
        } catch (e) {
            console.error("Failed to fetch queue:", e);
        }
    }
});
