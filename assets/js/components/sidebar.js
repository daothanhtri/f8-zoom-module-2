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
import { openCreatePlaylistModal } from "./createPlaylistModal.js";
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

  const accessToken = getAccessToken(); // Lấy access token

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

  // Case: User is logged in, fetch data
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
    console.error(`Failed to load ${currentActiveTab}:`, error);
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

  // Apply sorting
  items.sort((a, b) => {
    if (currentSortBy === "alphabetical") {
      const nameA = a.name || a.title || "";
      const nameB = b.name || b.title || "";
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  items.forEach((item) => {
    const isPlaylist = item.type === "playlist";
    const itemElement = document.createElement("div");
    addClass(itemElement, "library-item");
    itemElement.dataset.id = item.id;
    itemElement.dataset.type = item.type;

    let imageUrl;
    let itemTitle = item.name || item.title || "Unknown";
    let itemSubtitle;
    let iconHtml = "";

    if (isPlaylist) {
      imageUrl = item.cover_image_url;
      itemSubtitle = item.owner?.display_name
        ? `Playlist • ${item.owner.display_name}`
        : "Playlist";
      if (!imageUrl && itemTitle === "Liked Songs") {
        iconHtml = `
                    <div class="item-icon liked-songs">
                        <i class="fas fa-heart"></i>
                    </div>
                 `;
      }
    } else {
      // It's an Artist
      imageUrl = item.avatar_url; // Postman dùng avatar_url
      itemSubtitle = "Artist";
    }

    const imageOrIcon = iconHtml
      ? iconHtml
      : `<img src="${
          imageUrl || "placeholder.svg?height=48&width=48"
        }" alt="${itemTitle}" class="item-image" />`;

    itemElement.innerHTML = `
            ${imageOrIcon}
            <div class="item-info">
                <div class="item-title">${itemTitle}</div>
                <div class="item-subtitle">
                    ${
                      isPlaylist && itemTitle !== "Liked Songs"
                        ? `<i class="fas fa-thumbtack"></i> `
                        : ""
                    }
                    ${itemSubtitle}
                </div>
            </div>
        `;

    if (!isPlaylist) {
      const artistImage = itemElement.querySelector(".item-image");
      if (artistImage) {
        artistImage.style.borderRadius = "var(--radius-full)";
      }
    }

    itemElement.addEventListener("click", () => {
      if (navigateToCallback) {
        navigateToCallback("detail", item.id, item.type);
      }
    });

    itemElement.addEventListener("contextmenu", (e) => {
      const currentUser = getUserData();

      const isOwner =
        isPlaylist && currentUser && item.owner?.id === currentUser.id;
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

  if (currentViewMode === "grid") {
    addClass(libraryContent, "grid-view");
  } else {
    removeClass(libraryContent, "grid-view");
  }
};

const handleContextMenuAction = async (action, itemData) => {
  const { id, type, isOwner, name } = itemData;
  try {
    switch (action) {
      case "unfollow":
        if (type === "playlist") {
          await unfollowPlaylist(id);
          showToast(`Unfollowed playlist "${name}"!`, "success");
        } else if (type === "artist") {
          await unfollowArtist(id);
          showToast(`Unfollowed artist "${name}"!`, "success");
        }
        break;
      case "delete":
        if (type === "playlist" && isOwner) {
          await deletePlaylist(id);
          showToast(`Playlist "${name}" deleted!`, "success");
        } else {
          showToast("You don't have permission to delete this.", "error");
        }
        break;
      case "remove-from-profile":
        if (type === "playlist" && !isOwner) {
          await unfollowPlaylist(id);
          showToast(`Playlist "${name}" removed from profile!`, "success");
        } else {
          showToast("Action not applicable or permission denied.", "error");
        }
        break;
      case "play":
      case "add-to-queue":
      case "save-to-your-liked-songs":
      case "remove-from-liked-songs":
        showToast(
          `Action "${action}" for ${type} "${name}" is not yet implemented.`,
          "info"
        );
        break;
      default:
        console.log(
          `Unhandled context menu action: "${action}" for ${type} ${id}.`
        );
    }

    await renderLibraryItems();
  } catch (error) {
    console.error(
      `Failed to perform action "${action}" on ${type} ${id}:`,
      error
    );
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

  document.addEventListener("click", (e) => {
    if (
      sortDropdown &&
      !sortBtn.contains(e.target) &&
      !sortDropdown.contains(e.target)
    ) {
      removeClass(sortDropdown, "show");
    }
  });

  viewToggleBtn.addEventListener("click", () => {
    currentViewMode = currentViewMode === "list" ? "grid" : "list";
    viewToggleBtn.querySelector("i").className =
      currentViewMode === "list" ? "fas fa-grip-horizontal" : "fas fa-list";
    renderLibraryItems();
  });

  createPlaylistBtn.addEventListener("click", () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      showToast("Please log in to create a playlist.", "info");
      document.dispatchEvent(
        new CustomEvent("openAuthModal", { detail: "login" })
      );
      return;
    }

    openCreatePlaylistModal((newId, newType) => {
      renderLibraryItems();
      if (navigateToCallback && newId && newType) {
        navigateToCallback("detail", newId, newType);
      }
    });
  });

  initContextMenu(handleContextMenuAction);

  document.addEventListener("authStatusChange", (e) => {
    renderLibraryItems();
  });

  document.addEventListener("sidebar:refreshPlaylists", () => {
    if (currentActiveTab === "playlists") {
      renderLibraryItems();
    }
  });
};

export const initSidebar = (navigateToApp) => {
  navigateToCallback = navigateToApp;
  setupEventListeners();
  renderLibraryItems();
};
