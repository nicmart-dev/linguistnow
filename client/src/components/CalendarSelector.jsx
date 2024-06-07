import React, { useEffect, useState, useCallback } from "react";

/* The CalendarSelector component fetches the user's Google Calendars 
using their access token, handles token expiration by refreshing the access token, 
and allows the user to select and save their calendars.
 */
const CalendarSelector = ({ onSave }) => {
  const [calendars, setCalendars] = useState([]); // all users calendars to display
  const [selectedCalendars, setSelectedCalendars] = useState([]); // user selected calendars
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState(false); // refresh token

  /* Fetch calendars from Google Calendar API.
  We use useCallback hook to ensure we don't fetch calendars unless needed. */
  const fetchCalendars = useCallback(async (accessToken) => {
    try {
      console.log("accessToken", accessToken);
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: new Headers({
            Authorization: `Bearer ${accessToken}`,
          }),
        }
      );

      if (response.status === 401) {
        // Token expired, attempt to refresh token
        console.log("Token expired, refreshing access token...");
        await refreshAccessToken();
        // Retry fetching calendars with the new access token
        fetchCalendars(localStorage.getItem("googleAccessToken"));
      } else {
        const data = await response.json();
        console.log("Calendars:", data.items);
        setCalendars(data.items);
      }
    } catch (error) {
      if (error.message === "Failed to refresh access token") {
        // If token refresh fails, don't retry fetching calendars
        console.error(
          "Failed to refresh access token. Stopping further attempts."
        );
      } else {
        console.error("Error fetching calendars:", error);
      }
    }
  }, []);

  useEffect(() => {
    const googleAccessToken = localStorage.getItem("googleAccessToken");
    const googleRefreshToken = localStorage.getItem("googleRefreshToken");

    if (googleAccessToken) {
      fetchCalendars(googleAccessToken);
      setGoogleAccessToken(googleAccessToken);
      setGoogleRefreshToken(googleRefreshToken);
    }
  }, [fetchCalendars, setGoogleAccessToken, setGoogleRefreshToken]);

  const refreshAccessToken = async () => {
    try {
      // Fetch refresh token from local storage
      const refreshToken = localStorage.getItem("googleRefreshToken");

      // Make a request to Google's OAuth token endpoint to refresh the access token
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&client_secret=${process.env.REACT_APP_GOOGLE_CLIENT_SECRET}&refresh_token=${refreshToken}&grant_type=refresh_token`,
      });

      if (!response.ok) {
        // If token refresh fails, throw an error
        throw new Error("Failed to refresh access token");
      }

      const tokenData = await response.json();

      // Update the access token in local storage
      localStorage.setItem("googleAccessToken", tokenData.access_token);
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw error; // Rethrow the error to stop the loop in fetchCalendars
    }
  };

  const handleSelectCalendar = (calendarId) => {
    if (selectedCalendars.includes(calendarId)) {
      setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId));
    } else {
      setSelectedCalendars([...selectedCalendars, calendarId]);
    }
  };

  /* Save selected calendars in parent account settings component */
  const handleSaveCalendars = () => {
    onSave(selectedCalendars, googleAccessToken, googleRefreshToken);
  };

  return (
    <>
      <h3>Choose Calendars:</h3>
      {calendars && calendars.length > 0 ? (
        <ul>
          {calendars.map((calendar) => (
            <li key={calendar.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedCalendars.includes(calendar.id)}
                  onChange={() => handleSelectCalendar(calendar.id)}
                />
                {calendar.summary}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>No calendars available.</p>
      )}
      <button onClick={handleSaveCalendars}>Save Calendars</button>
    </>
  );
};

export default CalendarSelector;
