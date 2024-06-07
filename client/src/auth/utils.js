import axios from "axios";

export const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios.post("https://oauth2.googleapis.com/token", null, {
            params: {
                client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            },
        });

        if (!response.data.access_token) {
            throw new Error("Failed to refresh access token");
        }

        const newAccessToken = response.data.access_token;
        // Save the new access token to localStorage or wherever it needs to be stored
        localStorage.setItem("googleAccessToken", newAccessToken);

        return newAccessToken;
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw error;
    }
};
