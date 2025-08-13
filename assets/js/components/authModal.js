// src/js/components/authModal.js
import { getElement, addClass, removeClass, hasClass } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { validateForm, clearValidationErrors } from "../utils/validation.js";
import {
  setAccessToken,
  setUserData,
  removeAccessToken,
  removeUserData,
} from "../utils/storage.js";
import { register, login, getMe } from "../api/auth.js";

const authModal = getElement("#authModal");
const modalClose = getElement("#modalClose");
const signupForm = getElement("#signupForm");
const signupFormContent = getElement("#signupFormContent");
const loginForm = getElement("#loginForm");
const loginFormContent = getElement("#loginFormContent");
const showLoginBtn = getElement("#showLogin");
const showSignupBtn = getElement("#showSignup");

let onAuthSuccessCallback = null;

const signupValidationConfig = {
  email: {
    required: true,
    type: "email",
    messages: {
      required: "Email address is required.",
      invalidEmail: "Please enter a valid email address.",
    },
  },
  password: {
    required: true,
    type: "password",
    messages: {
      required: "Password is required.",
      invalidPassword:
        "Password must be at least 6 characters, including uppercase, lowercase, and numbers.",
    },
  },
 
};

const loginValidationConfig = {
  email: {
    required: true,
    messages: {
      required: "Email or username is required.",
    },
  },
  password: {
    required: true,
    messages: {
      required: "Password is required.",
    },
  },
};


function showSignupForm() {
  signupForm.style.display = "block";
  loginForm.style.display = "none";
  clearValidationErrors(signupFormContent);
  clearValidationErrors(loginFormContent);

  getElement("#signupEmail").value = "";
  getElement("#signupPassword").value = "";
}


function showLoginForm() {
  signupForm.style.display = "none";
  loginForm.style.display = "block";
  clearValidationErrors(signupFormContent);
  clearValidationErrors(loginFormContent);

  getElement("#loginEmail").value = "";
  getElement("#loginPassword").value = "";
}

export const openAuthModal = (formType = "login") => {
  if (formType === "signup") {
    showSignupForm();
  } else {
    showLoginForm();
  }
  addClass(authModal, "show");
  document.body.style.overflow = "hidden"; 
};


export const closeAuthModal = () => {
  removeClass(authModal, "show");
  document.body.style.overflow = "auto"; 
};

const handleAuthSuccess = async (token) => {
  console.log("handleAuthSuccess: Token received =", token);
  setAccessToken(token);
  console.log(
    "handleAuthSuccess: Token after setAccessToken =",
    localStorage.getItem("access_token")
  );

  try {
    const userData = await getMe(); 
    setUserData(userData.data); 
    showToast("Logged in successfully!", "success");
    closeAuthModal();
    if (onAuthSuccessCallback) {
      onAuthSuccessCallback(true, userData.data);
    }
  } catch (error) {
    showToast("Login successful, but failed to fetch user data.", "error");
    console.error("Failed to fetch user data:", error);
    closeAuthModal();
    if (onAuthSuccessCallback) {
      onAuthSuccessCallback(true, null);
    }
  }
};

const handleAuthError = (error, formElement) => {
  showToast(error.data?.message || "An error occurred.", "error");


  if (error.data?.errors) {
    for (const field in error.data.errors) {
      const formGroup = formElement.querySelector(`[data-field="${field}"]`);
      if (formGroup) {
        addClass(formGroup, "invalid");
        const errorMessageElement = formGroup.querySelector(
          ".error-message span"
        );
        if (errorMessageElement) {
          errorMessageElement.textContent = error.data.errors[field][0];
        }
      }
    }
  }
};

const setupEventListeners = () => {
  modalClose.addEventListener("click", closeAuthModal);

  authModal.addEventListener("click", function (e) {
    if (e.target === authModal) {
      closeAuthModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && hasClass(authModal, "show")) {
      closeAuthModal();
    }
  });

  showLoginBtn.addEventListener("click", showLoginForm);
  showSignupBtn.addEventListener("click", showSignupForm);


  signupFormContent.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearValidationErrors(signupFormContent);


    const tempSignupValidationConfig = {
      email: signupValidationConfig.email,
      password: signupValidationConfig.password,
    };

    const { isValid } = validateForm(
      signupFormContent,
      tempSignupValidationConfig
    );

    if (isValid) {
      const email = getElement("#signupEmail").value.trim();
      const password = getElement("#signupPassword").value;

      const username = email.split("@")[0];

      try {
        const response = await register(email, password, username);
        if (response && response.access_token) {
          await handleAuthSuccess(response.access_token);
        } else {
          showToast("Registration successful! Please log in.", "success");
          showLoginForm();
        }
      } catch (error) {
        console.error("Signup failed:", error);
        handleAuthError(error, signupFormContent);
      }
    }
  });


  loginFormContent.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearValidationErrors(loginFormContent);

    const { isValid } = validateForm(loginFormContent, loginValidationConfig);

    if (isValid) {
      const emailOrUsername = getElement("#loginEmail").value.trim();
      const password = getElement("#loginPassword").value;

      try {
        const response = await login(emailOrUsername, password);
        if (response && response.access_token) {
          await handleAuthSuccess(response.access_token);
        } else {
          showToast("Login failed: No token received.", "error");
        }
      } catch (error) {
        console.error("Login failed:", error);
        handleAuthError(error, loginFormContent);
      }
    }
  });
};

export const initAuthModal = (onSuccess) => {
  onAuthSuccessCallback = onSuccess;
  setupEventListeners();
};
