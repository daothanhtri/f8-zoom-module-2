import { getElement, addClass, removeClass, hasClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { createPlaylist } from "../api/playlists.js";

const createPlaylistModal = getElement("#createPlaylistModal");
const createPlaylistModalClose = getElement("#createPlaylistModalClose");
const createPlaylistForm = getElement("#createPlaylistForm");
const newPlaylistNameInput = getElement("#newPlaylistName");

let onCreateSuccessCallback = null;

export const openCreatePlaylistModal = (onSuccess) => {
  onCreateSuccessCallback = onSuccess;
  newPlaylistNameInput.value = "My Playlist";

  const formGroup = newPlaylistNameInput.closest(".form-group");
  if (formGroup) removeClass(formGroup, "invalid");

  addClass(createPlaylistModal, "show");
  document.body.style.overflow = "hidden";
};

export const closeCreatePlaylistModal = () => {
  removeClass(createPlaylistModal, "show");
  document.body.style.overflow = "auto";
};

const setupEventListeners = () => {
  createPlaylistModalClose.addEventListener("click", closeCreatePlaylistModal);

  createPlaylistModal.addEventListener("click", function (e) {
    if (e.target === createPlaylistModal) {
      closeCreatePlaylistModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && hasClass(createPlaylistModal, "show")) {
      closeCreatePlaylistModal();
    }
  });

  createPlaylistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const playlistName = newPlaylistNameInput.value.trim();

    if (!playlistName) {
      showToast("Playlist name cannot be empty.", "error");

      return;
    }

    try {
      const response = await createPlaylist(playlistName, "", true);

      if (response) {
        closeCreatePlaylistModal();
        showToast("Playlist created successfully!", "success");
        if (onCreateSuccessCallback) {
          onCreateSuccessCallback(response.id, response.type);
        }
      } else {
        showToast(
          "Failed to create playlist: Invalid response from server.",
          "error"
        );
      }
    } catch (error) {
      console.error("Create playlist failed:", error);
      showToast(error.message || "Failed to create playlist.", "error");
    }
  });
};

export const initCreatePlaylistModal = () => {
  setupEventListeners();
};
