import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { LanguageContext } from "../i18n/LanguageProvider";

const Navbar = ({ userDetails }) => {
  const { switchLanguage } = useContext(LanguageContext); // Access switchLanguage function from context

  return (
    <nav className="bg-blue-500 p-4">
      <ul className="flex space-x-4 text-white">
        <li>
          <Link to="/">
            <FormattedMessage id="home" />
          </Link>
        </li>
        {!userDetails && ( // Render login link only if not signed in
          <li>
            <Link to="/login">
              <FormattedMessage id="login" />
            </Link>
          </li>
        )}
        {userDetails && userDetails.Role === "Project Manager" && (
          <li>
            <Link to="/dashboard">
              <FormattedMessage id="dashboard" />
            </Link>
          </li>
        )}
        {userDetails && userDetails.Role !== "Project Manager" && (
          <li>
            <Link to="/settings">
              <FormattedMessage id="settings" />
            </Link>
          </li>
        )}
        {/* Language toggle buttons */}
        <li>
          <button onClick={() => switchLanguage("en")}>
            <FormattedMessage id="english" />
          </button>
        </li>
        <li>
          <button onClick={() => switchLanguage("fr")}>
            <FormattedMessage id="french" />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
