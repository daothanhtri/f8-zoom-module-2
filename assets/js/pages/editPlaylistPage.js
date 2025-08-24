import { getElement, addClass, removeClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { getMyPlaylists, getPlaylistById } from "../api/playlists.js";
import { getUserData } from "../utils/storage.js";
import { openEditPlaylistModal } from "../components/editPlaylistModal.js";

const editPageSection = getElement("#editPlaylistPageSection");
const imageDisplay = getElement("#editPlaylistImageDisplay");
const imagePreview = getElement("#editPlaylistImagePreview");
const nameDisplay = getElement("#editPlaylistNameInput");
const ownerDisplay = getElement("#editPlaylistOwner");

let currentPlaylistId = null;

const updatePageUI = (playlistData) => {
  nameDisplay.textContent = playlistData.name;
  ownerDisplay.textContent =
    playlistData.owner?.display_name || getUserData()?.display_name;

  if (playlistData.cover_image_url) {
    imagePreview.src = playlistData.cover_image_url;
    removeClass(imagePreview, "hidden");
  } else {
    imagePreview.src = "";
    addClass(imagePreview, "hidden");
  }

  document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists"));
};

function setupEventListeners() {
  editPageSection.addEventListener("click", async (e) => {
    if (
      e.target === imageDisplay ||
      e.target === nameDisplay ||
      imageDisplay.contains(e.target)
    ) {
      if (!currentPlaylistId) return;

      try {
        const response = await getPlaylistById(currentPlaylistId);
        const freshPlaylistData = response.data;

        if (freshPlaylistData) {
          openEditPlaylistModal(freshPlaylistData, (updatedData) => {
            updatePageUI(updatedData);
          });
        }
      } catch (error) {
        showToast("Could not load playlist details.", "error");
      }
    }
  });
}

export const renderEditPlaylistPage = async (id) => {
  addClass(editPageSection, "hidden");

  currentPlaylistId = id;

  try {
    const response = await getPlaylistById(id);
    const playlistData = response.data;

    if (!playlistData) throw new Error("Playlist not found.");

    const currentUser = getUserData();
    if (
      !currentUser ||
      String(currentUser.id) !== String(playlistData.owner?.id)
    ) {
      throw new Error("You don't have permission to edit this playlist.");
    }

    updatePageUI(playlistData);
    removeClass(editPageSection, "hidden");
  } catch (error) {
    showToast(error.message || "Failed to load playlist.", "error");
  }
};

export const hideEditPlaylistPage = () => {
  addClass(editPageSection, "hidden");
  currentPlaylistId = null;
};

export const initEditPlaylistPage = () => {
  setupEventListeners();
};
