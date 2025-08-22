import {
  getElement,
  addClass,
  removeClass,
  hasClass,
  toggleClass,
} from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import {
  getPlaylistById,
  followPlaylist,
  unfollowPlaylist,
} from "../api/playlists.js";

import {
  getArtistById,
  followArtist,
  unfollowArtist,
  getArtistPopularTracks,
} from "../api/artists.js";
import { getTrackById, likeTrack, unlikeTrack } from "../api/tracks.js";
import { getUserData } from "../utils/storage.js";
import playerModule from "../components/player.js";
import { openEditPlaylistModal } from "../components/editPlaylistModal.js";

const detailPageSections = getElement("#detailPageSections");
const detailHero = getElement("#detailHero");
const detailImage = getElement("#detailImage");
const detailVerifiedBadge = getElement("#detailVerifiedBadge");
const detailName = getElement("#detailName");
const detailSubtitle = getElement("#detailSubtitle");
const detailFollowBtn = getElement("#detailFollowBtn");
const detailTracksSection = getElement("#detailTracksSection");
const detailTracksTitle = getElement("#detailTracksTitle");
const detailTrackList = getElement("#detailTrackList");

let currentDetailData = null;

const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds === Infinity || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds =
    remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
};


const updateFollowButton = (isFollowing) => {
  if (isFollowing) {
    detailFollowBtn.textContent = "Following";
    addClass(detailFollowBtn, "active");
  } else {
    detailFollowBtn.textContent = "Follow";
    removeClass(detailFollowBtn, "active");
  }
};


const createTrackItem = (track, index, isDetailedTrack = false) => {
  const trackItem = document.createElement("div");
  addClass(trackItem, "track-item");
  trackItem.dataset.id = track.id;
  const isLiked = track.is_liked || false;

  trackItem.innerHTML = `
        <div class="track-number">${isDetailedTrack ? "" : index + 1}</div>
        <div class="track-image">
            <img src="${
              track.image_url ||
              track.album?.cover_image_url ||
              "placeholder.svg?height=40&width=40"
            }" alt="${track.title || "Unknown"}" />
        </div>
        <div class="track-info">
            <div class="track-name">${track.title || "Unknown Track"}</div>
        </div>
        <div class="track-plays">${
          track.play_count?.toLocaleString() || ""
        }</div>
        <div class="track-duration">${formatDuration(track.duration)}</div>
        <button class="track-like-btn" data-liked="${isLiked}" data-tooltip="${
    isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"
  }">
            <i class="${isLiked ? "fas fa-heart" : "far fa-heart"}"></i>
        </button>
        <button class="track-menu-btn" data-tooltip="More options">
            <i class="fas fa-ellipsis-h"></i>
        </button>
    `;

  const likeBtn = trackItem.querySelector(".track-like-btn");
  likeBtn.onclick = async (e) => {
    e.stopPropagation();
    const isCurrentlyLiked = hasClass(likeBtn.querySelector("i"), "fas");
    try {
      if (isCurrentlyLiked) {
        await unlikeTrack(track.id);
        showToast(`Removed "${track.title}" from Liked Songs.`, "success");
      } else {
        await likeTrack(track.id);
        showToast(`Added "${track.title}" to Liked Songs.`, "success");
      }
      const icon = likeBtn.querySelector("i");
      toggleClass(icon, "fas fa-heart", !isCurrentlyLiked);
      toggleClass(icon, "far fa-heart", isCurrentlyLiked);
    } catch (error) {
      showToast(
        error.message ||
          `Failed to ${isCurrentlyLiked ? "unlike" : "like"} song.`,
        "error"
      );
    }
  };

  trackItem.addEventListener("click", (e) => {
    if (!e.target.closest(".track-menu-btn")) {
      playerModule.setQueueAndPlay([track], 0);
      showToast(`Playing "${track.title || "Unknown Track"}"`, "info");
    }
  });

  return trackItem;
};


const updateDetailPageUI = (updatedPlaylistData) => {
  currentDetailData = { ...currentDetailData, ...updatedPlaylistData };

  detailName.textContent = currentDetailData.name;
  detailSubtitle.textContent = `Playlist • ${
    currentDetailData.owner?.display_name || "Unknown User"
  } • ${currentDetailData.total_tracks || 0} songs`;

  if (currentDetailData.cover_image_url) {
    detailImage.src = currentDetailData.cover_image_url;
  }

  document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists"));
};

const handleFollowToggle = async () => {
  if (!currentDetailData) return;

  const { id, type, name } = currentDetailData;
  const isCurrentlyFollowing = hasClass(detailFollowBtn, "active");

  try {
    let actionPromise;
    if (type === "playlist") {
      actionPromise = isCurrentlyFollowing
        ? unfollowPlaylist(id)
        : followPlaylist(id);
    } else if (type === "artist") {
      actionPromise = isCurrentlyFollowing
        ? unfollowArtist(id)
        : followArtist(id);
    } else {
      return;
    }

    await actionPromise;
    const actionText = isCurrentlyFollowing ? "Unfollowed" : "Followed";
    showToast(`${actionText} ${type} "${name}"!`, "success");
    updateFollowButton(!isCurrentlyFollowing);
  } catch (error) {
    showToast(
      error.message ||
        `Failed to ${isCurrentlyFollowing ? "unfollow" : "follow"} ${type}.`,
      "error"
    );
  }
};


function setupEventListeners() {
  if (detailFollowBtn) {
    detailFollowBtn.addEventListener("click", handleFollowToggle);
  }

 
  detailPageSections.addEventListener("click", (e) => {
    if (e.target === detailImage || e.target === detailName) {
      const isOwner =
        currentDetailData &&
        currentDetailData.type === "playlist" &&
        getUserData() &&
        currentDetailData.owner?.id === getUserData().id;

      if (isOwner) {
        openEditPlaylistModal(currentDetailData, (updatedData) => {
          updateDetailPageUI(updatedData);
        });
      }
    }
  });
}

export const renderDetailPage = async (type, id) => {
  addClass(detailPageSections, "hidden");
  detailTrackList.innerHTML = "";

  // Reset UI
  detailVerifiedBadge.classList.add("hidden");
  detailFollowBtn.classList.add("hidden");
  detailImage.style.cursor = "";
  detailName.style.cursor = "";

  const currentUser = getUserData();

  try {
    let response;
    if (type === "playlist") {
      response = await getPlaylistById(id);
    } else if (type === "artist") {
      response = await getArtistById(id);
    } else if (type === "track") {
      response = await getTrackById(id);
    } else {
      showToast("Invalid detail page type.", "error");
      return;
    }

    const data = response?.data;
    if (!data) {
      showToast(`Item with ID ${id} not found.`, "error");
      return;
    }

    currentDetailData = data;

    detailImage.src =
      data.image_url || data.cover_image_url || "placeholder.svg";
    detailName.textContent = data.name || data.title || "Unknown Title";
    detailHero.style.background = `linear-gradient(to bottom, #535353 0%, var(--bg-secondary) 250px)`;

    if (type === "playlist") {
      detailTracksTitle.textContent = `Songs`;
      detailSubtitle.textContent = `Playlist • ${
        data.owner?.display_name || "Unknown User"
      } • ${data.total_tracks || 0} songs`;

      const isOwner = currentUser && data.owner?.id === currentUser.id;
      if (isOwner) {
        addClass(detailFollowBtn, "hidden");
        detailImage.style.cursor = "pointer";
        detailName.style.cursor = "pointer";
      } else {
        removeClass(detailFollowBtn, "hidden");
        updateFollowButton(data.is_followed || false);
      }

      const tracksResponse = await import("../api/playlists.js").then((m) =>
        m.getPlaylistTracks(id)
      );
      const tracks = Array.isArray(tracksResponse?.data)
        ? tracksResponse.data
        : [];
      if (tracks.length > 0) {
        tracks.forEach((track, index) =>
          detailTrackList.appendChild(createTrackItem(track, index))
        );
      } else {
        detailTrackList.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No songs in this playlist.</p>`;
      }
    } else if (type === "artist") {
      detailTracksTitle.textContent = "Popular Songs";
      detailSubtitle.textContent = `${
        data.monthly_listeners?.toLocaleString() || 0
      } monthly listeners`;
      removeClass(detailVerifiedBadge, "hidden");
      removeClass(detailFollowBtn, "hidden");
      updateFollowButton(data.is_followed || false);

      const tracksResponse = await getArtistPopularTracks(id);
      const tracks = Array.isArray(tracksResponse?.data)
        ? tracksResponse.data
        : [];
      if (tracks.length > 0) {
        tracks.forEach((track, index) =>
          detailTrackList.appendChild(createTrackItem(track, index))
        );
      } else {
        detailTrackList.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No popular songs found for this artist.</p>`;
      }
    } else if (type === "track") {
      detailSubtitle.textContent = `${data.artist_name || "Unknown Artist"} • ${
        data.album_title || "Unknown Album"
      } • ${formatDuration(data.duration || 0)}`;
      addClass(detailFollowBtn, "hidden");
      removeClass(detailTracksSection, "hidden");
      detailTracksTitle.textContent = "Track Details";
      detailTrackList.appendChild(createTrackItem(data, 0, true));
    }

    removeClass(detailPageSections, "hidden");
  } catch (error) {
    console.error(`Failed to load ${type} details for ID ${id}:`, error);
    showToast(error.message || `Failed to load ${type} details.`, "error");
    addClass(detailPageSections, "hidden");
  }
};

export const hideDetailPage = () => {
  addClass(detailPageSections, "hidden");
  currentDetailData = null;
};

export const initDetailPage = () => {
  setupEventListeners();
};
