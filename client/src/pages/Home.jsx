import React from "react";
import { FormattedMessage } from "react-intl";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold">
        <FormattedMessage id="welcome" />
      </h1>
      <p className="text-xl mt-4">
        <FormattedMessage id="description" />
      </p>
    </div>
  );
};

export default Home;
