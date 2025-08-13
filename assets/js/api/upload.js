// src/js/api/upload.js
import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // 'image' là tên trường mà API mong đợi

  try {
    return await httpRequest.post("upload", formData, { isFormData: true });
  } catch (error) {
    console.error("API Error: Image upload failed", error);
    throw error;
  }
};
