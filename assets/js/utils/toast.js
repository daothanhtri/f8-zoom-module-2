import { getElement, createElement, addClass, removeClass } from "./dom.js";

const toastContainer = getElement("#toastContainer");

export const showToast = (message, type = "success", duration = 3000) => {
    if (!toastContainer) {
        console.warn("Toast container not found.");
        return;
    }

    const toast = createElement("div", `toast ${type}`);
    const icon = createElement("i");
    const messageSpan = createElement("span", "toast-message");

    if (type === "success") {
        addClass(icon, "fas fa-check-circle");
    } else if (type === "error") {
        addClass(icon, "fas fa-times-circle");
    } else {
        addClass(icon, "fas fa-info-circle");
    }

    messageSpan.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(messageSpan);
    toastContainer.appendChild(toast);


    toast.style.setProperty("--toast-duration", `${duration / 1000}s`);

    setTimeout(() => {
        toast.remove();
    }, duration + 300); 
};