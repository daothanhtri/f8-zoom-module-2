import { getElement, toggleClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { getMyPlaylists, addTrackToPlaylist } from "../api/playlists.js";
import { getAccessToken } from "../utils/storage.js";

const popup = getElement("#addToPlaylistPopup");
const listElement = getElement("#popupPlaylistList");
const searchInput = getElement("#playlistSearchInputPopup");

let currentTrack = null;
let playlists = [];

const renderPlaylists = (filter = "") => {
  listElement.innerHTML =
    '<p style="padding: 1rem; text-align: center;">Loading...</p>';
  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredPlaylists.length === 0) {
    listElement.innerHTML =
      '<p style="padding: 1rem; text-align: center;">No playlists found.</p>';
    return;
  }

  listElement.innerHTML = "";
  filteredPlaylists.forEach((playlist) => {
    const li = document.createElement("li");
    li.dataset.playlistId = playlist.id;
    li.innerHTML = `
            <div class="item-icon"><i class="fas fa-music"></i></div>
            <span>${playlist.name}</span>
        `;
    li.addEventListener("click", async () => {
      try {
        await addTrackToPlaylist(playlist.id, currentTrack.id);
        showToast(`Added to ${playlist.name}`, "success");
        closePopup();
      } catch (error) {
        showToast(error.message || "Failed to add track.", "error");
      }
    });
    listElement.appendChild(li);
  });
};

const openPopup = async (track) => {
  if (!getAccessToken()) {
    showToast("Please log in to add songs to a playlist.", "info");
    return;
  }
  if (!track) {
    showToast("No song is currently playing.", "info");
    return;
  }
  currentTrack = track;
  toggleClass(popup, "show", true);

  try {
    const response = await getMyPlaylists();
    playlists = response.data || [];
    renderPlaylists();
  } catch (error) {
    listElement.innerHTML =
      '<p style="padding: 1rem; text-align: center;">Could not load playlists.</p>';
  }
};

const closePopup = () => {
  toggleClass(popup, "show", false);
  searchInput.value = "";
};

const initAddToPlaylistPopup = () => {
  document.addEventListener("click", (e) => {
    const addBtn = document.querySelector(".player-left .add-btn");
    if (!popup.contains(e.target) && !addBtn.contains(e.target)) {
      closePopup();
    }
  });

  searchInput.addEventListener("input", () => {
    renderPlaylists(searchInput.value);
  });
};

export { initAddToPlaylistPopup, openPopup as openAddToPlaylistPopup };
