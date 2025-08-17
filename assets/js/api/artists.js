import httpRequest from "../utils/httpRequest.js"; // Đảm bảo đường dẫn đúng

export const getAllArtists = async () => {
  try {
    const response = await httpRequest.get(`artists?limit=20&offset=0`);

    return { data: response.artists };
  } catch (error) {
    console.error("API Error: Get All Artists failed", error);
    throw error;
  }
};

export const getArtistById = async (id) => {
  try {
    const response = await httpRequest.get(`artists/${id}`);
    return { data: response };
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

export const getArtistAlbums = async (id) => {
  try {
    const response = await httpRequest.get(`artists/${id}/albums`);
    return { data: response.id };
  } catch (error) {
    console.error(
      `API Error: Get Artist Albums for Artist ID (${id}) failed`,
      error
    );
    throw error;
  }
};

export const getArtistPopularTracks = async (id) => {
  try {
    const response = await httpRequest.get(`artists/${id}/tracks/popular`);
    return { data: response.tracks };
  } catch (error) {
    console.error(
      `API Error: Get Artist Popular Tracks for Artist ID (${id}) failed`,
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
    return { data: response.artists };
  } catch (error) {
    console.error("API Error: Get My Artists failed", error);
    throw error;
  }
};
