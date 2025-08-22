import {
  getElement,
  addClass,
  removeClass,
  toggleClass,
} from "../utils/dom.js";
import { showToast } from "../utils/toast.js";
import { updatePlaylist } from "../api/playlists.js";
import { uploadPlaylistCover } from "../api/upload.js";


const modal = getElement("#editPlaylistModal");
const closeBtn = getElement("#editPlaylistModalClose");
const form = getElement("#editPlaylistForm");
const imageContainer = getElement("#editModalImageContainer");
const imagePreview = getElement("#editModalImagePreview");
const nameInput = getElement("#editModalName");
const descriptionInput = getElement("#editModalDescription");

let currentPlaylist = null;
let selectedFile = null;
let onSaveSuccessCallback = null;

const openModal = (playlist, onSave) => {
  currentPlaylist = playlist;
  onSaveSuccessCallback = onSave;

 
  nameInput.value = playlist.name || "";
  descriptionInput.value = playlist.description || "";
  if (playlist.cover_image_url) {
    imagePreview.src = playlist.cover_image_url;
    removeClass(imagePreview, "hidden");
  } else {
    addClass(imagePreview, "hidden");
    imagePreview.src = "";
  }

  addClass(modal, "show");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  removeClass(modal, "show");
  document.body.style.overflow = "auto";

  currentPlaylist = null;
  selectedFile = null;
  onSaveSuccessCallback = null;
};

const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
   
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      removeClass(imagePreview, "hidden");
    };
    reader.readAsDataURL(file);
  }
};

const handleFormSubmit = async (event) => {
  event.preventDefault();
  if (!currentPlaylist) return;

  const saveBtn = form.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    let updatedData = {};
    const newName = nameInput.value.trim();
    const newDescription = descriptionInput.value.trim();

   
    if (selectedFile) {
      const uploadResponse = await uploadPlaylistCover(
        currentPlaylist.id,
        selectedFile
      );
      if (uploadResponse && uploadResponse.path) {
        updatedData.cover_image_url = uploadResponse.path;
      }
    }

  
    if (newName !== currentPlaylist.name) {
      updatedData.name = newName;
    }
    if (newDescription !== currentPlaylist.description) {
      updatedData.description = newDescription;
    }

    
    if (Object.keys(updatedData).length > 0) {
      const response = await updatePlaylist(currentPlaylist.id, updatedData);
      showToast("Playlist updated successfully!", "success");

      if (onSaveSuccessCallback) {
        
        onSaveSuccessCallback({ ...currentPlaylist, ...response });
      }
    }

    closeModal();
  } catch (error) {
    console.error("Failed to update playlist:", error);
    showToast(error.message || "Failed to save details.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
};

export const initEditPlaylistModal = () => {
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  form.addEventListener("submit", handleFormSubmit);

  imageContainer.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = handleImageSelect;
    fileInput.click();
  });
};

export { openModal as openEditPlaylistModal };
