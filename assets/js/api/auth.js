import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const register = async (email, password, username) => {
  try {
    return await httpRequest.post("auth/register", {
      email,
      password,
      username,
    });
  } catch (error) {
    console.error("API Error: Register failed", error);
    throw error; 
  }
};

export const login = async (emailOrUsername, password) => {
  try {
    return await httpRequest.post("auth/login", {
      email: emailOrUsername,
      password,
    });
  } catch (error) {
    console.error("API Error: Login failed", error);
    throw error; 
  }
};

export const logout = async () => {
  try {
    return await httpRequest.post("auth/logout"); 
  } catch (error) {
    console.error("API Error: Logout failed", error);
    throw error;
  }
};

export const getMe = async () => {
  try {
    return await httpRequest.get("auth/me");
  } catch (error) {
    console.error("API Error: Get Me failed", error);
    throw error;
  }
};
