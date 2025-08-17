// src/js/components/header.js
import { getElement, addClass, removeClass, hasClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import {
  removeAccessToken,
  removeUserData,
  getUserData,
  getAccessToken,
} from "../utils/storage.js";
import { logout } from "../api/auth.js";
import { openAuthModal } from "./authModal.js";

const signupBtn = getElement("#signupBtn");
const loginBtn = getElement("#loginBtn");
const authButtons = getElement("#authButtons");
const userMenu = getElement("#userMenu");
const userAvatar = getElement("#userAvatar");
const userDropdown = getElement("#userDropdown");
const logoutBtn = getElement("#logoutBtn");
const homeBtn = getElement("#homeBtn");
const spotifyLogo = getElement("#spotifyLogo");

let navigateToCallback = null;

export const updateHeaderUI = (isLoggedIn, userData = null) => {
  if (isLoggedIn) {
    addClass(authButtons, "hidden");
    removeClass(userMenu, "hidden");
    if (userData && userData.avatar_url) {
      userAvatar.querySelector("img").src = userData.avatar_url;
    } else {

      userAvatar.querySelector("img").src =
        "placeholder.svg?height=32&width=32";
    }
  } else {
    removeClass(authButtons, "hidden");
    addClass(userMenu, "hidden");

    userAvatar.querySelector("img").src = "placeholder.svg?height=32&width=32";
  }
};

const handleLogout = async () => {
  userDropdown.classList.remove("show");

  try {
    await logout(); 
    removeAccessToken();
    removeUserData();
    updateHeaderUI(false);
    showToast("Logged out successfully!", "success");
    if (navigateToCallback) {
      navigateToCallback("home");
    }
  } catch (error) {
    console.error("Logout failed:", error);
    showToast(error.data?.message || "Failed to log out.", "error");
  }
};

const setupEventListeners = () => {
  signupBtn.addEventListener("click", () => openAuthModal("signup"));
  loginBtn.addEventListener("click", () => openAuthModal("login"));

  userAvatar.addEventListener("click", (e) => {
    e.stopPropagation(); 
    userDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (
      userDropdown &&
      !userAvatar.contains(e.target) &&
      !userDropdown.contains(e.target)
    ) {
      removeClass(userDropdown, "show");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (userDropdown && e.key === "Escape" && hasClass(userDropdown, "show")) {
      removeClass(userDropdown, "show");
    }
  });

  logoutBtn.addEventListener("click", handleLogout);

  homeBtn.addEventListener("click", () => {
    if (navigateToCallback) navigateToCallback("home");
  });

  spotifyLogo.addEventListener("click", () => {
    if (navigateToCallback) navigateToCallback("home");
  });
};

export const initHeader = (navigateToApp) => {
  navigateToCallback = navigateToApp; 
  setupEventListeners();

 
  const token = getAccessToken();
  const userData = getUserData();
  updateHeaderUI(!!token, userData);
};
