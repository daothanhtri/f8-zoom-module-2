// src/js/api/tracks.js
import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const getAllTracks = async () => {
  try {
    // Giả định endpoint cho tất cả các bài hát là "tracks"
    const response = await httpRequest.get("tracks/popular?limit=3");
    return { data: response.tracks };
  } catch (error) {
    console.error("API Error: Get All Tracks failed", error);
    throw error;
  }
};

export const getPopularTracks = async () => {
  try {
    const response = await httpRequest.get(`tracks/popular?limit=10`);
    return { data: response.tracks };
  } catch (error) {
    console.error("API Error: Get Popular Tracks failed", error);
    throw error;
  }
};

export const getTrendingTracks = async () => {
  try {
    const response = await httpRequest.get("tracks/trending?limit=20");
    return { data: response.tracks };
  } catch (error) {
    console.error("API Error: Get Trending Tracks failed", error);
    throw error;
  }
};

export const getTrackById = async (id) => {
  try {
    const response = await httpRequest.get(`tracks/${id}`);
    return { data: response.id };
  } catch (error) {
    console.error(`API Error: Get Track by ID (${id}) failed`, error);
    throw error;
  }
};

export const playTrack = async (trackId) => {
  try {
    return await httpRequest.post(`tracks/${trackId}/play`);
  } catch (error) {
    console.error(`API Error: Play Track (${trackId}) failed`, error);
    throw error;
  }
};

export const createTrack = async (trackData) => {
  try {
    return await httpRequest.post("tracks", trackData);
  } catch (error) {
    console.error("API Error: Create Track failed", error);
    throw error;
  }
};

export const updateTrack = async (id, trackData) => {
  try {
    return await httpRequest.put(`tracks/${id}`, trackData);
  } catch (error) {
    console.error(`API Error: Update Track (${id}) failed`, error);
    throw error;
  }
};

export const deleteTrack = async (id) => {
  try {
    return await httpRequest.del(`tracks/${id}`);
  } catch (error) {
    console.error(`API Error: Delete Track (${id}) failed`, error);
    throw error;
  }
};

export const likeTrack = async (id) => {
  try {
    // Giả định endpoint cho Like Track (thường là PUT hoặc POST)
    return await httpRequest.put(`tracks/${id}/like`);
  } catch (error) {
    console.error(`API Error: Like Track (${id}) failed`, error);
    throw error;
  }
};

export const unlikeTrack = async (id) => {
  try {
    // Giả định endpoint cho Unlike Track (thường là DELETE)
    return await httpRequest.del(`tracks/${id}/like`);
  } catch (error) {
    console.error(`API Error: Unlike Track (${id}) failed`, error);
    throw error;
  }
};
