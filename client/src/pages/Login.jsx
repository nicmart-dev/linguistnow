import React from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsSignedIn }) => {
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = (response) => {
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

    // Send the authorization code to the backend to exchange for tokens
    axios
      .post(`${process.env.REACT_APP_API_URL}/api/auth/google/code`, { code })
      .then((res) => {
        console.log("Response from server:", res.data);
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem("googleAccessToken", accessToken);
        localStorage.setItem("googleRefreshToken", refreshToken);
        setIsSignedIn(true);
        navigate("/settings");
      })
      .catch((error) => {
        console.error("Error during token exchange:", error);
      });
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
