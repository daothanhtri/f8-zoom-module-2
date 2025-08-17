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

  if (!data) {
    return null;
  }

  try {
    if (data === "undefined" || data === "null") {
      localStorage.removeItem(USER_DATA_KEY);
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
    localStorage.removeItem(USER_DATA_KEY);
    return null;
  }
};

export const removeUserData = () => {
  localStorage.removeItem(USER_DATA_KEY);
};
