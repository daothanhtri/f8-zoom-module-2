import {
  getElement,
  getElements,
  addClass,
  removeClass,
  toggleClass,
} from "../utils/dom.js";

const PLAYER_STORAGE_KEY = "SPOTIFY_CLONE_PLAYER_CONFIG";

// DOM elements for the player
const playerElement = getElement(".player");
const playerImage = getElement(".player-image");
const playerTitle = getElement(".player-title");
const playerArtist = getElement(".player-artist");
const audio = getElement("#audio");
const playBtn = getElement(".player-center .play-btn");

// Progress bar elements
const progressBar = getElement(".progress-container .progress-bar");
const progressFill = getElement(".progress-container .progress-fill");
const progressHandle = getElement(".progress-container .progress-handle");
const currentDurationDisplay = getElement(
  ".progress-container .time:first-child"
);
const totalDurationDisplay = getElement(".progress-container .time:last-child");

// Control buttons
const prevBtn = getElement(".player-controls .fa-step-backward")?.closest(
  "button"
);
const nextBtn = getElement(".player-controls .fa-step-forward")?.closest(
  "button"
);
const randomBtn = getElement(".player-controls .fa-random")?.closest("button");
const repeatBtn = getElement(".player-controls .fa-redo")?.closest("button");

// Volume control elements
const volumeBar = getElement(".volume-container .volume-bar");
const volumeFill = getElement(".volume-container .volume-fill");
const volumeHandle = getElement(".volume-container .volume-handle");
const volumeMuteBtn = getElement(".player-right .fa-volume-down")?.closest(
  "button"
);

const repeatOneIconHtml =
  '<i class="fas fa-redo"><span class="repeat-one-text">1</span></i>';

const playerModule = {
  
  currentQueue: [],
  currentIndex: 0,
  isPlaying: false,
  isRandom: false,
  repeatMode: "off", 
  currentVolume: 1,
  config: {},

  initPlayer: function () {
    if (!audio) {
      console.error("Audio element not found. Player cannot be initialized.");
      return;
    }

    this.loadConfig();
    this.defineProperties();
    this.loadCurrentSong();
    this.handleEvents();
    this.updateRandomRepeatButtonsUI();
    this.updateVolumeUI();

    console.log("Player module initialized.");
  },

  setQueueAndPlay: function (tracks, startIndex = 0) {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      console.warn("Attempted to set an empty or invalid queue.");
      return;
    }
    this.currentQueue = tracks;
    this.currentIndex = startIndex;
    this.loadCurrentSong();
    this.playCurrentTrack();
    console.log(`Queue set. Playing "${this.currentSong.title}"`);
  },

  playCurrentTrack: function () {
    if (audio.paused) {
      audio.play();
    }
  },

  loadCurrentSong: function () {
    const currentSong = this.currentSong;
    if (!currentSong) {
      playerImage.src = "placeholder.svg?height=56&width=56";
      playerTitle.textContent = "No song selected";
      playerArtist.textContent = "";
      audio.src = "";
      return;
    }

    playerTitle.textContent = currentSong.title || "Unknown Title";
    playerArtist.textContent = currentSong.artist_name || "Unknown Artist";
    playerImage.src =
      currentSong.image_url ||
      currentSong.album_cover_image_url ||
      "placeholder.svg?height=56&width=56";
    audio.src = currentSong.audio_url;
  },

  formatTime: function (seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedSeconds =
      remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
    return `${minutes}:${formattedSeconds}`;
  },

  defineProperties: function () {
    Object.defineProperty(this, "currentSong", {
      get: function () {
        return this.currentQueue[this.currentIndex];
      },
    });
  },

  handleEvents: function () {
  
    if (playBtn) {
      playBtn.onclick = () => {
        if (this.isPlaying) {
          audio.pause();
        } else {
          audio.play();
        }
      };
    }

   
    audio.onplay = () => {
      this.isPlaying = true;
      if (playerElement) addClass(playerElement, "playing");
      this.updatePlayPauseButton();
    };


    audio.onpause = () => {
      this.isPlaying = false;
      if (playerElement) removeClass(playerElement, "playing");
      this.updatePlayPauseButton();
    };

  
    audio.ontimeupdate = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        this.updateProgressBar(progressPercent);

        if (currentDurationDisplay)
          currentDurationDisplay.textContent = this.formatTime(
            audio.currentTime
          );
        if (totalDurationDisplay)
          totalDurationDisplay.textContent = this.formatTime(audio.duration);
      }
    };

  
    if (progressBar) {
      let isDraggingProgress = false;

      progressBar.onmousedown = (e) => {
        isDraggingProgress = true;
        this.handleProgressBarSeek(e);
        e.preventDefault();
      };

      document.onmouseup = () => {
        isDraggingProgress = false;
      };

      document.onmousemove = (e) => {
        if (isDraggingProgress) {
          this.handleProgressBarSeek(e);
        }
      };

      progressBar.ontouchstart = (e) => {
        isDraggingProgress = true;
        this.handleProgressBarSeek(e.touches[0]);
        e.preventDefault();
      };
      document.ontouchend = () => {
        isDraggingProgress = false;
      };
      document.ontouchmove = (e) => {
        if (isDraggingProgress) {
          this.handleProgressBarSeek(e.touches[0]);
        }
      };
    }

 
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.currentQueue.length === 0) return;
        if (this.isRandom) {
          this.playRandomSong();
        } else {
          this.prevSong();
        }
        audio.play();
      };
    }

    
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.currentQueue.length === 0) return;
        if (this.isRandom) {
          this.playRandomSong();
        } else {
          this.nextSong();
        }
        audio.play();
      };
    }

  
    if (randomBtn) {
      randomBtn.onclick = () => {
        this.isRandom = !this.isRandom;
        this.setConfig("isRandom", this.isRandom);
        this.updateRandomRepeatButtonsUI();
      };
    }

   
    if (repeatBtn) {
      repeatBtn.onclick = () => {
        if (this.repeatMode === "off") {
          this.repeatMode = "all";
        } else if (this.repeatMode === "all") {
          this.repeatMode = "one";
        } else {
          this.repeatMode = "off";
        }
        this.setConfig("repeatMode", this.repeatMode);
        this.updateRandomRepeatButtonsUI();
      };
    }


    audio.onended = () => {
      if (this.currentQueue.length === 0) {
        this.isPlaying = false;
        if (playerElement) removeClass(playerElement, "playing");
        this.updatePlayPauseButton();
        return;
      }

      if (this.repeatMode === "one") {
        
        audio.play();
      } else if (this.repeatMode === "all") {
    
        this.nextSong(); 
        audio.play();
      } else {
       
        if (this.currentIndex === this.currentQueue.length - 1) {
          this.isPlaying = false;
          if (playerElement) removeClass(playerElement, "playing");
          this.updatePlayPauseButton();
          
          this.currentIndex = 0;
          this.loadCurrentSong();
        } else {
        
          this.nextSong();
          audio.play();
        }
      }
    };

   
    if (volumeMuteBtn) {
      volumeMuteBtn.onclick = () => {
        if (audio.volume > 0) {
          audio.volume = 0;
          this.currentVolume = 0;
        } else {
          audio.volume =
            this.config.lastVolume !== undefined ? this.config.lastVolume : 1;
          this.currentVolume = audio.volume;
        }
        this.updateVolumeUI();
      };
    }

 
    if (volumeBar) {
      let isDraggingVolume = false;

      volumeBar.onmousedown = (e) => {
        isDraggingVolume = true;
        this.handleVolumeBarChange(e);
        e.preventDefault();
      };

      document.onmouseup = () => {
        isDraggingVolume = false;
      };

      document.onmousemove = (e) => {
        if (isDraggingVolume) {
          this.handleVolumeBarChange(e);
        }
      };

      volumeBar.ontouchstart = (e) => {
        isDraggingVolume = true;
        this.handleVolumeBarChange(e.touches[0]);
        e.preventDefault();
      };
      document.ontouchend = () => {
        isDraggingVolume = false;
      };
      document.ontouchmove = (e) => {
        if (isDraggingVolume) {
          this.handleVolumeBarChange(e.touches[0]);
        }
      };
    }
  },

  handleProgressBarSeek: function (event) {
    if (!audio.duration || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    let percent = (clickX / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    const seekTime = (audio.duration / 100) * percent;
    audio.currentTime = seekTime;

    this.updateProgressBar(percent);
  },

  handleVolumeBarChange: function (event) {
    if (!volumeBar) return;
    const rect = volumeBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    let newVolume = clickX / rect.width;
    newVolume = Math.max(0, Math.min(1, newVolume));
    audio.volume = newVolume;
    this.currentVolume = newVolume;
    this.setConfig("lastVolume", newVolume);
    this.updateVolumeUI();
  },

  loadConfig: function () {
    try {
      const storedConfig = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY));
      if (storedConfig) {
        this.config = storedConfig;
        this.isRandom = this.config.isRandom || false;
        this.repeatMode = this.config.repeatMode || "off";
        this.currentVolume =
          this.config.lastVolume !== undefined ? this.config.lastVolume : 1;
        audio.volume = this.currentVolume;
      }
    } catch (e) {
      console.error("Failed to load player config from localStorage:", e);
      localStorage.removeItem(PLAYER_STORAGE_KEY);
      this.config = {};
      this.isRandom = false;
      this.repeatMode = "off"; 
      this.currentVolume = 1;
      audio.volume = 1;
    }
  },

  setConfig: function (key, value) {
    this.config[key] = value;
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
  },

  updatePlayPauseButton: function () {
    if (playBtn) {
      if (this.isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    }
  },


  updateRandomRepeatButtonsUI: function () {

    if (randomBtn) {
      toggleClass(randomBtn, "active", this.isRandom);
    }


    if (repeatBtn) {
      removeClass(repeatBtn, "active");
      repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';

      if (this.repeatMode === "all") {
        addClass(repeatBtn, "active");
      } else if (this.repeatMode === "one") {
        addClass(repeatBtn, "active");
        repeatBtn.innerHTML = repeatOneIconHtml; 
      }
    }
  },

  updateProgressBar: function (percent) {
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    if (progressHandle) {
      progressHandle.style.left = `${percent}%`;
      progressHandle.style.transform = "translateX(-50%)";
    }
  },

  updateVolumeUI: function () {
    if (volumeFill) {
      volumeFill.style.width = `${this.currentVolume * 100}%`;
    }
    if (volumeHandle) {
      volumeHandle.style.left = `${this.currentVolume * 100}%`;
      volumeHandle.style.transform = "translateX(-50%)";
    }
    if (volumeMuteBtn) {
      if (this.currentVolume === 0) {
        volumeMuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      } else if (this.currentVolume > 0 && this.currentVolume < 0.5) {
        volumeMuteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
      } else {
        volumeMuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      }
    }
  },


  nextSong: function () {
    if (this.currentQueue.length === 0) return;
    this.currentIndex++;
    if (this.currentIndex >= this.currentQueue.length) {
      this.currentIndex = 0;
    }
    this.loadCurrentSong();
  },

 
  prevSong: function () {
    if (this.currentQueue.length === 0) return;
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.currentQueue.length - 1;
    }
    this.loadCurrentSong();
  },


  playRandomSong: function () {
    if (this.currentQueue.length === 0) return;
    if (this.currentQueue.length === 1) {
      this.loadCurrentSong();
      return;
    }

    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.currentQueue.length);
    } while (newIndex === this.currentIndex);

    this.currentIndex = newIndex;
    this.loadCurrentSong();
  },
};

export default playerModule;
