import { initAuthModal, openAuthModal } from "./components/authModal.js";
import { initHeader, updateHeaderUI } from "./components/header.js";
import { initSidebar, renderLibraryItems } from "./components/sidebar.js";
import { initCreatePlaylistModal } from "./components/createPlaylistModal.js";
import { renderHomePage, hideHomePage, initHomePage } from "./pages/home.js";
import {
  renderDetailPage,
  hideDetailPage,
  initDetailPage,
} from "./pages/detailPage.js";
import { initTooltips } from "./utils/tooltip.js";
import playerModule from "./components/player.js";

export const navigateTo = async (view, id = null, type = null) => {
  hideHomePage();
  hideDetailPage();

  if (view === "home") {
    await renderHomePage();
  } else if (view === "detail" && id && type) {
    await renderDetailPage(type, id);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  initTooltips();

  playerModule.initPlayer();

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
  initCreatePlaylistModal();
  initHomePage(navigateTo);
  initDetailPage();

  navigateTo("home");
});
