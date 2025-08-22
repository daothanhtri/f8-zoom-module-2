import { getElement, addClass, removeClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { getPlaylistById } from "../api/playlists.js";
import { getUserData } from "../utils/storage.js";
import { openEditPlaylistModal } from "../components/editPlaylistModal.js";

const editPageSection = getElement("#editPlaylistPageSection");
const imageDisplay = getElement("#editPlaylistImageDisplay");
const imagePreview = getElement("#editPlaylistImagePreview");
const nameDisplay = getElement("#editPlaylistNameInput");
const ownerDisplay = getElement("#editPlaylistOwner");

let currentPlaylist = null;

const updatePageUI = (updatedPlaylistData) => {
  currentPlaylist = { ...currentPlaylist, ...updatedPlaylistData };

  nameDisplay.textContent = currentPlaylist.name;
  ownerDisplay.textContent =
    currentPlaylist.owner?.display_name || getUserData()?.display_name;

  if (currentPlaylist.cover_image_url) {
    imagePreview.src = currentPlaylist.cover_image_url;
    removeClass(imagePreview, "hidden");
  } else {
    imagePreview.src = "";
    addClass(imagePreview, "hidden");
  }

  document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists"));
};

function setupEventListeners() {
  editPageSection.addEventListener("click", (e) => {
    console.log(123);
    if (
      e.target === imageDisplay ||
      e.target === nameDisplay ||
      imageDisplay.contains(e.target)
    ) {
      if (currentPlaylist) {
        openEditPlaylistModal(currentPlaylist, (updatedData) => {
          updatePageUI(updatedData);
        });
      }
    }
  });
}

export const renderEditPlaylistPage = async (id) => {
  addClass(editPageSection, "hidden");
  try {
    const response = await getPlaylistById(id);
    const playlistData = response.data;

    if (!playlistData) {
      showToast("Could not find the playlist.", "error");
      return;
    }

    const currentUser = getUserData();
    if (
      !currentUser ||
      String(currentUser.id) !== String(playlistData.owner?.id)
    ) {
      showToast("You don't have permission to edit this playlist.", "error");
      return;
    }

    updatePageUI(playlistData);
    removeClass(editPageSection, "hidden");
  } catch (error) {
    console.error("Failed to load playlist for editing:", error);
    showToast(error.message || "Failed to load playlist.", "error");
  }
};

export const hideEditPlaylistPage = () => {
  addClass(editPageSection, "hidden");
  currentPlaylist = null;
};

export const initEditPlaylistPage = () => {
  setupEventListeners();
};
