import React, { useState, useEffect } from "react";
import axios from "axios";
import { FormattedMessage } from "react-intl"; // Import FormattedMessage

const Dashboard = () => {
  const [linguists, setLinguists] = useState([]); // store list of users retrieved from Airtable
  const [errors, setErrors] = useState([]); // used to store errors when iterating through users

  /* Get list of linguists at page load from Airtable  and 
  for each check their availability using n8n workflow.
  If 
  */
  useEffect(() => {
    const fetchLinguists = async () => {
      const newErrors = []; // Collect errors here

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users`
        );
        const users = response.data;
        console.log("Users:", users);

        for (const user of users) {
          try {
            // Check if the correct keys are present
            if (!user["Calendar IDs"] || !user["Access Token"]) {
              throw new Error(
                `Calendar IDs or Access Token not available for user: ${user.Email}`
              );
            }

            // Trigger N8n workflow to get availability for each user
            const availabilityResponse = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/calendars/free`,
              {
                calendarIds: user["Calendar IDs"],
                accessToken: user["Access Token"],
              }
            );
            const availability = availabilityResponse.data;
            console.log("Availability for", user.Email, ":", availability);

            // Add the user with availability to the linguists state
            setLinguists((prevLinguists) => [
              ...prevLinguists,
              { ...user, availability },
            ]);
          } catch (userError) {
            console.warn(userError);
            newErrors.push(userError.message);
          }
        }
      } catch (error) {
        console.error("Error fetching linguists:", error);
        newErrors.push("Error fetching linguists: " + error.message);
      } finally {
        if (newErrors.length > 0) {
          setErrors(newErrors);
        }
      }
    };

    fetchLinguists();
  }, []);

  /* Show available linguists in a table. */
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold">
        <FormattedMessage id="dashboard.title" />
      </h1>
      <p className="text-xl mt-4">
        <FormattedMessage id="dashboard.description" />
      </p>
      <table className="mt-4 border-collapse border border-gray-800">
        <thead>
          <tr>
            <th className="border border-gray-800 p-2">Name</th>
            <th className="border border-gray-800 p-2">Email</th>
            <th className="border border-gray-800 p-2">Availability</th>
          </tr>
        </thead>
        <tbody>
          {linguists.map((linguist) => (
            <tr key={linguist.Email}>
              <td className="border border-gray-800 p-2">{linguist.Name}</td>
              <td className="border border-gray-800 p-2">{linguist.Email}</td>
              <td className="border border-gray-800 p-2">
                {linguist.availability[0].result
                  ? "Available"
                  : "Not Available"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
