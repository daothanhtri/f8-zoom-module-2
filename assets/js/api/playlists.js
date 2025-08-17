import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const getAllPlaylists = async () => {
  try {
    const response = await httpRequest.get("playlists?limit=20&offset=0");
    return { data: response.playLists };
  } catch (error) {
    console.error("API Error: Get All Playlists failed", error);
    throw error;
  }
};

export const getPlaylistById = async (id) => {
  try {
    const response = await httpRequest.get(`playlists/${id}`);
    return { data: response };
  } catch (error) {
    console.error(`API Error: Get Playlist by ID (${id}) failed`, error);
    throw error;
  }
};

export const getPlaylistTracks = async (playlistId) => {
  try {
    const response = await httpRequest.get(`playlists/${playlistId}/tracks`);
    return { data: response.playLists };
  } catch (error) {
    console.error(
      `API Error: Get Playlist Tracks for Playlist ID (${playlistId}) failed`,
      error
    );
    throw error;
  }
};

export const createPlaylist = async (
  name,
  description = "",
  is_public = true,
  image_url = ""
) => {
  try {
    return await httpRequest.post("playlists", {
      name,
      description,
      is_public,
      image_url,
    });
  } catch (error) {
    console.error("API Error: Create Playlist failed", error);
    throw error;
  }
};

export const updatePlaylist = async (id, data) => {
  try {
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
    return { data: response };
  } catch (error) {
    console.error("API Error: Get My Playlists failed", error);
    throw error;
  }
};
