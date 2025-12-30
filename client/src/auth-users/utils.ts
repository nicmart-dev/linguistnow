import axios from 'axios'
import type { User } from '@linguistnow/shared'

/* Utility function to get user details from Airtable after a successful login, 
and save it in state to keep track of user details and consider them logged in.
Note: Tokens are stored in Vault, not returned from Airtable. */
export const fetchUserDetails = async (
    email: string,
    setUserDetails: (user: User | null) => void
): Promise<User> => {
    try {
        const response = await axios.get<Record<string, unknown>>(
            `${import.meta.env.VITE_API_URL}/api/users/${email}`
        )
        // Get raw Airtable data with uppercase field names
        // Note: Tokens are no longer stored in Airtable - they're in Vault
        const airtableData = response.data as {
            Email?: string
            Name?: string
            Role?: string
            'Calendar IDs'?: string
            Picture?: string
        }

        // Map Airtable fields to User type for type safety
        const user: User = {
            id: email,
            email: airtableData.Email || email,
            name: airtableData.Name || '',
            role: (airtableData.Role || 'Linguist') as User['role'],
            googleCalendarId: airtableData['Calendar IDs'],
        }

        // Merge User type fields with Airtable fields so components can access both
        // This allows components to use either User type fields or Airtable field names
        const userWithAirtableFields = {
            ...user,
            // Preserve Airtable field names for components that expect them
            Email: airtableData.Email || email,
            Name: airtableData.Name || '',
            Role: airtableData.Role || 'Linguist',
            'Calendar IDs': airtableData['Calendar IDs'],
            Picture: airtableData.Picture,
        } as User & typeof airtableData

        setUserDetails(userWithAirtableFields)
        return user
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw { response: { status: 404 } }
        } else {
            throw error
        }
    }
}

/* Get list of linguist users, to display on dashboard page */
export const fetchUserList = async (): Promise<User[]> => {
    try {
        const response = await axios.get<Array<Record<string, unknown>>>(
            `${import.meta.env.VITE_API_URL}/api/users`
        )
        // Map Airtable fields to User type
        return response.data.map((item) => ({
            id: (item.Email as string) || '',
            email: (item.Email as string) || '',
            name: (item.Name as string) || '',
            role: ((item.Role as string) || 'Linguist') as User['role'],
            googleCalendarId: item['Calendar IDs'] as string,
        }))
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
        throw new Error('Error fetching user list: ' + errorMessage)
    }
}

interface GoogleUserInfo {
    email: string
    name: string
    picture: string
}

/* Create user on first login and save to state.
Note: Tokens are stored in Vault by the backend, not in Airtable. */
export const createUserIfNotFound = async (
    userInfo: GoogleUserInfo,
    setUserDetails: (user: User | null) => void
): Promise<void> => {
    const response = await axios.post<Record<string, unknown>>(
        `${import.meta.env.VITE_API_URL}/api/users`,
        {
            email: userInfo.email,
            name: userInfo.name,
            picture_url: userInfo.picture,
        }
    )
    // Get raw Airtable data with uppercase field names
    // Note: Tokens are no longer stored in Airtable - they're in Vault
    const airtableData = response.data as {
        Email?: string
        Name?: string
        Role?: string
        'Calendar IDs'?: string
        Picture?: string
    }

    // Map Airtable fields to User type for type safety
    const user: User = {
        id: userInfo.email,
        email: airtableData.Email || userInfo.email,
        name: airtableData.Name || userInfo.name,
        role: (airtableData.Role || 'Linguist') as User['role'],
        googleCalendarId: airtableData['Calendar IDs'],
    }

    // Merge User type fields with Airtable fields so components can access both
    const userWithAirtableFields = {
        ...user,
        // Preserve Airtable field names for components that expect them
        Email: airtableData.Email || userInfo.email,
        Name: airtableData.Name || userInfo.name,
        Role: airtableData.Role || 'Linguist',
        'Calendar IDs': airtableData['Calendar IDs'],
        Picture: airtableData.Picture,
    } as User & typeof airtableData

    setUserDetails(userWithAirtableFields)
}
