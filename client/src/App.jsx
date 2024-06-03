import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import AccountSettings from "./pages/AccountSettings.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google"; // Package used to manage Google OAuth
import LanguageProvider from "./i18n/LanguageProvider"; // Package used to manage translations

const App = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  /* Check authentication on load to check if the user 
  is already signed in by checking the token in localStorage. */
  useEffect(() => {
    const token = localStorage.getItem("googleToken");
    if (token) {
      setIsSignedIn(true);
    }
  }, []);

  return (
    /* Wraps the application to provide the OAuth context */
    <GoogleOAuthProvider clientId="1013468598501-cunj635lqqs72mar3cfistsaigaop03h.apps.googleusercontent.com">
      <LanguageProvider>
        <BrowserRouter>
          {/* {isSignedIn && <Navigate to="/dashboard" />}{" "} */}
          {/* Navigate to dashboard if logged in */}
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={<Login setIsSignedIn={setIsSignedIn} />}
            />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute isSignedIn={isSignedIn} element={<Dashboard />} />
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute
                  isSignedIn={isSignedIn}
                  element={<AccountSettings />}
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
const PrivateRoute = ({ element, isSignedIn }) => {
  return isSignedIn ? element : <Navigate to="/login" />;
};

export default App;
