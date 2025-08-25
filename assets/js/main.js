import { initAuthModal, openAuthModal } from "./components/authModal.js";
import { initHeader, updateHeaderUI } from "./components/header.js";
import { initSidebar, renderLibraryItems } from "./components/sidebar.js";
import { initEditPlaylistModal } from "./components/editPlaylistModal.js";
import {
  renderEditPlaylistPage,
  hideEditPlaylistPage,
  initEditPlaylistPage,
} from "./pages/editPlaylistPage.js";
import { renderHomePage, hideHomePage, initHomePage } from "./pages/home.js";
import {
  renderDetailPage,
  hideDetailPage,
  initDetailPage,
} from "./pages/detailPage.js";
import { initTooltips } from "./utils/tooltip.js";
import playerModule from "./components/player.js";
import { initAddToPlaylistPopup } from "./components/addToPlaylistPopup.js";

export const navigateTo = async (view, id = null, type = null) => {
  hideHomePage();
  hideDetailPage();
  hideEditPlaylistPage();

  if (view === "home") {
    await renderHomePage();
  } else if (view === "detail" && id && type) {
    await renderDetailPage(type, id);
  } else if (view === "editPlaylist" && id) {
    await renderEditPlaylistPage(id);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  initTooltips();

  playerModule.initPlayer();
  initAddToPlaylistPopup();

  initAuthModal((isLoggedIn, userData) => {
    updateHeaderUI(isLoggedIn, userData);
    if (isLoggedIn) {
      renderLibraryItems();
    }
  });

  document.addEventListener("openAuthModal", (e) => {
    openAuthModal(e.detail);
  });

  initHeader(navigateTo);
  initSidebar(navigateTo);
  initEditPlaylistModal();
  initEditPlaylistPage();
  initHomePage(navigateTo);
  initDetailPage();

  navigateTo("home");
});
