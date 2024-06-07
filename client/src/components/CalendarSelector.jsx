import React, { useEffect, useState, useCallback } from "react";
import { refreshAccessToken } from "../auth/utils";

/* The CalendarSelector component fetches the user's Google Calendars 
using their access token, handles token expiration by refreshing the access token, 
and allows the user to select and save their calendars.
 */
const CalendarSelector = ({ userDetails, onSave }) => {
  const [fetchedCalendars, setFetchedCalendars] = useState([]); // all calendars user has access to in Google Calendar

  const fetchCalendars = useCallback(
    async (accessToken) => {
      try {
        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList",
          {
            headers: new Headers({
              Authorization: `Bearer ${accessToken}`,
            }),
          }
        );
        // Access token expired, attempt to refresh token
        if (response.status === 401) {
          console.log("Token expired, refreshing access token...");
          const newAccessToken = await refreshAccessToken(
            userDetails["Refresh Token"]
          );
          fetchCalendars(newAccessToken);
        } else {
          const data = await response.json();
          setFetchedCalendars(data.items);
        }
      } catch (error) {
        console.error("Error fetching calendars:", error);
      }
    },
    [userDetails]
  );

  useEffect(() => {
    if (userDetails && userDetails["Access Token"]) {
      fetchCalendars(userDetails["Access Token"]);
    }
  }, [userDetails, fetchCalendars]);

  const handleSelectCalendar = (calendarId) => {
    const selectedCalendars = userDetails["Calendar IDs"]
      ? userDetails["Calendar IDs"].split(",")
      : [];
    const updatedCalendars = selectedCalendars.includes(calendarId)
      ? selectedCalendars.filter((id) => id !== calendarId)
      : [...selectedCalendars, calendarId];
    onSave(updatedCalendars);
  };

  const selectedCalendars = userDetails["Calendar IDs"]
    ? userDetails["Calendar IDs"].split(",")
    : [];

  return (
    <>
      <h3>Choose Calendars:</h3>
      {fetchedCalendars && fetchedCalendars.length > 0 ? (
        <ul>
          {fetchedCalendars.map((calendar) => (
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
    </>
  );
};

export default CalendarSelector;
