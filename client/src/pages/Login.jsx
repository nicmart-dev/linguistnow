import React from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google"; // Import required component to login
import { useNavigate } from "react-router-dom"; // Import the Navigate hook
import axios from "axios"; // Import Axios for making HTTP requests

/* On successful login, store token in storage and redirect to Settings */
const Login = ({ setIsSignedIn }) => {
  const navigate = useNavigate(); // Use navigate for route change

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      console.log("Code:", code);
      const tokens = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/google`,
        {
          code,
        }
      );

      console.log(tokens);
    },
    flow: "auth-code",
  });

  // Authenticate with Google OAuth
  // const handleSuccess = async (response) => {
  //   /* Input: Sample credentials returned by Google authorization that we pass as body to the backend
  //   {
  //     "credential": "eyJhbGciOiJSUzI1NiIsIm...", // Google ID token
  //     "clientId": "1013468598501...apps.googleusercontent.com", // Google client ID
  //     "select_by": "btn"
  //   }  */
  //   try {
  //     console.log("Response:", response);
  //     const { code } = response;
  //     console.log("Success:", code);
  //     const tokens = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/auth/google`,
  //       {
  //         /* Backend then exchanges the ID token for:
  //          * access_token (to talk with google APIs)
  //          * refresh_token (to refresh user's token)
  //          * id_token (JWT contains all user's info) */
  //         code,
  //       }
  //     );
  //     // Store the access token in local storage
  //     localStorage.setItem("googleToken", tokens.access_token);
  //     console.log("Google Tokens:", tokens);
  //     setIsSignedIn(true);
  //     navigate("/settings"); // Redirect to settings page
  //   } catch (error) {
  //     console.error("Error exchanging code for tokens:", error);
  //   }
  // };

  // const handleError = () => {
  //   console.log("Login Failed");
  // };

  return (
    <div>
      <h2>Login Page</h2>
      {/* Show Google sign in button */}
      {/* <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        auto_select // Automatically select the first account
        scope="https://www.googleapis.com/auth/calendar.readonly" // Add desired scope
        useOneTap
        flow="auth-code"
      /> */}
      <button onClick={() => googleLogin()}>Sign in with Google 🚀</button>;
    </div>
  );
};

export default Login;
