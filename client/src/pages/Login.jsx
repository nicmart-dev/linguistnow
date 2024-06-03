import React from "react";
import { GoogleLogin } from "@react-oauth/google"; // Import required component to login
import { useNavigate } from "react-router-dom"; // Import the Navigate hook

/* On successful login, store token in storage and redirect to Settings */
const Login = ({ setIsSignedIn }) => {
  const navigate = useNavigate(); // Use navigate for route change

  const handleSuccess = (credentialResponse) => {
    console.log("Login Success:", credentialResponse);
    localStorage.setItem("googleToken", credentialResponse.credential);
    setIsSignedIn(true);
    navigate("/settings"); // Redirect to settings page
  };

  const handleError = () => {
    console.log("Login Failed");
  };

  return (
    <div>
      <h2>Login Page</h2>
      {/* Show Google sign in button */}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        auto_select // Automatically select the first account
        scope="https://www.googleapis.com/auth/calendar.readonly" // Add desired scope
      />
    </div>
  );
};

export default Login;
