import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng


export const uploadFile = async (endpoint, file, fieldName = "file") => {
  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    return await httpRequest.post(endpoint, formData, { isFormData: true });
  } catch (error) {
    console.error(`API Error: Upload to ${endpoint} failed`, error);
    throw error;
  }
};


export const uploadPlaylistCover = async (playlistId, file) => {
  return await uploadFile(`upload/playlist/${playlistId}/cover`, file, "cover"); 
};


export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file); 
  return await httpRequest.post("upload", formData, { isFormData: true });
};

