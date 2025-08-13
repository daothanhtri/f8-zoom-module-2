// src/js/api/artists.js
import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const getAllArtists = async () => {
  try {
    const response = await httpRequest.get(`artists?limit=20&offset=0`);
    console.log(response.artists);

    return { data: response.artists };
  } catch (error) {
    console.error("API Error: Get All Artists failed", error);
    throw error;
  }
};

export const getArtistById = async (id) => {
  try {
    const response = await httpRequest.get(`artists/${id}`);
    return { data: response.id };
  } catch (error) {
    console.error(`API Error: Get Artist by ID (${id}) failed`, error);
    throw error;
  }
};

export const getTrendingArtists = async () => {
  try {
    const response = await httpRequest.get("artists/trending?limit=10");
    return { data: response.artists };
  } catch (error) {
    console.error("API Error: Get Trending Artists failed", error);
    throw error;
  }
};

export const getArtistAlbums = async (artistId) => {
  try {
    const response = await httpRequest.get(`artists/${artistId}/albums`);
    console.log(response.artistAlbums);

    return response || { data: response.artistAlbums };
  } catch (error) {
    console.error(
      `API Error: Get Artist Albums for Artist ID (${artistId}) failed`,
      error
    );
    throw error;
  }
};

export const getArtistTopTracks = async (artistId) => {
  try {
    const response = await httpRequest.get(`artists/${artistId}/top-tracks`);
    return response || { data: [] };
  } catch (error) {
    console.error(
      `API Error: Get Artist Top Tracks for Artist ID (${artistId}) failed`,
      error
    );
    throw error;
  }
};

export const followArtist = async (id) => {
  try {
    return await httpRequest.post(`artists/${id}/follow`);
  } catch (error) {
    console.error(`API Error: Follow Artist (${id}) failed`, error);
    throw error;
  }
};

export const unfollowArtist = async (id) => {
  try {
    return await httpRequest.del(`artists/${id}/follow`);
  } catch (error) {
    console.error(`API Error: Unfollow Artist (${id}) failed`, error);
    throw error;
  }
};

export const getMyArtists = async () => {
  try {
    const response = await httpRequest.get("/artists");
    return response || { data: [] };
  } catch (error) {
    console.error("API Error: Get My Artists failed", error);
    throw error;
  }
};
