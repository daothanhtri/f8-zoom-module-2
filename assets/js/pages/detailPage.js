// src/js/pages/detailPage.js
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
  getArtistTopTracks,
  getArtistAlbums,
} from "../api/artists.js";
import { getTrackById, likeTrack, unlikeTrack } from "../api/tracks.js";
import { uploadImage } from "../api/upload.js";
import { getUserData } from "../utils/storage.js";
import playerModule from "../components/player.js"; // Import playerModule để play track

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

/**
 * Updates the text and class of the follow button based on isFollowing state.
 * @param {boolean} isFollowing - True if currently following, false otherwise.
 */
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
  trackItem.dataset.id = track.id; // Store track ID

  const isLiked = track.is_liked || false; // Assume API provides 'is_liked' status

  trackItem.innerHTML = `
        <div class="track-number">${isDetailedTrack ? "" : index + 1}</div>
        <div class="track-image">
            <img src="${
              track.image_url ||
              track.album_cover_image_url ||
              "placeholder.svg?height=40&width=40"
            }" alt="${track.title || "Unknown"}" />
        </div>
        <div class="track-info">
            <div class="track-name">${track.title || "Unknown Track"}</div>
            <div class="track-artist">${
              track.artist_name || "Unknown Artist"
            }</div>
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

  // Handle like/unlike button click
  const likeBtn = trackItem.querySelector(".track-like-btn");
  if (likeBtn) {
    likeBtn.onclick = async (e) => {
      e.stopPropagation(); // Prevent clicking the track item itself
      const isCurrentlyLiked = hasClass(likeBtn.querySelector("i"), "fas");
      try {
        if (isCurrentlyLiked) {
          await unlikeTrack(track.id);
          showToast(`Removed "${track.title}" from Liked Songs.`, "success");
        } else {
          await likeTrack(track.id);
          showToast(`Added "${track.title}" to Liked Songs.`, "success");
        }
        // Update UI of the like button
        const icon = likeBtn.querySelector("i");
        toggleClass(icon, "fas fa-heart", !isCurrentlyLiked);
        toggleClass(icon, "far fa-heart", isCurrentlyLiked);
        likeBtn.dataset.liked = (!isCurrentlyLiked).toString();
        // Update tooltip text (need to re-initialize tooltips after dynamic content update if not using delegation)
        // For now, rely on dataset-tooltip, tooltip re-init can be done on detail page render.
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

  // Handle track item click (to play the song)
  trackItem.addEventListener("click", (e) => {
    // Play song only if not clicking on menu button directly
    if (!e.target.closest(".track-menu-btn")) {
      playerModule.setQueueAndPlay([track], 0); // Directly use playerModule
      showToast(`Playing "${track.title || "Unknown Track"}"`, "info");
    }
  });

  return trackItem;
};

const handleFollowToggle = async () => {
  if (!currentDetailData) return;

  const { id, type, name } = currentDetailData;
  const isFollowing = hasClass(detailFollowBtn, "active"); // Check current state of the button

  try {
    if (type === "playlist") {
      if (isFollowing) {
        await unfollowPlaylist(id);
        showToast(`Unfollowed playlist "${name}"!`, "success");
        updateFollowButton(false);
      } else {
        await followPlaylist(id);
        showToast(`Followed playlist "${name}"!`, "success");
        updateFollowButton(true);
      }
    } else if (type === "artist") {
      if (isFollowing) {
        await unfollowArtist(id);
        showToast(`Unfollowed artist "${name}"!`, "success");
        updateFollowButton(false);
      } else {
        await followArtist(id);
        showToast(`Followed artist "${name}"!`, "success");
        updateFollowButton(true);
      }
    }
  } catch (error) {
    console.error(`Failed to toggle follow for ${type}:`, error);
    showToast(
      error.message ||
        `Failed to ${isFollowing ? "unfollow" : "follow"} ${type}.`,
      "error"
    );
  }
};

const handleImageUpload = async (file) => {
  // Only allow for playlists and if it's the owner
  if (
    !currentDetailData ||
    currentDetailData.type !== "playlist" ||
    !getUserData() ||
    currentDetailData.owner?.id !== getUserData().id
  )
    return;

  try {
    showToast("Uploading image...", "info", 2000);
    const uploadResponse = await uploadImage(file);
    if (uploadResponse && uploadResponse.path) {
      const newCoverUrl = uploadResponse.path;
      await updatePlaylist(currentDetailData.id, { cover_url: newCoverUrl });
      detailImage.src = newCoverUrl; // Update UI immediately
      currentDetailData.cover_url = newCoverUrl; // Update local data
      showToast("Playlist image updated!", "success");
      // You might need to trigger sidebar update here if playlist covers are shown there
      document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists")); // Custom event to refresh sidebar
    } else {
      showToast("Image upload failed: Invalid response.", "error");
    }
  } catch (error) {
    console.error("Image upload or playlist update failed:", error);
    showToast(error.message || "Failed to update playlist image.", "error");
  }
};


const handleNameOrDescriptionEdit = async (element, field) => {
  // Only allow for playlists and if it's the owner
  if (
    !currentDetailData ||
    currentDetailData.type !== "playlist" ||
    !getUserData() ||
    currentDetailData.owner?.id !== getUserData().id
  )
    return;

  const originalText = element.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  addClass(input, "form-input");

  element.replaceWith(input); // Replace element with input field
  input.focus();

  const saveChanges = async () => {
    const newText = input.value.trim();
    if (newText === originalText || !newText) {
      input.replaceWith(element); // Revert if no change or empty
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
      element.textContent = newText; // Update UI
      if (field === "name") {
        currentDetailData.name = newText; // Update local data
        document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists")); // Custom event to refresh sidebar if name changed
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
      element.textContent = originalText; // Revert on error
    } finally {
      input.replaceWith(element); // Replace input back with element
    }
  };

  input.addEventListener("blur", saveChanges);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      input.blur(); // Trigger blur to save changes
    }
    if (e.key === "Escape") {
      input.value = originalText; // Revert to original
      input.blur();
    }
  });
};


function setupEventListeners() {
  // Hook up the follow button click
  if (detailFollowBtn) {
    detailFollowBtn.addEventListener("click", handleFollowToggle);
  }

  // Event delegation for editable elements (image, name, subtitle)
  detailPageSections.addEventListener("click", (e) => {
    // Only allow editing for owned playlists
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
    }
    // Add case for detailSubtitle if you want to edit description.
    // This requires a clear distinction for description field in HTML/data.
    else if (
      e.target === detailSubtitle &&
      e.target.dataset.editable === "true"
    ) {
      handleNameOrDescriptionEdit(detailSubtitle, "description");
    }
  });
}

// --- CÁC HÀM XUẤT KHẨU (EXPORTED FUNCTIONS) ---

export const renderDetailPage = async (type, id) => {
  addClass(detailPageSections, "hidden"); // Hide before rendering to prevent flicker
  detailTrackList.innerHTML = ""; // Clear previous tracks/songs
  detailVerifiedBadge.classList.add("hidden"); // Hide verified badge by default
  detailFollowBtn.classList.add("hidden"); // Hide follow button by default

  // Reset image/name editing
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

    // CỰC KỲ QUAN TRỌNG: Kiểm tra data sau khi lấy từ response
    data = response?.data; // Use optional chaining to ensure 'data' is null if 'response.data' doesn't exist

    if (!data) {
      // If 'data' is null/undefined, show error and stop
      showToast(
        `Item with ID ${id} not found or API returned no data.`,
        "error"
      );
      addClass(detailPageSections, "hidden"); // Keep detail page hidden
      return;
    }

    // Now, 'data' is confirmed to exist, so we can safely access its properties.

    // Common UI updates for all types
    // Set hero image and name based on type
    if (type === "track") {
      detailImage.src =
        data.image_url || data.album_cover_image_url || "placeholder.svg";
      detailName.textContent = data.title || "Unknown Track";
    } else {
      detailImage.src = data.cover_url || data.avatar_url || "placeholder.svg";
      detailName.textContent = data.name || data.title || "Unknown Title";
    }

    // Set hero background color, with safe fallback
    detailHero.style.background = `linear-gradient(to bottom, ${
      data.color || "#535353"
    } 0%, var(--bg-secondary) 250px)`;

    // Type-specific logic
    if (type === "playlist") {
      detailTracksTitle.textContent = `Songs`;
      detailSubtitle.textContent = `Playlist • ${
        data.owner?.name || "Unknown"
      } • ${data.total_tracks || 0} songs`;

      removeClass(detailFollowBtn, "hidden"); // Show follow button
      isFollowing = data.is_followed || false;
      isOwner = currentUser && data.owner?.id === currentUser.id;

      if (data.tracks && data.tracks.length > 0) {
        data.tracks.forEach((track, index) => {
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
      removeClass(detailVerifiedBadge, "hidden"); // Show verified badge

      removeClass(detailFollowBtn, "hidden"); // Show follow button
      isFollowing = data.is_followed || false;
      isOwner = false; // Artists are not owned by users

      const topTracksResponse = await getArtistTopTracks(id);
      const topTracks = Array.isArray(topTracksResponse?.data)
        ? topTracksResponse.data
        : [];

      if (topTracks.length > 0) {
        topTracks.forEach((track, index) => {
          detailTrackList.appendChild(createTrackItem(track, index));
        });
      } else {
        detailTrackList.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No popular songs found for this artist.</p>`;
      }
    } else if (type === "track") {
      // detailName and detailImage are already set above in common section
      detailSubtitle.textContent = `${data.artist_name || "Unknown Artist"} • ${
        data.album_title || "Unknown Album"
      } • ${formatDuration(data.duration || 0)}`;

      addClass(detailFollowBtn, "hidden"); // Tracks are liked/unliked, not followed
      removeClass(detailTracksSection, "hidden"); // Ensure tracks section is visible
      detailTracksTitle.textContent = "Track Details"; // Or "You might like"

      detailTrackList.appendChild(createTrackItem(data, 0, true)); // Pass true for isDetailedTrack
    } else {
      // This 'else' should ideally not be reached due to earlier check, but good for safety
      showToast("Unknown detail page type detected.", "error");
      return;
    }

    // Update Follow/Unfollow button text/state (only for playlist/artist)
    if (type === "playlist" || type === "artist") {
      updateFollowButton(isFollowing);
    }

    removeClass(detailPageSections, "hidden"); // Show the detail page
  } catch (error) {
    console.error(`Failed to load ${type} details for ID ${id}:`, error);
    showToast(error.message || `Failed to load ${type} details.`, "error");
    addClass(detailPageSections, "hidden"); // Keep hidden on error
  }
};

/**
 * Hides the detail page.
 */
export const hideDetailPage = () => {
  addClass(detailPageSections, "hidden");
  currentDetailData = null; // Clear current detail data
};

/**
 * Initializes the detail page functionality.
 * This should be called once when the app starts.
 */
export const initDetailPage = () => {
  setupEventListeners(); // Sẽ gọi hàm đã định nghĩa ở trên
};
