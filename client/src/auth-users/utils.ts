import axios from "axios";
import type { User } from '@linguistnow/shared';
import { logger } from '../utils/logger';

/**
 * Utility function to check if a Google OAuth2 access token is still valid.
 */
export const isAccessTokenValid = async (accessToken: string): Promise<boolean> => {
    try {
        const response = await axios.get("https://www.googleapis.com/oauth2/v1/tokeninfo", {
            params: {
                access_token: accessToken,
            },
        });

        // If response status is 200, access token is valid
        if (response.status === 200) {
            return true;
        } else {
            // If response status is not 200, access token might be malformed
            return false;
        }
    } catch (error: unknown) {
        // If an error occurs, return false (access token is not valid)
        if (axios.isAxiosError(error) && error.response?.status === 400) {
            // If status code is 400, access token is likely malformed
            logger.log("Google OAuth access token invalid or expired.");
            return false;
        } else {
            // For other errors, log and return false
            console.error("Error checking access token validity:", error);
            return false;
        }
    }
};

/* Utility function to refresh access token,
typically used when linguist selects calendars in account settings, 
or when PM  displays linguists in dashboard.
Now uses server endpoint to keep client secret secure. */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    try {
        const response = await axios.post<{ accessToken: string }>(
            `${import.meta.env.VITE_API_URL}/api/auth/google/refresh`,
            { refreshToken }
        );

        if (!response.data.accessToken) {
            throw new Error("Failed to refresh access token");
        }

        // Return the new access token
        return response.data.accessToken;
    } catch (error: unknown) {
        console.error("Error refreshing access token:", error);

        // Re-throw with detailed error information for invalid_grant errors
        if (axios.isAxiosError(error) && error.response?.data?.code === 'INVALID_REFRESH_TOKEN') {
            const enhancedError = new Error(error.response.data.details || 'Refresh token is invalid or expired') as Error & { code?: string };
            enhancedError.code = 'INVALID_REFRESH_TOKEN';
            throw enhancedError;
        }

        throw error;
    }
};

/* Utility function to get user details from Airtable after a successful log, 
and save it in state to keep track of user details and consider them logged in */
export const fetchUserDetails = async (
    email: string,
    setUserDetails: (user: User | null) => void
): Promise<User> => {
    try {
        const response = await axios.get<Record<string, unknown>>(`${import.meta.env.VITE_API_URL}/api/users/${email}`);
        // Get raw Airtable data with uppercase field names
        const airtableData = response.data as {
            Email?: string;
            Name?: string;
            Role?: string;
            'Calendar IDs'?: string;
            'Access Token'?: string;
            'Refresh Token'?: string;
            Picture?: string;
        };
        
        // Map Airtable fields to User type for type safety
        const user: User = {
            id: email,
            email: airtableData.Email || email,
            name: airtableData.Name || '',
            role: (airtableData.Role || 'Linguist') as User['role'],
            googleCalendarId: airtableData['Calendar IDs'],
        };
        
        // Merge User type fields with Airtable fields so components can access both
        // This allows components to use either User type fields or Airtable field names
        const userWithAirtableFields = {
            ...user,
            // Preserve Airtable field names for components that expect them
            Email: airtableData.Email || email,
            Name: airtableData.Name || '',
            Role: airtableData.Role || 'Linguist',
            'Calendar IDs': airtableData['Calendar IDs'],
            'Access Token': airtableData['Access Token'],
            'Refresh Token': airtableData['Refresh Token'],
            Picture: airtableData.Picture,
        } as User & typeof airtableData;
        
        setUserDetails(userWithAirtableFields);
        return user;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw { response: { status: 404 } };
        } else {
            throw error;
        }
    }
};

/* Get list of linguist users, to display on dashboard page */
export const fetchUserList = async (): Promise<User[]> => {
    try {
        const response = await axios.get<Array<Record<string, unknown>>>(`${import.meta.env.VITE_API_URL}/api/users`);
        // Map Airtable fields to User type
        return response.data.map((item) => ({
            id: (item.Email as string) || '',
            email: (item.Email as string) || '',
            name: (item.Name as string) || '',
            role: ((item.Role as string) || 'Linguist') as User['role'],
            googleCalendarId: (item['Calendar IDs'] as string),
        }));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error("Error fetching user list: " + errorMessage);
    }
};

interface GoogleUserInfo {
    email: string;
    name: string;
    picture: string;
}

/* Create user on first login and save to state */
export const createUserIfNotFound = async (
    userInfo: GoogleUserInfo,
    setUserDetails: (user: User | null) => void
): Promise<void> => {
    const response = await axios.post<Record<string, unknown>>(`${import.meta.env.VITE_API_URL}/api/users`, {
        email: userInfo.email,
        name: userInfo.name,
        picture_url: userInfo.picture,
    });
    // Get raw Airtable data with uppercase field names
    const airtableData = response.data as {
        Email?: string;
        Name?: string;
        Role?: string;
        'Calendar IDs'?: string;
        'Access Token'?: string;
        'Refresh Token'?: string;
        Picture?: string;
    };
    
    // Map Airtable fields to User type for type safety
    const user: User = {
        id: userInfo.email,
        email: airtableData.Email || userInfo.email,
        name: airtableData.Name || userInfo.name,
        role: (airtableData.Role || 'Linguist') as User['role'],
        googleCalendarId: airtableData['Calendar IDs'],
    };
    
    // Merge User type fields with Airtable fields so components can access both
    const userWithAirtableFields = {
        ...user,
        // Preserve Airtable field names for components that expect them
        Email: airtableData.Email || userInfo.email,
        Name: airtableData.Name || userInfo.name,
        Role: airtableData.Role || 'Linguist',
        'Calendar IDs': airtableData['Calendar IDs'],
        'Access Token': airtableData['Access Token'],
        'Refresh Token': airtableData['Refresh Token'],
        Picture: airtableData.Picture,
    } as User & typeof airtableData;
    
    setUserDetails(userWithAirtableFields);
};
