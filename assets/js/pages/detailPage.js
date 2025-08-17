import {
  getElement,
  getElements,
  addClass,
  removeClass,
  hasClass,
  toggleClass,
} from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import {
  getPlaylistById,
  updatePlaylist,
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
import { uploadImage, uploadPlaylistCover } from "../api/upload.js";
import { getUserData } from "../utils/storage.js";
import playerModule from "../components/player.js";

// --- CÁC BIẾN DOM ---
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
  if (likeBtn) {
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
        likeBtn.dataset.liked = (!isCurrentlyLiked).toString();
      } catch (error) {
        console.error(`Failed to toggle like for track ${track.id}:`, error);
        showToast(
          error.message ||
            `Failed to ${isCurrentlyLiked ? "unlike" : "like"} song.`,
          "error"
        );
      }
    };
  }

  trackItem.addEventListener("click", (e) => {
    if (!e.target.closest(".track-menu-btn")) {
      playerModule.setQueueAndPlay([track], 0);
      showToast(`Playing "${track.title || "Unknown Track"}"`, "info");
    }
  });

  return trackItem;
};

const handleFollowToggle = async () => {
  if (!currentDetailData) return;

  const { id, type, name } = currentDetailData;
  const isCurrentlyFollowing = hasClass(detailFollowBtn, "active");

  try {
    if (type === "playlist") {
      if (isCurrentlyFollowing) {
        await unfollowPlaylist(id);
        showToast(`Unfollowed playlist "${name}"!`, "success");
        updateFollowButton(false);
      } else {
        await followPlaylist(id); // Follow Playlist API
        showToast(`Followed playlist "${name}"!`, "success");
        updateFollowButton(true);
      }
    } else if (type === "artist") {
      if (isCurrentlyFollowing) {
        await unfollowArtist(id);
        showToast(`Unfollowed artist "${name}"!`, "success");
        updateFollowButton(false);
      } else {
        await followArtist(id); // Follow Artist API
        showToast(`Followed artist "${name}"!`, "success");
        updateFollowButton(true);
      }
    }
  } catch (error) {
    console.error(`Failed to toggle follow for ${type}:`, error);
    showToast(
      error.message ||
        `Failed to ${isCurrentlyFollowing ? "unfollow" : "follow"} ${type}.`,
      "error"
    );
  }
};

const handleImageUpload = async (file) => {
  if (
    !currentDetailData ||
    currentDetailData.type !== "playlist" ||
    !getUserData() ||
    currentDetailData.owner?.id !== getUserData().id
  ) {
    showToast("You don't have permission to edit this playlist.", "error");
    return;
  }

  try {
    showToast("Uploading image...", "info", 2000);

    const formData = new FormData();
    formData.append("cover", file);

    const uploadResponse = await uploadPlaylistCover(
      currentDetailData.id,
      file
    );

    if (uploadResponse && uploadResponse.path) {
      await updatePlaylist(currentDetailData.id, {
        cover_image_url: uploadResponse.path,
      });
      detailImage.src = uploadResponse.path;
      currentDetailData.cover_image_url = uploadResponse.path;
      showToast("Playlist image updated!", "success");

      document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists"));
    } else {
      showToast("Image upload failed: Invalid response from server.", "error");
    }
  } catch (error) {
    console.error("Image upload or playlist update failed:", error);
    showToast(error.message || "Failed to update playlist image.", "error");
  }
};

const handleNameOrDescriptionEdit = async (element, field) => {
  if (
    !currentDetailData ||
    currentDetailData.type !== "playlist" ||
    !getUserData() ||
    currentDetailData.owner?.id !== getUserData().id
  ) {
    showToast("You don't have permission to edit this playlist.", "error");
    return;
  }

  const originalText = element.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  addClass(input, "form-input");

  element.replaceWith(input);
  input.focus();

  const saveChanges = async () => {
    const newText = input.value.trim();
    if (newText === originalText || !newText) {
      input.replaceWith(element);
      element.textContent = originalText;
      return;
    }

    try {
      const updateData = {};
      if (field === "name") {
        updateData.name = newText;
      } else if (field === "description") {
        updateData.description = newText;
      }

      await updatePlaylist(currentDetailData.id, updateData);
      element.textContent = newText;

      if (field === "name") {
        currentDetailData.name = newText;
        document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists"));
      } else if (field === "description") {
        currentDetailData.description = newText;
      }
      showToast(`Playlist ${field} updated!`, "success");
    } catch (error) {
      console.error(`Failed to update playlist ${field}:`, error);
      showToast(
        error.message || `Failed to update playlist ${field}.`,
        "error"
      );
      element.textContent = originalText;
    } finally {
      input.replaceWith(element);
    }
  };

  input.addEventListener("blur", saveChanges);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      input.blur();
    }
    if (e.key === "Escape") {
      input.value = originalText;
      input.blur();
    }
  });
};

function setupEventListeners() {
  if (detailFollowBtn) {
    detailFollowBtn.addEventListener("click", handleFollowToggle);
  }

  detailPageSections.addEventListener("click", (e) => {
    if (
      !currentDetailData ||
      currentDetailData.type !== "playlist" ||
      !getUserData() ||
      currentDetailData.owner?.id !== getUserData().id
    ) {
      return;
    }

    if (e.target === detailImage && e.target.dataset.editable === "true") {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleImageUpload(e.target.files[0]);
        }
      };
      fileInput.click();
    } else if (
      e.target === detailName &&
      e.target.dataset.editable === "true"
    ) {
      handleNameOrDescriptionEdit(detailName, "name");
    } else if (
      e.target === detailSubtitle &&
      e.target.dataset.editable === "true"
    ) {
      if (currentDetailData.description !== undefined) {
        handleNameOrDescriptionEdit(detailSubtitle, "description");
      }
    }
  });
}

export const renderDetailPage = async (type, id) => {
  addClass(detailPageSections, "hidden");
  detailTrackList.innerHTML = "";
  detailVerifiedBadge.classList.add("hidden");
  detailFollowBtn.classList.add("hidden");

  detailImage.style.cursor = "";
  detailImage.removeAttribute("data-editable");
  detailName.style.cursor = "";
  detailName.removeAttribute("data-editable");
  detailSubtitle.style.cursor = "";
  detailSubtitle.removeAttribute("data-editable");

  let data = null;
  let isFollowing = false;
  let isOwner = false;
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
      showToast(
        "Invalid detail page type. Only 'playlist', 'artist', 'track' are supported.",
        "error"
      );
      return;
    }

    data = response?.data;

    if (!data) {
      showToast(
        `Item with ID ${id} not found or API returned no data.`,
        "error"
      );
      addClass(detailPageSections, "hidden");
      return;
    }

    currentDetailData = data;

    if (type === "track") {
      detailImage.src =
        data.image_url || data.album_cover_image_url || "placeholder.svg";
      detailName.textContent = data.title || "Unknown Track";
    } else {
      detailImage.src =
        data.cover_image_url || data.image_url || "placeholder.svg";
      detailName.textContent = data.name || data.title || "Unknown Title";
    }

    detailHero.style.background = `linear-gradient(to bottom, #535353 0%, var(--bg-secondary) 250px)`;

    if (type === "playlist") {
      detailTracksTitle.textContent = `Songs`;

      detailSubtitle.textContent = `Playlist • ${
        data.owner?.display_name || "Unknown User"
      } • ${data.total_tracks || 0} songs`;

      removeClass(detailFollowBtn, "hidden");

      isFollowing = data.is_followed || false;
      isOwner = currentUser && data.owner?.id === currentUser.id;

      const playlistTracksResponse = await import("../api/playlists.js").then(
        (module) => module.getPlaylistTracks(id)
      );
      const playlistTracks = Array.isArray(playlistTracksResponse?.data)
        ? playlistTracksResponse.data
        : [];

      if (playlistTracks.length > 0) {
        playlistTracks.forEach((track, index) => {
          detailTrackList.appendChild(createTrackItem(track, index));
        });
      } else {
        detailTrackList.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No songs found in this playlist.</p>`;
      }
    } else if (type === "artist") {
      detailTracksTitle.textContent = "Popular Songs";
      detailSubtitle.textContent = `${
        data.monthly_listeners?.toLocaleString() || 0
      } monthly listeners`;
      removeClass(detailVerifiedBadge, "hidden");

      removeClass(detailFollowBtn, "hidden");
      isFollowing = data.is_followed || false;
      isOwner = false;

      const artistTracksResponse = await getArtistPopularTracks(id);
      const artistTracks = Array.isArray(artistTracksResponse?.data)
        ? artistTracksResponse.data
        : [];

      if (artistTracks.length > 0) {
        artistTracks.forEach((track, index) => {
          detailTrackList.appendChild(createTrackItem(track, index));
        });
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
    } else {
      showToast("Unknown detail page type detected.", "error");
      return;
    }

    if (type === "playlist" || type === "artist") {
      updateFollowButton(isFollowing);
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
  setupEventListeners(); //
};
