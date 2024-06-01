import React from "react";

const Signup = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold">Signup</h1>
      <form className="mt-4">
        <input
          type="text"
          placeholder="Name"
          className="border p-2 rounded mb-4"
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded mb-4"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Signup
        </button>
      </form>
    </div>
  );
};

export default Signup;
