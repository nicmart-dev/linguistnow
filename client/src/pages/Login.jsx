import React from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // TODO replace all axios calls with fetch globally
import { fetchUserDetails } from "../auth/utils";

const Login = ({ setUserDetails }) => {
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response) => {
    console.log("Google Login Success:", response);
    /* Sample response:
    {
    "code": "4/0AdLIrYdoh19k1VkeCH7wYtKir_oRqF...",
    "scope": "email profile openid https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    "authuser": "0",
    "prompt": "consent"
}
    */
    const { code } = response; // Extract the authorization code

    try {
      // Send the authorization code to the backend to exchange for tokens
      const tokenResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/google/code`,
        { code }
      );
      console.log(
        "Google access and refresh tokens from server:",
        tokenResponse.data
      );
      const { accessToken, refreshToken } = tokenResponse.data;

      localStorage.setItem("googleAccessToken", accessToken);
      localStorage.setItem("googleRefreshToken", refreshToken);

      // Fetch user info from Google
      const userInfoResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      console.log("User Info from Google:", userInfo);

      // TODO: replace by a single call to fetchUserDetails. Check if the user exists in Airtable
      try {
        await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/${userInfo.email}`
        );
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // If the user does not exist, create a new user
          await axios.post(`${process.env.REACT_APP_API_URL}/api/users`, {
            email: userInfo.email,
            name: userInfo.name,
            picture_url: userInfo.picture,
          });
        } else {
          console.error("Error checking user existence:", error);
          throw error;
        }
      } finally {
        // Update the user's access and refresh tokens in Airtable
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/users/${userInfo.email}`,
          {
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken,
          }
        );

        // Get latest user details from Airtable, save in parent state, to consider user logged in, and access in the app as needed
        await fetchUserDetails(userInfo.email, setUserDetails);
        navigate("/settings");
        // TODO: move logic to app component. Check if the user is a project manager
        // const isProjectManager = userInfo.role === "Project Manager";
        // if (isProjectManager) {
        //   // Redirect to the dashboard view if so
        //   navigate("/dashboard");
        // } else {
        //   // Otherwise redirect to the settings page so user can change their calendars
        //   navigate("/settings");
        // }
      }
    } catch (error) {
      console.error("Error during login process:", error);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    flow: "auth-code",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "), // Make sure access token we will get will get access to these scopes
    redirect_uri: `${process.env.REACT_APP_BASE_URL}`,
  });

  return (
    <div>
      <h2>Login Page</h2>
      <GoogleLogin
        onSuccess={login}
        onError={(error) => console.error("Login Failed:", error)}
        auto_select // Automatically select the first account
        useOneTap // Use Google One Tap
      />
    </div>
  );
};

export default Login;
