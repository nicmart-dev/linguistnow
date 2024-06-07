import React, { useState, useEffect } from "react";
import axios from "axios";
import { FormattedMessage } from "react-intl"; // Import FormattedMessage

const Dashboard = () => {
  const [linguists, setLinguists] = useState([]);

  useEffect(() => {
    const fetchLinguists = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users`
        );
        const users = response.data;
        console.log("Users:", users);

        const linguistData = await Promise.all(
          users.map(async (user) => {
            // Check if the correct keys are present
            if (!user["Calendar IDs"] || !user["Access Token"]) {
              // Handle the case where necessary data is not available
              console.warn(
                "Calendar IDs or Access Token not available for user:",
                user
              );
              return null; // or handle this case appropriately
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
            return { ...user, availability };
          })
        );

        // Filter out any null values (users with missing data)
        const validLinguistData = linguistData.filter((data) => data !== null);

        setLinguists(validLinguistData);
      } catch (error) {
        console.error("Error fetching linguists:", error);
      }
    };

    fetchLinguists();
  }, []);

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
