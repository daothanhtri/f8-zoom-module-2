// src/js/components/sidebar.js
import {
  getElement,
  getElements,
  addClass,
  removeClass,
  hasClass,
  toggleClass,
} from "../utils/dom.js"; // Đã thêm toggleClass
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
} from "../utils/storage.js"; // Đã thêm getUserData

// Elements
const libraryTabs = getElement("#libraryTabs");
const libraryContent = getElement("#libraryContent");
const sortBtn = getElement("#sortBtn");
const sortDropdown = getElement("#sortDropdown");
const viewToggleBtn = getElement("#viewToggleBtn");
const createPlaylistBtn = getElement("#createPlaylistBtn");

// Internal state
let navigateToCallback = null;
let currentActiveTab = "playlists";
let currentViewMode = "list"; // 'list' or 'grid'
let currentSortBy = "recents";

/**
 * Renders the library items (playlists or artists) in the sidebar.
 */
export const renderLibraryItems = async () => {
  libraryContent.innerHTML = ""; // Clear existing items

  const accessToken = getAccessToken(); // Lấy access token

  // Case: User is not logged in
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
        // Dispatch a custom event to notify app.js to open auth modal
        document.dispatchEvent(
          new CustomEvent("openAuthModal", { detail: "login" })
        );
      });
    }
    return; // Stop execution if not logged in
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
      // Unauthorized, session expired
      showToast("Your session has expired. Please log in again.", "error");
      removeAccessToken();
      removeUserData();
      // Dispatch event to header/app to update UI
      document.dispatchEvent(
        new CustomEvent("authStatusChange", { detail: { isLoggedIn: false } })
      );
      // Re-render sidebar to show login prompt
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

  // Apply sorting (basic alphabetical for demonstration)
  items.sort((a, b) => {
    if (currentSortBy === "alphabetical") {
      const nameA = a.name || a.title || "";
      const nameB = b.name || b.title || "";
      return nameA.localeCompare(nameB);
    }
    // 'recents' and 'creator' sorting would require additional data from API response (e.g., timestamps, owner IDs)
    return 0; // Default to no specific sort if 'recents' or 'creator' are not fully implemented
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
    let iconHtml = ""; // For custom icons like Liked Songs

    if (isPlaylist) {
      imageUrl = item.cover_url; // API should provide this
      itemSubtitle = item.owner?.name
        ? `Playlist • ${item.owner.name}`
        : "Playlist";
      if (!imageUrl && itemTitle === "Liked Songs") {
        // Special case for Liked Songs
        iconHtml = `
                    <div class="item-icon liked-songs">
                        <i class="fas fa-heart"></i>
                    </div>
                 `;
      }
    } else {
      // It's an Artist
      imageUrl = item.avatar_url; // API should provide this
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
                    } <!-- Thêm icon thumbtack cho Playlist, trừ Liked Songs -->
                    ${itemSubtitle}
                </div>
            </div>
        `;

    // Apply round border-radius for artist images AFTER innerHTML has been set
    if (!isPlaylist) {
      const artistImage = itemElement.querySelector(".item-image");
      if (artistImage) {
        artistImage.style.borderRadius = "var(--radius-full)";
      }
    }

    // Add active class if this item is currently being viewed (if global state tracks it)
    // This would require a global state variable tracking current detail page
    // if (globalCurrentDetailId === item.id && globalCurrentDetailType === item.type) {
    //     addClass(itemElement, 'active');
    // }

    itemElement.addEventListener("click", () => {
      if (navigateToCallback) {
        navigateToCallback("detail", item.id, item.type);
      }
    });

    // Add context menu listener
    itemElement.addEventListener("contextmenu", (e) => {
      const currentUser = getUserData(); // Get current user from storage
      const isOwner =
        isPlaylist && currentUser && item.owner?.id === currentUser.id;
      const isFollowing = item.is_followed || false; // Assume API provides this field

      showContextMenu(e, {
        id: item.id,
        type: item.type,
        isOwner: isOwner,
        isFollowing: isFollowing,
        name: itemTitle, // Pass name for better context menu handling (e.g. "Unfollow X")
      });
    });

    libraryContent.appendChild(itemElement);
  });

  // Apply view mode
  if (currentViewMode === "grid") {
    addClass(libraryContent, "grid-view");
  } else {
    removeClass(libraryContent, "grid-view");
  }
};

/**
 * Handles actions from the custom context menu.
 * @param {string} action - The action to perform (e.g., 'unfollow', 'delete').
 * @param {object} itemData - Data of the item clicked (id, type, isOwner, isFollowing).
 */
const handleContextMenuAction = async (action, itemData) => {
  const { id, type, isOwner, name } = itemData; // Added name for toast messages
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
        // This action is typically for playlists saved by the user but not owned.
        // It's often equivalent to unfollow for shared playlists.
        if (type === "playlist" && !isOwner) {
          // Only for playlists not owned
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
    // Re-render sidebar to reflect changes after successful action
    await renderLibraryItems();
  } catch (error) {
    console.error(
      `Failed to perform action "${action}" on ${type} ${id}:`,
      error
    );
    showToast(error.message || `Failed to ${action} ${type}.`, "error");
  }
};

/**
 * Sets up all event listeners for the sidebar components.
 */
const setupEventListeners = () => {
  // Tabs (Playlists / Artists)
  libraryTabs.addEventListener("click", (e) => {
    const target = e.target.closest(".nav-tab");
    if (target && !hasClass(target, "active")) {
      getElements(".nav-tab", libraryTabs).forEach((tab) =>
        removeClass(tab, "active")
      );
      addClass(target, "active");
      currentActiveTab = target.dataset.tab;
      renderLibraryItems(); // Re-render content based on active tab
    }
  });

  // Sort Button and Dropdown
  sortBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent document click from closing immediately
    toggleClass(sortDropdown, "show"); // Sử dụng toggleClass đã import
  });

  sortDropdown.addEventListener("click", (e) => {
    const target = e.target.closest("li");
    if (target) {
      currentSortBy = target.dataset.sortBy;
      sortBtn.innerHTML = `${target.textContent} <i class="fas fa-list"></i>`; // Update button text
      removeClass(sortDropdown, "show");
      renderLibraryItems(); // Re-render with new sort order
    }
  });

  // Close sort dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      sortDropdown &&
      !sortBtn.contains(e.target) &&
      !sortDropdown.contains(e.target)
    ) {
      removeClass(sortDropdown, "show");
    }
  });

  // View Toggle Button
  viewToggleBtn.addEventListener("click", () => {
    currentViewMode = currentViewMode === "list" ? "grid" : "list";
    viewToggleBtn.querySelector("i").className =
      currentViewMode === "list" ? "fas fa-grip-horizontal" : "fas fa-list"; // Change icon
    renderLibraryItems(); // Apply new view mode
  });

  // Create Playlist Button
  createPlaylistBtn.addEventListener("click", () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      showToast("Please log in to create a playlist.", "info");
      document.dispatchEvent(
        new CustomEvent("openAuthModal", { detail: "login" })
      );
      return;
    }

    openCreatePlaylistModal((newPlaylistId) => {
      showToast("Playlist created successfully!", "success");
      renderLibraryItems(); // Refresh sidebar playlists
      if (navigateToCallback && newPlaylistId) {
        navigateToCallback("detail", newPlaylistId, "playlist");
      }
    });
  });

  // Initialize custom context menu and set its callback
  initContextMenu(handleContextMenuAction);

  // Listen for auth status changes to trigger sidebar refresh (from header/authModal)
  document.addEventListener("authStatusChange", (e) => {
    renderLibraryItems(); // Re-render when login/logout happens
  });
};

/**
 * Initializes the sidebar functionality.
 * @param {function} navigateToApp - Callback for app-level navigation.
 */
export const initSidebar = (navigateToApp) => {
  navigateToCallback = navigateToApp;
  setupEventListeners();
  renderLibraryItems(); // Initial render of library content on load
};
