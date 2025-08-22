import { getElement, addClass, removeClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { getPlaylistById } from "../api/playlists.js";
import { getUserData } from "../utils/storage.js";
import { openEditPlaylistModal } from "../components/editPlaylistModal.js";

// DOM Elements
const editPageSection = getElement("#editPlaylistPageSection");
const imageDisplay = getElement("#editPlaylistImageDisplay");
const imagePreview = getElement("#editPlaylistImagePreview");
const nameDisplay = getElement("#editPlaylistNameInput");
const ownerDisplay = getElement("#editPlaylistOwner");

let currentPlaylist = null;


const updatePageUI = (playlist) => {
  currentPlaylist = playlist; 

  nameDisplay.textContent = playlist.name;
  ownerDisplay.textContent =
    playlist.owner?.display_name || getUserData()?.display_name;

  if (playlist.cover_image_url) {
    imagePreview.src = playlist.cover_image_url;
    removeClass(imagePreview, "hidden");
  } else {
    addClass(imagePreview, "hidden");
    imagePreview.src = "";
  }

  document.dispatchEvent(new CustomEvent("sidebar:refreshPlaylists"));
};

const setupEventListeners = () => {
  const openModalHandler = () => {
    if (currentPlaylist) {
      openEditPlaylistModal(currentPlaylist, (updatedPlaylist) => {
      
        updatePageUI(updatedPlaylist);
      });
    }
  };

  imageDisplay.addEventListener("click", openModalHandler);
  nameDisplay.addEventListener("click", openModalHandler);
};

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
    if (!currentUser || currentUser.id !== playlistData.owner?.id) {
      showToast("You don't have permission to edit this playlist.", "error");
      return;
    }

    nameDisplay.textContent = playlistData.name;

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
