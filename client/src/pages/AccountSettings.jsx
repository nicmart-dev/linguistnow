import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CalendarSelector from "../components/CalendarSelector";
import { useIntl } from "react-intl";

/* The AccountSettings component utilizes the CalendarSelector component 
to allow the user to select and save their calendars. */
const AccountSettings = ({ userDetails, setUserDetails }) => {
  const [storedUserEmail, setStoredUserEmail] = useState("");
  const navigate = useNavigate();
  const intl = useIntl();

  // TODO: remove userEmail globally, and replace by userDetails.Email
  useEffect(() => {
    const storedUserEmail = localStorage.getItem("userEmail");
    if (!storedUserEmail) {
      navigate("/login"); // Redirect to login if no user email is stored
      return;
    }
    setStoredUserEmail(storedUserEmail);
  }, [navigate]);

  /* Save user selected calendars, and Google OAuth2 tokens in Airtable */
  const handleSaveCalendars = async (updatedCalendars) => {
    try {
      if (!storedUserEmail) {
        console.error("User email not found.");
        return;
      }
      //TODO refactor to only update calendarIds, as we just updated tokens in Login.jsx
      // If the user exists, update their information
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/${storedUserEmail}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calendarIds: updatedCalendars,
            googleAccessToken: userDetails.googleAccessToken,
            googleRefreshToken: userDetails.googleRefreshToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save calendars.");
      }

      setUserDetails({
        ...userDetails,
        "Calendar IDs": updatedCalendars.join(","),
      });

      console.log("Calendars saved.");
    } catch (error) {
      console.error("Failed to save calendars:", error);
    }
  };

  return (
    <div>
      <h2>{intl.formatMessage({ id: "accountSettings.accountSettings" })}</h2>
      {userDetails && (
        <>
          <h3>{intl.formatMessage({ id: "accountSettings.userDetails" })}</h3>
          <p>
            {intl.formatMessage({ id: "accountSettings.email" })}{" "}
            {userDetails.Email}
          </p>
          <p>
            {intl.formatMessage({ id: "accountSettings.name" })}{" "}
            {userDetails.Name}
          </p>
          {/* Pass user details to child component to display list of calendars, 
          as well as function it can call when saving selected calendars. */}
          <CalendarSelector
            userDetails={userDetails}
            onSave={handleSaveCalendars}
          />
        </>
      )}
    </div>
  );
};

export default AccountSettings;
