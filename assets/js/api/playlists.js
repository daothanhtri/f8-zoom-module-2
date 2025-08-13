// src/js/api/playlists.js
import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const getAllPlaylists = async () => {
  try {
    const response = await httpRequest.get("playlists?limit=20&offset=0");
    return { data: response.playLists }; // Đảm bảo luôn trả về đối tượng có 'data' là mảng
  } catch (error) {
    console.error("API Error: Get All Playlists failed", error);
    throw error;
  }
};

export const getPlaylistById = async (id) => {
  try {
    const response = await httpRequest.get(`playlists/${id}`);
    return { data: response.id };
  } catch (error) {
    console.error(`API Error: Get Playlist by ID (${id}) failed`, error);
    throw error;
  }
};

export const createPlaylist = async (name) => {
  try {
    return await httpRequest.post("playlists", { name });
  } catch (error) {
    console.error("API Error: Create Playlist failed", error);
    throw error;
  }
};

export const updatePlaylist = async (id, data) => {
  try {
    // data có thể là { name, description, cover_url }
    return await httpRequest.put(`playlists/${id}`, data);
  } catch (error) {
    console.error(`API Error: Update Playlist (${id}) failed`, error);
    throw error;
  }
};

export const deletePlaylist = async (id) => {
  try {
    return await httpRequest.del(`playlists/${id}`);
  } catch (error) {
    console.error(`API Error: Delete Playlist (${id}) failed`, error);
    throw error;
  }
};

export const followPlaylist = async (id) => {
  try {
    return await httpRequest.post(`playlists/${id}/follow`);
  } catch (error) {
    console.error(`API Error: Follow Playlist (${id}) failed`, error);
    throw error;
  }
};

export const unfollowPlaylist = async (id) => {
  try {
    return await httpRequest.del(`playlists/${id}/follow`);
  } catch (error) {
    console.error(`API Error: Unfollow Playlist (${id}) failed`, error);
    throw error;
  }
};

export const getMyPlaylists = async () => {
  try {
    const response = await httpRequest.get("me/playlists");
    return { data: response.playLists };
  } catch (error) {
    console.error("API Error: Get My Playlists failed", error);
    throw error;
  }
};
