import React from "react";
import { GoogleLogin } from "@react-oauth/google"; // Import required component to login
import { Navigate } from "react-router-dom"; // Import the Navigate hook

/* On successful login, store token in storage and redirect to Settings */
const Login = ({ setIsSignedIn }) => {
  const handleSuccess = (credentialResponse) => {
    console.log(credentialResponse);
    localStorage.setItem("googleToken", credentialResponse.credential);
    setIsSignedIn(true);
    return <Navigate to="/settings" />;
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
      />
    </div>
  );
};

export default Login;
