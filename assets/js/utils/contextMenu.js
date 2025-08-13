// ./js/utils/contextMenu.js
import {
  getElement,
  getElements,
  addClass,
  removeClass,
  hasClass,
  setAttributes,
} from "./dom.js";

const customContextMenu = getElement("#customContextMenu");
let currentContextItemData = null;

export const showContextMenu = (e, itemData) => {
  e.preventDefault(); // Prevent default browser context menu

  if (!customContextMenu) {
    console.error("Custom context menu element not found.");
    return;
  }

  currentContextItemData = itemData;

  let x = e.clientX;
  let y = e.clientY;

  const menuWidth = customContextMenu.offsetWidth;
  const menuHeight = customContextMenu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (x + menuWidth > viewportWidth) {
    x -= menuWidth;
  }
  if (y + menuHeight > viewportHeight) {
    y -= menuHeight;
  }

  customContextMenu.style.left = `${x}px`;
  customContextMenu.style.top = `${y}px`;

  updateContextMenuItems(itemData);

  addClass(customContextMenu, "show");
};

const hideContextMenu = () => {
  removeClass(customContextMenu, "show");
  currentContextItemData = null;
};

const updateContextMenuItems = (itemData) => {
  const { type, isOwner, isFollowing } = itemData;
  const items = getElements("li", customContextMenu);

  items.forEach((item) => {
    removeClass(item, "hidden");
    removeClass(item, "disabled");
    const action = item.dataset.action;

    switch (action) {
      case "follow":
        if (isFollowing || !type || type === "track") addClass(item, "hidden");
        break;
      case "unfollow":
        if (!isFollowing || !type || type === "track") addClass(item, "hidden");
        break;
      case "delete":
        if (!isOwner || type === "artist" || type === "track")
          addClass(item, "hidden");
        break;
      case "remove-from-profile":
        if (type !== "playlist" || isOwner) addClass(item, "hidden");
        break;
      case "save-to-your-liked-songs":
      case "remove-from-liked-songs":
        if (type !== "track") addClass(item, "hidden");

        break;
      case "play":
      case "add-to-queue":
        break;
      default:
        break;
    }
  });
};

export const initContextMenu = (callback) => {
  if (!customContextMenu) return;

  // Hide context menu when clicking anywhere else on the document
  document.addEventListener("click", (e) => {
    if (
      customContextMenu &&
      hasClass(customContextMenu, "show") &&
      !customContextMenu.contains(e.target)
    ) {
      hideContextMenu();
    }
  });

  // Hide context menu when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && hasClass(customContextMenu, "show")) {
      hideContextMenu();
    }
  });

  // Handle clicks on context menu items
  customContextMenu.addEventListener("click", (e) => {
    const target = e.target.closest("li");
    if (target && !hasClass(target, "disabled")) {
      const action = target.dataset.action;
      if (action && currentContextItemData) {
        // Pass the action and item data to the callback
        callback(action, currentContextItemData);
      }
      hideContextMenu(); // Hide menu after action
    }
  });
};
