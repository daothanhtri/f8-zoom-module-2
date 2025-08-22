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
} from "../api/playlists.js";
import { getMyArtists, unfollowArtist } from "../api/artists.js";
import { createPlaylist } from "../api/playlists.js";
import {
  getAccessToken,
  removeAccessToken,
  removeUserData,
  getUserData,
} from "../utils/storage.js";

const libraryTabs = getElement("#libraryTabs");
const libraryContent = getElement("#libraryContent");
const sortBtn = getElement("#sortBtn");
const sortDropdown = getElement("#sortDropdown");
const viewToggleBtn = getElement("#viewToggleBtn");
const createPlaylistBtn = getElement("#createPlaylistBtn");

let navigateToCallback = null;
let currentActiveTab = "playlists";
let currentViewMode = "list";
let currentSortBy = "recents";

export const renderLibraryItems = async () => {
  libraryContent.innerHTML = "";
  const accessToken = getAccessToken();

  if (!accessToken) {
    libraryContent.innerHTML = `
      <p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">
          Log in to see your library content.
      </p>
      <button class="auth-btn login-btn" id="sidebarLoginPrompt" style="margin: var(--spacing-md) auto; display: block;">Log In</button>
    `;
    const sidebarLoginPromptBtn = getElement("#sidebarLoginPrompt");
    if (sidebarLoginPromptBtn) {
      sidebarLoginPromptBtn.addEventListener("click", () => {
        document.dispatchEvent(
          new CustomEvent("openAuthModal", { detail: "login" })
        );
      });
    }
    return;
  }

  let items = [];
  try {
    let response;
    if (currentActiveTab === "playlists") {
      response = await getMyPlaylists();
    } else if (currentActiveTab === "artists") {
      response = await getMyArtists();
    }
    items = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    if (error.status === 401) {
      showToast("Your session has expired. Please log in again.", "error");
      removeAccessToken();
      removeUserData();
      document.dispatchEvent(
        new CustomEvent("authStatusChange", { detail: { isLoggedIn: false } })
      );
      renderLibraryItems();
    } else {
      showToast(
        error.message || `Failed to load ${currentActiveTab}.`,
        "error"
      );
    }
    return;
  }

  if (items.length === 0) {
    libraryContent.innerHTML = `<p class="text-secondary" style="padding: var(--spacing-md); text-align: center;">No ${currentActiveTab} found.</p>`;
    return;
  }

  items.sort((a, b) => {
    if (currentSortBy === "alphabetical") {
      return (a.name || a.title || "").localeCompare(b.name || b.title || "");
    }
    return 0;
  });

  items.forEach((item) => {
    const isPlaylist = item.type === "playlist";
    const itemElement = document.createElement("div");
    addClass(itemElement, "library-item");
    itemElement.dataset.id = item.id;
    itemElement.dataset.type = item.type;

    let itemTitle = item.name || item.title || "Unknown";
    let itemSubtitle = isPlaylist
      ? `Playlist • ${item.owner?.display_name || "User"}`
      : "Artist";

    const imageOrIcon =
      item.cover_image_url || item.image_url
        ? `<img src="${
            item.cover_image_url || item.image_url
          }" alt="${itemTitle}" class="item-image" />`
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
      if (navigateToCallback) {
        navigateToCallback("detail", item.id, item.type);
      }
    });

    itemElement.addEventListener("contextmenu", (e) => {
      const currentUser = getUserData();
      const isOwner =
        isPlaylist &&
        currentUser &&
        String(item.owner?.id) === String(currentUser.id);
      const isFollowing = item.is_followed || false;

      showContextMenu(e, {
        id: item.id,
        type: item.type,
        isOwner: isOwner,
        isFollowing: isFollowing,
        name: itemTitle,
      });
    });

    libraryContent.appendChild(itemElement);
  });

  toggleClass(libraryContent, "grid-view", currentViewMode === "grid");
};

const handleContextMenuAction = async (action, itemData) => {
  const { id, type, isOwner, name } = itemData;
  try {
    switch (action) {
      case "unfollow":
      case "remove-from-profile":
        if (type === "playlist") await unfollowPlaylist(id);
        else if (type === "artist") await unfollowArtist(id);
        showToast(`Removed "${name}" from your library.`, "success");
        break;
      case "delete":
        if (type === "playlist" && isOwner) {
          if (
            confirm(`Are you sure you want to delete the playlist "${name}"?`)
          ) {
            await deletePlaylist(id);
            showToast(`Playlist "${name}" deleted!`, "success");
            if (navigateToCallback) navigateToCallback("home");
          }
        } else {
          showToast("You don't have permission to delete this.", "error");
        }
        break;
      default:
        showToast(`Action "${action}" is not yet implemented.`, "info");
        return;
    }
    await renderLibraryItems();
  } catch (error) {
    showToast(error.message || `Failed to ${action} ${type}.`, "error");
  }
};

const setupEventListeners = () => {
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
    const target = e.target.closest("li");
    if (target) {
      currentSortBy = target.dataset.sortBy;
      sortBtn.innerHTML = `${target.textContent} <i class="fas fa-list"></i>`;
      removeClass(sortDropdown, "show");
      renderLibraryItems();
    }
  });

  document.addEventListener("click", () => {
    removeClass(sortDropdown, "show");
  });

  viewToggleBtn.addEventListener("click", () => {
    currentViewMode = currentViewMode === "list" ? "grid" : "list";
    viewToggleBtn.querySelector("i").className =
      currentViewMode === "list" ? "fas fa-grip-horizontal" : "fas fa-list";
    renderLibraryItems();
  });

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
          navigateToCallback("editPlaylist", newPlaylist.id, newPlaylist.type);
        }
      }
    } catch (error) {
      showToast(error.message || "Could not create playlist.", "error");
    }
  });

  initContextMenu(handleContextMenuAction);

  document.addEventListener("authStatusChange", renderLibraryItems);
  document.addEventListener("sidebar:refreshPlaylists", () => {
    if (currentActiveTab === "playlists") renderLibraryItems();
  });
};

export const initSidebar = (navigateToApp) => {
  navigateToCallback = navigateToApp;
  setupEventListeners();
  renderLibraryItems();
};
