import HttpClient from "./HttpClient";

class UserspaceApi extends HttpClient {
  constructor() {
    super("/api"); // base URL or endpoint prefix
  }

  // Method to fetch web profile info by username
  getWebProfileInfo = async () => {
    try {
      // Assuming HttpClient has a get method
      const response = await this.get(`/igp/ptrk.ptrk`);

      // Return the relevant data
      return await response.json();
    } catch (error) {
      console.error("Error fetching profile info:", error);
      return null; // or throw error if you prefer
    }
  };
}

export default UserspaceApi;
