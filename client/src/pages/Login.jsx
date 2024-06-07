import React from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsSignedIn }) => {
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

      // Store user email in local storage so we can then use it to identify the user when saving calendars in account settings
      localStorage.setItem("userEmail", userInfo.email);

      // Create or update the user in Airtable via backend server
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users`, {
        email: userInfo.email,
        name: userInfo.name,
        picture_url: userInfo.picture,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
      });

      setIsSignedIn(true); // Update the signed-in state
      navigate("/settings");
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
