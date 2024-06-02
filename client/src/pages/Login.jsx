import React from "react";
import { GoogleLogin } from "@react-oauth/google";

const Login = ({ setIsSignedIn }) => {
  const handleSuccess = (credentialResponse) => {
    console.log(credentialResponse);
    localStorage.setItem("googleToken", credentialResponse.credential);
    setIsSignedIn(true);
    window.location.href = "/dashboard";
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
        auto_select
      />
    </div>
  );
};

export default Login;
