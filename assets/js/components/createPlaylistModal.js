// ./js/components/createPlaylistModal.js
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
            const response = await createPlaylist(playlistName);
          
            if (response && response.id) {
                closeCreatePlaylistModal();
                if (onCreateSuccessCallback) {
                    onCreateSuccessCallback(response.id); 
                }
            } else {
                showToast("Failed to create playlist. Invalid response.", "error");
            }
        } catch (error) {
            console.error("Create playlist failed:", error);
            showToast(error.data?.message || "Failed to create playlist.", "error");
        }
    });
};

export const initCreatePlaylistModal = () => {
    setupEventListeners();
};