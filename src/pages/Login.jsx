import React from "react";

const Login = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold">Login</h1>
      <form className="mt-4">
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
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
