import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CalendarSelector from "../components/CalendarSelector";
import { useIntl } from "react-intl";

/* The AccountSettings component utilizes the CalendarSelector 
to manage and save the user's calendar selections. */
const AccountSettings = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [storedUserEmail, setStoredUserEmail] = useState(""); // used to identify user we want to get details from
  const navigate = useNavigate();
  const intl = useIntl();

  useEffect(() => {
    const storedUserEmail = localStorage.getItem("userEmail");
    if (!storedUserEmail) {
      navigate("/login"); // Redirect to login if no user email is stored
      return;
    }
    setStoredUserEmail(storedUserEmail);
  }, [navigate]);

  useEffect(() => {
    const fetchUserDetails = async () => {
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
        // navigate("/login"); // Ask user to log in again if error occurs
      }
    };

    if (storedUserEmail) {
      fetchUserDetails();
    }
  }, [storedUserEmail, navigate]);

  /* Save user selected calendars, and Google OAuth2 tokens in Airtable */
  const handleSaveCalendars = async (updatedCalendars) => {
    try {
      if (!storedUserEmail) {
        console.error("User email not found.");
        return;
      }

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
