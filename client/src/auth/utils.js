import axios from "axios";

/* Utility function to refresh access token,
typically used when linguist selects calendars in account settings, 
or when PM  displays linguists in dashboard. */
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

        // Return the new access token
        return response.data.access_token;
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw error;
    }
};

/* Utility function to get user details from Airtable after a successful log, 
and save it in state to keep track of user details and consider them logged in */
export const fetchUserDetails = async (storedUserEmail, setUserDetails) => {
    try {
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/users/${storedUserEmail}`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch user details");
        }
        const userData = await response.json();
        console.log("User details:", userData);
        setUserDetails(userData);
    } catch (error) {
        console.error("Error fetching user details:", error);
    }
};

/* Get list of linguist users, to display on dashboard page */
export const fetchUserList = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching user list: " + error.message);
    }
};
