import React, { useEffect, useState } from "react";

const CalendarSelector = ({ onSave }) => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);

  useEffect(() => {
    const googleAccessToken = localStorage.getItem("googleAccessToken");
    if (googleAccessToken) {
      fetchCalendars(googleAccessToken);
    }
  }, []);

  const fetchCalendars = async (accessToken) => {
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
      const data = await response.json();
      console.log("Calendars:", data);
      setCalendars(data.items);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Token expired, attempt to refresh token
        await refreshAccessToken();
        // Retry fetching calendars
        fetchCalendars(localStorage.getItem("googleAccessToken"));
      } else {
        console.error("Error fetching calendars:", error);
      }
    }
  };

  const refreshAccessToken = async () => {
    try {
      // Fetch refresh token from local storage
      const refreshToken = localStorage.getItem("googleRefreshToken");

      // Make a request to Google's OAuth token endpoint to refresh the access token
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const tokenData = await response.json();

      // Update the access token in local storage
      localStorage.setItem("googleAccessToken", tokenData.access_token);
    } catch (error) {
      console.error("Error refreshing access token:", error);
    }
  };

  const handleSelectCalendar = (calendarId) => {
    if (selectedCalendars.includes(calendarId)) {
      setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId));
    } else {
      setSelectedCalendars([...selectedCalendars, calendarId]);
    }
  };

  const handleSaveCalendars = () => {
    onSave(selectedCalendars);
  };

  return (
    <>
      <h3>Choose Calendars:</h3>
      <ul>
        {/* Show all calendars from logged in user */}
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
      <button onClick={handleSaveCalendars}>Save Calendars</button>
    </>
  );
};

export default CalendarSelector;
