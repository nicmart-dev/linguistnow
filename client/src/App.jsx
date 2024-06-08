import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import AccountSettings from "./pages/AccountSettings.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google"; // Package used to manage Google OAuth
import LanguageProvider from "./i18n/LanguageProvider"; // Package used to manage translations
import { fetchUserDetails } from "./auth/utils"; // Import the fetchUserDetails function

const App = () => {
  const [userDetails, setUserDetails] = useState(null);

  /* Fetch logged in user details on load if user is signed in */
  useEffect(() => {
    const storedUserEmail = localStorage.getItem("userEmail");
    if (storedUserEmail) {
      fetchUserDetails(storedUserEmail, setUserDetails); // get user details from Airtable
    }
  }, []);

  return (
    /* Wraps the application to provide the OAuth context */
    <GoogleOAuthProvider clientId="1013468598501-cunj635lqqs72mar3cfistsaigaop03h.apps.googleusercontent.com">
      <LanguageProvider>
        <BrowserRouter>
          {/* Need to log in at start */}
          {!userDetails ? <Navigate to="/login" /> : null}
          <Navbar userDetails={userDetails} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={<Login setUserDetails={setUserDetails} />}
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute
                  userDetails={userDetails}
                  element={<Dashboard />}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute
                  userDetails={userDetails}
                  element={
                    <AccountSettings
                      userDetails={userDetails}
                      setUserDetails={setUserDetails}
                    />
                  }
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
};

/* Protects the routes that require authentication. */
const PrivateRoute = ({ element, userDetails }) => {
  return userDetails ? element : <Navigate to="/login" />;
};

export default App;
