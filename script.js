document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const visualizerCanvas = document.getElementById('visualizer');
    const visualizerCtx = visualizerCanvas.getContext('2d');
    
    const fileInput = document.getElementById('file-input');
    const folderInput = document.getElementById('folder-input'); // New: Folder input
    const playlistEl = document.getElementById('playlist');
    const clearPlaylistBtn = document.getElementById('clear-playlist-btn');

    // New DOM Elements for toggle menu
    const togglePlaylistBtn = document.getElementById('toggle-playlist-btn');
    const appWrapper = document.getElementById('app-wrapper'); // Reference to the new wrapper div

    // New DOM elements for track info
    const currentTrackTitleEl = document.getElementById('current-track-title');
    const currentTrackArtistEl = document.getElementById('current-track-artist');
    const minimizedTimeDisplayEl = document.getElementById('minimized-time-display'); // NEW: Minimized time display element

    // New DOM elements for visualizer controls
    const prevVisualizerBtn = document.getElementById('prev-visualizer-btn');
    const nextVisualizerBtn = document.getElementById('next-visualizer-btn');
    const visualizerTypeDisplayEl = document.getElementById('visualizer-type-display');

    // New DOM element for playback mode button
    const playbackModeBtn = document.getElementById('playback-mode-btn');

    // New DOM elements for tabs and customization
    const addTrackTabBtn = document.getElementById('add-track-tab-btn');
    const customizationTabBtn = document.getElementById('customization-tab-btn');
    const addTrackContent = document.getElementById('add-track-content');
    const customizationContent = document.getElementById('customization-content');

    const goldModeBtn = document.getElementById('gold-mode-btn');
    const rainbowModeBtn = document.getElementById('rainbow-mode-btn');
    const resetThemeBtn = document.getElementById('reset-theme-btn');

    const primaryColorPicker = document.getElementById('primary-color-picker');
    const textColorPicker = document.getElementById('text-color-picker');
    const backgroundColorPicker = document.getElementById('background-color-picker');

    // New DOM elements for control display options
    const controlsEl = document.getElementById('controls');
    const normalControlsBtn = document.getElementById('normal-controls-btn');
    const minControlsBtn = document.getElementById('min-controls-btn');
    const hideControlsBtn = document.getElementById('hide-controls-btn');

    const progressContainer = document.getElementById('progress-container'); // Get reference to progress container
    const buttonsContainer = document.getElementById('buttons-container'); // Get reference to buttons container

    // State
    let playlist = [];
    let currentTrackIndex = -1;
    let isPlaying = false;
    let isPlaylistVisible = false; // Default to hidden
    let currentTheme = 'default'; // 'default', 'gold', 'rainbow', 'custom'
    let currentControlsDisplayMode = 'normal'; // 'normal', 'minimized', 'hidden'

    // Store original colors for reset
    const originalColors = {
        primary: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
        text: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
        bg: getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(),
        secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim()
    };

    // Store gold colors for visualizer gradient (from CSS variables)
    const goldColors = {
        dark: getComputedStyle(document.documentElement).getPropertyValue('--gold-dark').trim(),
        medium: getComputedStyle(document.documentElement).getPropertyValue('--gold-medium').trim(),
        light: getComputedStyle(document.documentElement).getPropertyValue('--gold-light').trim(),
        highlight: getComputedStyle(document.documentElement).getPropertyValue('--gold-highlight').trim()
    };

    // Playback Modes
    const playbackModes = [
        { name: 'Loop Playlist', icon: '<i class="fas fa-redo-alt"></i>' }, // Loop the entire playlist
        { name: 'Shuffle', icon: '<i class="fas fa-shuffle"></i>' },       // Random order
        { name: 'Linear', icon: '<i class="fas fa-arrow-right"></i>' }    // Play in order, stop at end
    ];
    let currentPlaybackModeIndex = 0; // Default to 'Loop Playlist'

    // Web Audio API for visualizer
    let audioContext;
    let analyser;
    let sourceNodeFileAudio;
    let animationFrameId;

    // Define visualizer types with icons
    const visualizerTypes = [
        {
            name: 'Bars',
            icon: '<i class="fas fa-chart-bar"></i>', // Icon for bars
            draw: (analyser, ctx, canvas) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                // Check for gold theme to apply gradient
                if (document.body.classList.contains('gold-theme')) {
                    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                    gradient.addColorStop(0, goldColors.medium);
                    gradient.addColorStop(0.25, goldColors.light);
                    gradient.addColorStop(0.5, goldColors.highlight);
                    gradient.addColorStop(0.75, goldColors.light);
                    gradient.addColorStop(1, goldColors.medium);
                    ctx.fillStyle = gradient;
                } else {
                    // Set bars to the current primary color
                    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                    ctx.fillStyle = primaryColor;
                }
                
                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] * (canvas.height / 255);
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            }
        },
        {
            name: 'Waveform',
            icon: '<i class="fas fa-wave-square"></i>', // Icon for waveform
            draw: (analyser, ctx, canvas) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const bufferLength = analyser.fftSize; // Use fftSize for time domain
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteTimeDomainData(dataArray);

                ctx.lineWidth = 2;
                // Check for gold theme to apply gradient
                if (document.body.classList.contains('gold-theme')) {
                    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                    gradient.addColorStop(0, goldColors.medium);
                    gradient.addColorStop(0.25, goldColors.light);
                    gradient.addColorStop(0.5, goldColors.highlight);
                    gradient.addColorStop(0.75, goldColors.light);
                    gradient.addColorStop(1, goldColors.medium);
                    ctx.strokeStyle = gradient;
                } else {
                    // Set waveform to the current primary color
                    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                    ctx.strokeStyle = primaryColor;
                }
                
                ctx.beginPath();

                const sliceWidth = canvas.width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0; // Data is 0-255, 128 is center
                    const y = v * canvas.height / 2; // Map to canvas height

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }
                ctx.lineTo(canvas.width, canvas.height / 2); // Connect to end
                ctx.stroke();
            }
        },
        {
            name: 'Lines',
            icon: '<i class="fas fa-grip-lines"></i>', // Icon for lines
            draw: (analyser, ctx, canvas) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                ctx.lineWidth = 2;
                // Check for gold theme to apply gradient
                if (document.body.classList.contains('gold-theme')) {
                    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                    gradient.addColorStop(0, goldColors.medium);
                    gradient.addColorStop(0.25, goldColors.light);
                    gradient.addColorStop(0.5, goldColors.highlight);
                    gradient.addColorStop(0.75, goldColors.light);
                    gradient.addColorStop(1, goldColors.medium);
                    ctx.strokeStyle = gradient;
                } else {
                    // Set lines to the current primary color
                    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                    ctx.strokeStyle = primaryColor;
                }
                
                ctx.beginPath();

                const sliceWidth = canvas.width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 255.0; // Normalize 0-1
                    const y = canvas.height - (v * canvas.height); // Invert for bottom-up drawing

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }
                ctx.stroke();
            }
        }
    ];
    let currentVisualizerTypeIndex = 0; // Default to the first visualizer

    // Audio/Video Element for file playback
    const audioPlayer = new Audio();
    audioPlayer.volume = volumeSlider.value;

    // Add event listeners for file audio playback state
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseIcon();
    });

    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseIcon();
    });

    audioPlayer.addEventListener('ended', () => {
        // isPlaying will be set to true by playNext if it loops, otherwise it remains false.
        playNext(); 
    });
    
    // Listen for time updates for file audio for smoother progress bar
    audioPlayer.addEventListener('timeupdate', updateProgress);
    
    // --- Audio Visualizer ---
    function initAudioContext() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        // Create a single source for file-based audio from the main audio element
        sourceNodeFileAudio = audioContext.createMediaElementSource(audioPlayer);
        sourceNodeFileAudio.connect(analyser);
        
        // Connect analyser to output to hear the sound
        analyser.connect(audioContext.destination);
    }

    function startVisualizer() {
        if (!analyser) {
            initAudioContext(); // Ensure audio context and analyser are initialized
            if (!analyser) return; // If still not initialized, something went wrong
        }

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        visualizerCanvas.style.display = 'block';
        visualizerCanvas.width = visualizerCanvas.clientWidth;   // Set canvas dimensions to match CSS
        visualizerCanvas.height = visualizerCanvas.clientHeight; // of its parent (#player-section)
        
        const currentVisualizer = visualizerTypes[currentVisualizerTypeIndex];

        const drawLoop = () => {
            animationFrameId = requestAnimationFrame(drawLoop);
            currentVisualizer.draw(analyser, visualizerCtx, visualizerCanvas);
        };
        drawLoop();
        updateVisualizerTypeDisplay();
    }
    
    function stopVisualizer() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        visualizerCanvas.style.display = 'none';
        visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    }


    // --- Playlist Management ---
    function renderPlaylist() {
        playlistEl.innerHTML = '';
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            
            const trackName = document.createElement('span');
            trackName.className = 'track-name';
            trackName.textContent = track.title;
            li.appendChild(trackName);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-track-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                removeTrack(index);
            };
            li.appendChild(deleteBtn);

            if (index === currentTrackIndex) {
                li.classList.add('playing');
                // Ensure text color is set to --text-color for flexibility with themes
                trackName.style.color = 'var(--text-color)'; 
                deleteBtn.style.color = 'var(--text-color)';
            } else {
                // Reset colors if not playing to default for non-playing tracks
                trackName.style.color = ''; 
                deleteBtn.style.color = 'var(--text-muted-color)';
            }
            li.addEventListener('click', () => {
                playTrack(index);
            });
            playlistEl.appendChild(li);
        });
    }

    function addTrack(track) {
        playlist.push(track);
        renderPlaylist();
        // If it's the first track being added, start playing it.
        if (currentTrackIndex === -1 && playlist.length === 1) {
            playTrack(0);
        }
    }
    
    function removeTrack(index) {
        playlist.splice(index, 1);

        if (index === currentTrackIndex) {
            if (playlist.length === 0) {
                stopAllPlayback();
                currentTrackIndex = -1;
            } else {
                // If currently playing track was removed, play the next one (or loop).
                playNext();
            }
        } else if (index < currentTrackIndex) {
            currentTrackIndex--;
        }
        
        renderPlaylist();
    }

    // --- Playback Logic ---
    function loadTrack(index) {
        if (index < 0 || index >= playlist.length) return;
        
        currentTrackIndex = index;
        const track = playlist[currentTrackIndex];

        stopAllPlayback(); // This resets isPlaying to false and updates the icon to 'play'
        resetPlayerUI();
        
        currentTrackTitleEl.textContent = track.title || 'No track selected';
        currentTrackArtistEl.textContent = track.artist || '';

        startVisualizer(); // Always show visualizer for file tracks
        
        audioPlayer.src = track.src;
        audioPlayer.load(); // Just load the audio, play() will start it
        
        renderPlaylist();
    }
    
    function playTrack(index) {
       if (!audioContext) initAudioContext();
       loadTrack(index); // Load the track without immediately playing
       play(); // Then call play to start playback, which also handles AudioContext resume
    }
    
    function play() {
        if (!audioContext) initAudioContext();
        // Resume audio context on user interaction
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (currentTrackIndex === -1 && playlist.length > 0) {
            playTrack(0); // If nothing is selected, load and play the first track
            return; // Exit to avoid double playing/race conditions
        }
        if (currentTrackIndex === -1) return; // No track to play

        // isPlaying and icon update handled by audioPlayer 'play' event listener
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay was prevented by the browser for file audio. User interaction is required to initiate playback:", error);
                isPlaying = false;
                updatePlayPauseIcon();
            });
        }
        // isPlaying and icon update are handled by player events ('play' for Audio)
    }
    
    function pause() {
        if (currentTrackIndex === -1) return;
        // Pause for file audio
        audioPlayer.pause();
        // isPlaying and icon update are handled by player events ('pause' for Audio)
    }

    function playNext() {
        if (playlist.length === 0) {
            stopAllPlayback();
            currentTrackIndex = -1;
            resetPlayerUI();
            return;
        }

        const currentMode = playbackModes[currentPlaybackModeIndex].name;
        let nextIndex;

        if (currentMode === 'Shuffle') {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * playlist.length);
            } while (playlist.length > 1 && randomIndex === currentTrackIndex); // Ensure different track if more than one
            nextIndex = randomIndex;
        } else if (currentMode === 'Linear') {
            nextIndex = currentTrackIndex + 1;
            if (nextIndex >= playlist.length) {
                // End of playlist, stop playback
                stopAllPlayback();
                currentTrackIndex = -1; // Reset current track index
                resetPlayerUI();
                renderPlaylist(); // Update UI to remove 'playing' class
                return; // Don't play anything
            }
        } else { // Default or 'Loop Playlist'
            nextIndex = currentTrackIndex + 1;
            if (nextIndex >= playlist.length) {
                nextIndex = 0; // Loop playlist
            }
        }
        playTrack(nextIndex);
    }

    function playPrev() {
        let prevIndex = currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = playlist.length - 1; // Loop to end
        }
        if (playlist.length > 0) {
            playTrack(prevIndex);
        } else {
            stopAllPlayback();
            currentTrackIndex = -1;
            resetPlayerUI();
        }
    }
    
    function stopAllPlayback() {
        // No YouTube player to stop/destroy
        audioPlayer.pause();
        audioPlayer.src = ''; // Clear current source
        isPlaying = false; // Ensure state is paused
        updatePlayPauseIcon(); // Update UI
    }

    function resetPlayerUI() {
        stopVisualizer();
        progressBar.value = 0;
        progressBar.style.setProperty('--progress-fill-percentage', '0%'); // Reset fill percentage
        currentTimeEl.textContent = '0:00';
        totalDurationEl.textContent = '0:00';
        currentTrackTitleEl.textContent = 'No track selected';
        currentTrackArtistEl.textContent = '';
        minimizedTimeDisplayEl.textContent = ''; // Clear minimized time
        updateVisualizerTypeDisplay(); // Ensure visualizer type is shown even when not active
    }


    // --- UI Updates & Event Handlers ---
    function updatePlayPauseIcon() {
        playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function updateProgress() {
        if (currentTrackIndex === -1 || (!isPlaying && !audioPlayer.src)) {
             // Clear time displays if no track is playing or loaded
            currentTimeEl.textContent = '0:00';
            totalDurationEl.textContent = '0:00';
            minimizedTimeDisplayEl.textContent = '';
            progressBar.value = 0;
            progressBar.style.setProperty('--progress-fill-percentage', '0%');
            return;
        }

        const track = playlist[currentTrackIndex];
        let currentTime, duration;

        if (track && track.type === 'file') {
            currentTime = audioPlayer.currentTime;
            duration = audioPlayer.duration;
        } else {
            // This case should ideally not be reached if the initial check passes
            currentTimeEl.textContent = '0:00';
            totalDurationEl.textContent = '0:00';
            minimizedTimeDisplayEl.textContent = '';
            progressBar.value = 0;
            progressBar.style.setProperty('--progress-fill-percentage', '0%');
            return;
        }

        if (duration && !isNaN(duration)) { // Check for valid duration
            const percentage = (currentTime / duration) * 100 || 0;
            progressBar.value = percentage;
            progressBar.style.setProperty('--progress-fill-percentage', `${percentage}%`); // Append '%' in JS
            
            if (currentControlsDisplayMode === 'minimized') {
                minimizedTimeDisplayEl.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
                currentTimeEl.textContent = ''; // Clear original elements
                totalDurationEl.textContent = ''; // Clear original elements
            } else {
                currentTimeEl.textContent = formatTime(currentTime);
                totalDurationEl.textContent = formatTime(duration);
                minimizedTimeDisplayEl.textContent = ''; // Clear minimized element
            }
        } else {
            // Handle cases where duration might not be immediately available
            currentTimeEl.textContent = '0:00';
            totalDurationEl.textContent = '0:00';
            minimizedTimeDisplayEl.textContent = '';
            progressBar.value = 0;
            progressBar.style.setProperty('--progress-fill-percentage', '0%');
        }
    }
    
    function handleFileUpload(files) {
        for (const file of files) {
             if (!file.type.startsWith('audio/')) {
                // Optionally log or alert if non-audio files are found in a folder upload
                console.warn(`Skipping non-audio file: ${file.name}`);
                continue;
            }

            const track = {
                type: 'file',
                src: URL.createObjectURL(file),
                title: file.name.replace(/\.[^/.]+$/, ""),
                fileType: file.type,
                artist: 'Unknown Artist'
            };
            
            // Using jsmediatags to read metadata
            window.jsmediatags.read(file, {
                onSuccess: function(tag) {
                    if(tag.tags.title) track.title = tag.tags.title;
                    if(tag.tags.artist) track.artist = tag.tags.artist;
                    addTrack(track);
                },
                onError: function(error) {
                    console.log('Error reading media tags:', error);
                    addTrack(track); // Add with filename as title if error occurs
                }
            });
        }
    }

    // New Toggle Playlist Function
    function togglePlaylist() {
        isPlaylistVisible = !isPlaylistVisible;
        if (isPlaylistVisible) {
            appWrapper.classList.add('playlist-open');
        } else {
            appWrapper.classList.remove('playlist-open');
        }
    }

    // Visualizer type switching functions
    function updateVisualizerTypeDisplay() {
        // Set innerHTML to display the icon directly
        visualizerTypeDisplayEl.innerHTML = visualizerTypes[currentVisualizerTypeIndex].icon;
    }

    function nextVisualizer() {
        currentVisualizerTypeIndex = (currentVisualizerTypeIndex + 1) % visualizerTypes.length;
        if (playlist[currentTrackIndex]?.type === 'file' && isPlaying) {
            startVisualizer(); // Re-start visualizer with new type if currently playing a file
        } else {
            updateVisualizerTypeDisplay(); // Just update display if not active or not a file
        }
    }

    function prevVisualizer() {
        currentVisualizerTypeIndex = (currentVisualizerTypeIndex - 1 + visualizerTypes.length) % visualizerTypes.length;
        if (playlist[currentTrackIndex]?.type === 'file' && isPlaying) {
            startVisualizer(); // Re-start visualizer with new type if currently playing a file
        } else {
            updateVisualizerTypeDisplay(); // Just update display if not active or not a file
        }
    }

    // Playback mode switching functions
    function updatePlaybackModeIcon() {
        playbackModeBtn.innerHTML = playbackModes[currentPlaybackModeIndex].icon;
        playbackModeBtn.title = `Playback Mode: ${playbackModes[currentPlaybackModeIndex].name}`;
    }

    function togglePlaybackMode() {
        currentPlaybackModeIndex = (currentPlaybackModeIndex + 1) % playbackModes.length;
        updatePlaybackModeIcon();
        console.log(`Playback mode changed to: ${playbackModes[currentPlaybackModeIndex].name}`);
    }

    // --- Tab and Customization Logic ---
    function showTab(tabId) {
        // Deactivate all tab buttons and hide all tab contents
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activate the clicked tab button and show its content
        document.getElementById(`${tabId}-tab-btn`).classList.add('active');
        document.getElementById(`${tabId}-content`).classList.add('active');
    }

    // Helper to adjust hex color brightness
    function adjustColorBrightness(hex, percent) {
        var f = parseInt(hex.slice(1), 16),
            t = percent < 0 ? 0 : 255,
            p = Math.abs(percent),
            R = f >> 16,
            G = (f >> 8) & 0x00ff,
            B = f & 0x0000ff;
        return (
            "#" +
            (
                0x1000000 +
                (Math.round((t - R) * p) + R) * 0x10000 +
                (Math.round((t - G) * p) + G) * 0x100 +
                (Math.round((t - B) * p) + B)
            )
            .toString(16)
            .slice(1)
        );
    }

    // New: Function to enable/disable color pickers
    function updateColorPickerState() {
        const colorPickersContainer = document.querySelector('.color-pickers');
        if (document.body.classList.contains('gold-theme') || document.body.classList.contains('rainbow-theme')) {
            colorPickersContainer.classList.add('disabled-pickers');
            primaryColorPicker.disabled = true;
            textColorPicker.disabled = true;
            backgroundColorPicker.disabled = true;
        } else {
            colorPickersContainer.classList.remove('disabled-pickers');
            primaryColorPicker.disabled = false;
            textColorPicker.disabled = false;
            backgroundColorPicker.disabled = false;
        }
    }


    function applyTheme(theme) {
        document.body.classList.remove('gold-theme', 'rainbow-theme'); // Clear previous themes
        currentTheme = theme;

        // Clear existing animation on the body for --primary-color
        document.body.style.animation = '';

        // Reset non-primary custom CSS variables to defaults
        document.documentElement.style.setProperty('--text-color', originalColors.text);
        document.documentElement.style.setProperty('--bg-color', originalColors.bg);
        document.documentElement.style.setProperty('--secondary-color', originalColors.secondary);
        
        switch (theme) {
            case 'gold':
                document.body.classList.add('gold-theme');
                // Color pickers will be updated by CSS vars or remain at current values
                primaryColorPicker.value = originalColors.primary; // Show default in picker
                textColorPicker.value = originalColors.text;
                backgroundColorPicker.value = originalColors.bg;
                // Gold theme applies its colors via specific CSS rules/variables not by direct JS --primary-color
                break;
            case 'rainbow':
                document.body.classList.add('rainbow-theme');
                // The CSS animation will handle the smooth color transitions
                // Reset primary color to default so hue-rotate can work properly
                document.documentElement.style.setProperty('--primary-color', originalColors.primary);
                // Color pickers should still show original or last custom colors as rainbow is CSS driven
                primaryColorPicker.value = originalColors.primary; // Show default in picker
                textColorPicker.value = originalColors.text;
                backgroundColorPicker.value = originalColors.bg;
                break;
            case 'custom':
                // Colors are already set by the picker listeners.
                // This case handles the explicit setting when a picker is used.
                // No need to set default values for pickers here.
                break;
            case 'default':
            default:
                // Explicitly set primary color back to default
                document.documentElement.style.setProperty('--primary-color', originalColors.primary);
                // Reset color pickers to default values
                primaryColorPicker.value = originalColors.primary;
                textColorPicker.value = originalColors.text;
                backgroundColorPicker.value = originalColors.bg;
                break;
        }
        updateColorPickerState(); // Update picker state after theme is applied
    }

    // New: Function to set controls display mode
    function setControlsDisplayMode(mode) {
        controlsEl.classList.remove('minimized-controls', 'hidden-controls');
        currentControlsDisplayMode = mode;
        if (mode === 'minimized') {
            controlsEl.classList.add('minimized-controls');
            // Hide normal elements and show minimized ones
            progressContainer.style.display = 'none';
            buttonsContainer.style.display = 'none';
            minimizedTimeDisplayEl.style.display = 'inline';
            visualizerControls.style.display = 'none'; // Also hide visualizer controls
        } else if (mode === 'hidden') {
            controlsEl.classList.add('hidden-controls');
            // Ensure elements are in default (hidden or shown) state for "hidden" mode
            progressContainer.style.display = ''; // Reset to default (flex in CSS)
            buttonsContainer.style.display = ''; // Reset to default (flex in CSS)
            minimizedTimeDisplayEl.style.display = 'none';
            visualizerControls.style.display = ''; // Reset to default (flex in CSS)
            // Clear minimized time text
            minimizedTimeDisplayEl.textContent = '';
        } else { // 'normal'
            // Ensure elements are in their default visible state
            progressContainer.style.display = ''; // Reset to default (flex in CSS)
            buttonsContainer.style.display = ''; // Reset to default (flex in CSS)
            minimizedTimeDisplayEl.style.display = 'none';
            visualizerControls.style.display = ''; // Reset to default (flex in CSS)
            // Clear minimized time text
            minimizedTimeDisplayEl.textContent = '';
        }
        // Update progress bar once mode is set to reflect changes immediately
        updateProgress();
    }


    // Event Listeners
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) pause();
        else play();
    });
    
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value); // Ensure volume is a float
        audioPlayer.volume = volume;
        volumeSlider.style.setProperty('--volume-fill-percentage', `${volume * 100}%`); // Append '%' in JS
    });

    progressBar.addEventListener('input', (e) => {
        if (currentTrackIndex === -1) return;
        const track = playlist[currentTrackIndex];
        let duration = 0;

        if (track.type === 'file') {
            duration = audioPlayer.duration;
        }

        if (duration && !isNaN(duration)) {
            const newTime = (e.target.value / 100) * duration;
            audioPlayer.currentTime = newTime;
            // Update progress bar fill immediately after seeking
            progressBar.style.setProperty('--progress-fill-percentage', `${e.target.value}%`); // Append '%' in JS
            // Also update the displayed time and total duration while seeking
            currentTimeEl.textContent = formatTime(newTime);
            totalDurationEl.textContent = formatTime(duration);
        }
    });

    fileInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
        e.target.value = ''; // Reset input
    });

    // New: Event listener for folder input
    folderInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
        e.target.value = ''; // Reset input
    });
    
    clearPlaylistBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire playlist?')) {
            playlist = [];
            currentTrackIndex = -1;
            stopAllPlayback();
            renderPlaylist();
            resetPlayerUI();
        }
    });

    // Toggle button listener
    togglePlaylistBtn.addEventListener('click', togglePlaylist);

    // Visualizer control listeners
    prevVisualizerBtn.addEventListener('click', prevVisualizer);
    nextVisualizerBtn.addEventListener('click', nextVisualizer);

    // Playback mode control listener
    playbackModeBtn.addEventListener('click', togglePlaybackMode);

    // Tab control listeners
    addTrackTabBtn.addEventListener('click', () => showTab('add-track'));
    customizationTabBtn.addEventListener('click', () => showTab('customization'));

    // Customization control listeners
    goldModeBtn.addEventListener('click', () => applyTheme('gold'));
    rainbowModeBtn.addEventListener('click', () => applyTheme('rainbow'));
    resetThemeBtn.addEventListener('click', () => applyTheme('default'));

    primaryColorPicker.addEventListener('input', (e) => {
        applyTheme('custom');
        document.documentElement.style.setProperty('--primary-color', e.target.value);
    });
    textColorPicker.addEventListener('input', (e) => {
        applyTheme('custom');
        document.documentElement.style.setProperty('--text-color', e.target.value);
    });
    backgroundColorPicker.addEventListener('input', (e) => {
        applyTheme('custom');
        const chosenBgColor = e.target.value;
        document.documentElement.style.setProperty('--bg-color', chosenBgColor);
        // Make secondary color slightly brighter than the background to maintain contrast
        document.documentElement.style.setProperty('--secondary-color', adjustColorBrightness(chosenBgColor, 0.1));
    });

    // Control display options listeners
    normalControlsBtn.addEventListener('click', () => setControlsDisplayMode('normal'));
    minControlsBtn.addEventListener('click', () => setControlsDisplayMode('minimized'));
    hideControlsBtn.addEventListener('click', () => setControlsDisplayMode('hidden'));


    // --- Initial Load ---
    function initializeApp() {
        // Initially hide the playlist on load as per the previous request
        appWrapper.classList.remove('playlist-open');
        isPlaylistVisible = false;

        // On initial load, playlist is empty and no track is selected.
        // Ensure UI is reset to default 'No track selected' state.
        resetPlayerUI();
        isPlaying = false; // Ensure play button shows 'play' initially
        updatePlayPauseIcon(); // Update the icon based on isPlaying
        
        updateVisualizerTypeDisplay(); // Set initial visualizer display
        updatePlaybackModeIcon(); // Set initial playback mode display

        // Set initial progress bar fill
        progressBar.style.setProperty('--progress-fill-percentage', '0%');
        // Set initial volume slider fill
        volumeSlider.style.setProperty('--volume-fill-percentage', `${volumeSlider.value * 100}%`);

        // Show the default tab (Add to Playlist) on initialization
        showTab('add-track');

        updateColorPickerState(); // Initialize picker state on load
        setControlsDisplayMode('normal'); // Set initial controls display mode
        minimizedTimeDisplayEl.style.display = 'none'; // Ensure this is hidden by default
    }

    initializeApp();
});