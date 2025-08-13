// src/js/utils/storage.js
const ACCESS_TOKEN_KEY = "access_token";
const USER_DATA_KEY = "user_data";

export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const setUserData = (userData) => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
};

export const getUserData = () => {
  const data = localStorage.getItem(USER_DATA_KEY);
  // Kiểm tra nếu data là null hoặc chuỗi rỗng
  if (!data) {
    return null;
  }
  // Thêm try-catch để bắt lỗi JSON.parse nếu chuỗi không hợp lệ
  try {
    // Kiểm tra thêm nếu data là chuỗi "undefined" hoặc "null"
    if (data === "undefined" || data === "null") {
      localStorage.removeItem(USER_DATA_KEY); // Xóa dữ liệu lỗi
      return null;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error(
      "Error parsing user data from localStorage:",
      e,
      "Data causing error:",
      data
    );
    localStorage.removeItem(USER_DATA_KEY); // Xóa dữ liệu lỗi để tránh lặp lại lỗi
    return null;
  }
};

export const removeUserData = () => {
  localStorage.removeItem(USER_DATA_KEY);
};
