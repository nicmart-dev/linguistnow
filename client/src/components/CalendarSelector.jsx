import React, { useEffect, useState, useCallback } from "react";
import { refreshAccessToken } from "../auth/utils";
import { useNavigate } from "react-router-dom";

/* The CalendarSelector component fetches the user's Google Calendars 
using their access token, handles token expiration by refreshing the access token, 
and allows the user to select and save their calendars.
 */
const CalendarSelector = ({ onSave }) => {
  const [calendars, setCalendars] = useState([]); // all users calendars to display
  const [selectedCalendars, setSelectedCalendars] = useState([]); // user selected calendars
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState(false); // refresh token

  const navigate = useNavigate();

  /* Fetch calendars from Google Calendar API.
  We use useCallback hook to ensure we don't fetch calendars unless needed. */
  const fetchCalendars = useCallback(
    async (accessToken) => {
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
          const newAccessToken = await refreshAccessToken(googleRefreshToken);
          setGoogleAccessToken(newAccessToken);

          // Retry fetching calendars with the new access token
          fetchCalendars(newAccessToken);
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
    },
    [googleRefreshToken]
  );

  useEffect(() => {
    const storedAccessToken = localStorage.getItem("googleAccessToken");
    const storedRefreshToken = localStorage.getItem("googleRefreshToken");

    if (storedAccessToken) {
      fetchCalendars(storedAccessToken);
      setGoogleAccessToken(storedAccessToken);
      setGoogleRefreshToken(storedRefreshToken);
    } else navigate("/login"); // need to login if no access token
  }, [fetchCalendars, navigate]);

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
