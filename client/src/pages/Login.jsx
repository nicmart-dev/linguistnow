import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import CalendarSelector from "../components/CalendarSelector";

const Login = ({ setIsSignedIn }) => {
  const [calendars, setCalendars] = useState([]);

  const handleSuccess = (credentialResponse) => {
    console.log(credentialResponse);
    localStorage.setItem("googleToken", credentialResponse.credential);
    setIsSignedIn(true);
    setCalendars([]);
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
      {/* Render CalendarSelector component */}
      {calendars.length > 0 && <CalendarSelector calendars={calendars} />}
    </div>
  );
};

export default Login;
