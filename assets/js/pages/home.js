import {
  getElement,
  getElements,
  addClass,
  removeClass,
} from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { getPopularTracks, getTrendingTracks } from "../api/tracks.js";
import { getTrendingArtists } from "../api/artists.js";
import playerModule from "../components/player.js";

const homeSections = getElement("#homeSections");
const hitsGrid = getElement("#hitsGrid");
const artistsGrid = getElement("#artistsGrid");

let navigateToCallback = null;

const createCard = (item, type) => {
  const card = document.createElement("div");
  card.classList.add(type === "track" ? "hit-card" : "artist-card");
  card.dataset.id = item.id;
  card.dataset.type = type;

  let imageUrl;
  let title = item.name || item.title;
  let subtitle;
  let playButtonClass;
  let playButtonElement;

  if (type === "track") {
    imageUrl =
      item.image_url ||
      item.album_cover_image_url ||
      "https://via.placeholder.com/160?text=No+Track+Cover";
    subtitle = item.artist_name || "Unknown Artist";
    playButtonClass = "hit-play-btn";
  } else {
    // type === "artist"
    imageUrl =
      item.image_url || "https://via.placeholder.com/160?text=No+Avatar";
    subtitle = "Artist";
    playButtonClass = "artist-play-btn";
  }

  title = title || "Unknown Title";

  card.innerHTML = `
        <div class="${
          type === "track" ? "hit-card-cover" : "artist-card-cover"
        }">
            <img src="${imageUrl}" alt="${title}" />
            <button class="${playButtonClass}"><i class="fas fa-play"></i></button>
        </div>
        <div class="${type === "track" ? "hit-card-info" : "artist-card-info"}">
            <h3 class="${
              type === "track" ? "hit-card-title" : "artist-card-name"
            }">${title}</h3>
            <p class="${
              type === "track" ? "hit-card-artist" : "artist-card-type"
            }">${subtitle}</p>
        </div>
    `;

  if (type === "artist") {
    const artistImage = card.querySelector(".artist-card-cover img");
    if (artistImage) {
      artistImage.style.borderRadius = "var(--radius-full)";
    }
  }

  playButtonElement = card.querySelector(`.${playButtonClass}`);

  card.addEventListener("click", (e) => {
    if (
      e.target !== playButtonElement &&
      !playButtonElement.contains(e.target)
    ) {
      if (navigateToCallback) {
        navigateToCallback("detail", item.id, type);
      }
    }
  });

  if (type === "track" && playButtonElement) {
    playButtonElement.addEventListener("click", () => {
      const allDisplayedTrackElements = getElements(".hit-card", hitsGrid);
      const queue = Array.from(allDisplayedTrackElements).map((el) => {
        return el.itemData;
      });

      const clickedTrackIndex = queue.findIndex(
        (track) => track.id === item.id
      );

      if (clickedTrackIndex !== -1) {
        playerModule.setQueueAndPlay(queue, clickedTrackIndex);
      } else {
        console.warn("Clicked track not found in the current queue.");

        playerModule.setQueueAndPlay([item], 0);
      }
    });
  }

  return card;
};

export const renderHomePage = async () => {
  removeClass(homeSections, "hidden");
  hitsGrid.innerHTML = "";
  artistsGrid.innerHTML = "";

  // Load "Today's Biggest Hits"
  let loadedTracks = [];
  try {
    const tracksResponse = await getTrendingTracks();
    loadedTracks = Array.isArray(tracksResponse?.data)
      ? tracksResponse.data
      : [];

    console.log("Popular Tracks from API:", loadedTracks);

    if (loadedTracks.length > 0) {
      loadedTracks.forEach((track) => {
        const card = createCard(track, "track");

        card.itemData = track;
        hitsGrid.appendChild(card);
      });
    } else {
      hitsGrid.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No popular tracks found.</p>`;
    }
  } catch (error) {
    console.error("Failed to load popular tracks for home page:", error);
    showToast(
      error.message ||
        "Failed to load 'Today's biggest hits'. Please try again later.",
      "error"
    );
  }

  // Load "Popular Artists"
  let loadedArtists = [];
  try {
    const artistsResponse = await getTrendingArtists();
    loadedArtists = Array.isArray(artistsResponse?.data)
      ? artistsResponse.data
      : [];

    console.log("Popular Artists from API:", loadedArtists);

    if (loadedArtists.length > 0) {
      loadedArtists.forEach((artist) => {
        const card = createCard(artist, "artist");
        artistsGrid.appendChild(card);
      });
    } else {
      artistsGrid.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No popular artists found.</p>`;
    }
  } catch (error) {
    console.error("Failed to load artists for home page:", error);
    showToast(
      error.message ||
        "Failed to load 'Popular artists'. Please try again later.",
      "error"
    );
  }
};

export const hideHomePage = () => {
  addClass(homeSections, "hidden");
};

export const initHomePage = (navigateToApp) => {
  navigateToCallback = navigateToApp;
};
