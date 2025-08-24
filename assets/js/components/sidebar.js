import {
  getElement,
  getElements,
  addClass,
  removeClass,
  hasClass,
  toggleClass,
} from "../utils/dom.js";
import { initContextMenu, showContextMenu } from "../utils/contextMenu.js";
import { showToast } from "../utils/toast.js";
import {
  getMyPlaylists,
  deletePlaylist,
  unfollowPlaylist,
  createPlaylist,
} from "../api/playlists.js";
import { getMyArtists, unfollowArtist } from "../api/artists.js";
import { getAccessToken, getUserData } from "../utils/storage.js";

const libraryTabs = getElement("#libraryTabs");
const libraryContent = getElement("#libraryContent");
const sortBtn = getElement("#sortBtn");
const sortDropdown = getElement("#sortDropdown");
const createPlaylistBtn = getElement("#createPlaylistBtn");

let navigateToCallback = null;
let currentActiveTab = "playlists";
let currentViewMode = "list";
let currentSortBy = "recents";

const updateSortUI = () => {
  getElements("[data-sort-by]", sortDropdown).forEach((li) => {
    const isActive = li.dataset.sortBy === currentSortBy;
    toggleClass(li, "active", isActive);
  });

  getElements("[data-view]", sortDropdown).forEach((btn) => {
    const isActive = btn.dataset.view === currentViewMode;
    toggleClass(btn, "active", isActive);
  });
};

export const renderLibraryItems = async () => {
  libraryContent.innerHTML = "";
  const accessToken = getAccessToken();

  if (!accessToken) {
    libraryContent.innerHTML = `
      <p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">
          Log in to view your library.
      </p>
    `;
    return;
  }

  let items = [];
  try {
    let response;
    if (currentActiveTab === "playlists") {
      response = await getMyPlaylists();
      items = Array.isArray(response?.data) ? response.data : [];
      items.forEach((i) => (i.type = "playlist"));
    } else if (currentActiveTab === "artists") {
      response = await getMyArtists();
      items = Array.isArray(response?.data) ? response.data : [];
      items.forEach((i) => (i.type = "artist"));
    }
  } catch (error) {
    console.error(`Failed to load ${currentActiveTab}:`, error);
    showToast(error.message || `Failed to load ${currentActiveTab}.`, "error");
    return;
  }

  if (items.length === 0) {
    libraryContent.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No ${currentActiveTab} found.</p>`;
    return;
  }

  items.sort((a, b) => {
    if (currentSortBy === "alphabetical") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (currentSortBy === "creator") {
      if (a.type === "playlist" && b.type === "playlist") {
        return (a.owner?.display_name || "").localeCompare(
          b.owner?.display_name || ""
        );
      }
    }

    return 0;
  });

  items.forEach((item) => {
    console.log(item);

    const isPlaylist = item.type === "playlist";
    const itemElement = document.createElement("div");
    addClass(itemElement, "library-item");
    itemElement.dataset.id = item.id;
    itemElement.dataset.type = item.type;

    let itemTitle = item.name || "Unknown";
    let itemSubtitle = isPlaylist
      ? `Playlist • ${item.user_display_name || "User"}`
      : "Artist";

    const imageUrl = item.cover_image_url || item.image_url;
    const imageOrIcon = imageUrl
      ? `<img src="${imageUrl}" alt="${itemTitle}" class="item-image" />`
      : `<div class="item-icon liked-songs"><i class="fas fa-music"></i></div>`;

    itemElement.innerHTML = `
      ${imageOrIcon}
      <div class="item-info">
        <div class="item-title">${itemTitle}</div>
        <div class="item-subtitle">${itemSubtitle}</div>
      </div>
    `;

    if (!isPlaylist) {
      itemElement
        .querySelector(".item-image")
        ?.style.setProperty("border-radius", "var(--radius-full)");
    }

    itemElement.addEventListener("click", () => {
      if (navigateToCallback) navigateToCallback("detail", item.id, item.type);
    });

    itemElement.addEventListener("contextmenu", (e) => {
      const isOwner = item.user_id;
      showContextMenu(e, {
        id: item.id,
        type: item.type,
        isOwner,
        name: itemTitle,
      });
    });

    libraryContent.appendChild(itemElement);
  });

  removeClass(libraryContent, "grid-view compact-view");

  if (currentViewMode === "grid") {
    addClass(libraryContent, "grid-view");
  } else if (currentViewMode === "compact") {
    addClass(libraryContent, "compact-view");
  }
};

const handleContextMenuAction = async (action, itemData) => {
  const { id, type, isOwner, name } = itemData;
  console.log(itemData);

  try {
    let shouldRender = true;
    switch (action) {
      case "unfollow":
        if (type === "playlist") await unfollowPlaylist(id);
        else if (type === "artist") await unfollowArtist(id);
        showToast(`Removed "${name}" from your library.`, "success");
        break;

      case "delete":
        if (type === "playlist" && isOwner) {
          if (confirm(`Are you sure you want to delete "${name}"?`)) {
            await deletePlaylist(id);
            showToast(`Playlist "${name}" deleted.`, "success");
            if (navigateToCallback) navigateToCallback("home");
          } else {
            shouldRender = false;
          }
        } else {
          showToast("You don't have permission to delete this.", "error");
          shouldRender = false;
        }
        break;

      default:
        shouldRender = false;
        break;
    }

    if (shouldRender) {
      await renderLibraryItems();
    }
  } catch (error) {
    showToast(error.message || `Action failed.`, "error");
  }
};

const setupEventListeners = () => {
  createPlaylistBtn.addEventListener("click", async () => {
    if (!getAccessToken()) {
      showToast("Please log in to create a playlist.", "info");
      document.dispatchEvent(
        new CustomEvent("openAuthModal", { detail: "login" })
      );
      return;
    }

    try {
      const newPlaylist = await createPlaylist("My Playlist", "", true);

      if (newPlaylist) {
        showToast("New playlist created!", "success");

        await renderLibraryItems();

        if (navigateToCallback) {
          navigateToCallback(
            "editPlaylist",
            newPlaylist.playlist.id,
            newPlaylist.type
          );
        }
      }
    } catch (error) {
      showToast(error.message || "Could not create playlist.", "error");
    }
  });

  libraryTabs.addEventListener("click", (e) => {
    const target = e.target.closest(".nav-tab");
    if (target && !hasClass(target, "active")) {
      getElements(".nav-tab", libraryTabs).forEach((tab) =>
        removeClass(tab, "active")
      );
      addClass(target, "active");
      currentActiveTab = target.dataset.tab;
      renderLibraryItems();
    }
  });

  sortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleClass(sortDropdown, "show");
  });

  sortDropdown.addEventListener("click", (e) => {
    const sortTarget = e.target.closest("[data-sort-by]");
    const viewTarget = e.target.closest("[data-view]");

    if (sortTarget) {
      currentSortBy = sortTarget.dataset.sortBy;
      const sortText = sortTarget.querySelector("span").textContent;
      sortBtn.innerHTML = `${sortText} <i class="fas fa-list"></i>`;
      renderLibraryItems();
    }

    if (viewTarget) {
      currentViewMode = viewTarget.dataset.view;
      renderLibraryItems();
    }

    updateSortUI();
    removeClass(sortDropdown, "show");
  });

  initContextMenu(handleContextMenuAction);

  document.addEventListener("authStatusChange", renderLibraryItems);
  document.addEventListener("sidebar:refreshPlaylists", () => {
    if (currentActiveTab === "playlists") renderLibraryItems();
  });
  document.addEventListener("click", () => {
    removeClass(sortDropdown, "show");
  });
};

export const initSidebar = (navigateToApp) => {
  navigateToCallback = navigateToApp;
  setupEventListeners();
  renderLibraryItems();
  updateSortUI();
};
