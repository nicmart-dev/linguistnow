import React from "react";
import { FormattedMessage } from "react-intl";

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold">
        <FormattedMessage id="dashboard.title" />
      </h1>
      <p className="text-xl mt-4">
        <FormattedMessage id="dashboard.description" />
      </p>
    </div>
  );
};

export default Dashboard;
