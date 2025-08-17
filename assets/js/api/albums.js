import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const getAllAlbums = async (limit, offset) => {
  try {
    let path = "albums";
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);
    if (params.toString()) path += `?${params.toString()}`;

    const response = await httpRequest.get(path);
    return { data: response };
  } catch (error) {
    console.error("API Error: Get All Albums failed", error);
    throw error;
  }
};

export const getPopularAlbums = async (limit, offset) => {
  try {
    let path = "albums/popular";
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);
    if (params.toString()) path += `?${params.toString()}`;

    const response = await httpRequest.get(path);
    return { data: response.albums };
  } catch (error) {
    console.error("API Error: Get Popular Albums failed", error);
    throw error;
  }
};

export const getNewReleases = async (limit, offset) => {
  try {
    let path = "albums/new-releases";
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);
    if (params.toString()) path += `?${params.toString()}`;

    const response = await httpRequest.get(path);
    return { data: response.albums };
  } catch (error) {
    console.error("API Error: Get New Releases failed", error);
    throw error;
  }
};

export const getAlbumById = async (id) => {
  try {
    const response = await httpRequest.get(`albums/${id}`);
    return { data: response };
  } catch (error) {
    console.error(`API Error: Get Album by ID (${id}) failed`, error);
    throw error;
  }
};

export const createAlbum = async (albumData) => {
  try {
    return await httpRequest.post("albums", albumData);
  } catch (error) {
    console.error("API Error: Create Album failed", error);
    throw error;
  }
};

export const updateAlbum = async (id, albumData) => {
  try {
    return await httpRequest.put(`albums/${id}`, albumData);
  } catch (error) {
    console.error(`API Error: Update Album (${id}) failed`, error);
    throw error;
  }
};

export const deleteAlbum = async (id) => {
  try {
    return await httpRequest.del(`albums/${id}`);
  } catch (error) {
    console.error(`API Error: Delete Album (${id}) failed`, error);
    throw error;
  }
};

export const getAlbumTracks = async (albumId, limit, offset) => {
  try {
    let path = `albums/${albumId}/tracks`;
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);
    if (params.toString()) path += `?${params.toString()}`;

    const response = await httpRequest.get(path);
    return { data: response.albums };
  } catch (error) {
    console.error(
      `API Error: Get Album Tracks for Album ID (${albumId}) failed`,
      error
    );
    throw error;
  }
};

export const likeAlbum = async (id) => {
  try {
    return await httpRequest.put(`albums/${id}/like`);
  } catch (error) {
    console.error(`API Error: Like Album (${id}) failed`, error);
    throw error;
  }
};

export const unlikeAlbum = async (id) => {
  try {
    return await httpRequest.del(`albums/${id}/like`);
  } catch (error) {
    console.error(`API Error: Unlike Album (${id}) failed`, error);
    throw error;
  }
};
