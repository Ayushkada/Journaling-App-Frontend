import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../provider";

const GuestGuard = ({ children }: { children: JSX.Element }) => {
  const { authStatus, isAuthenticated } = useAuth();
  if (authStatus === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span>Connecting to the server, please wait...</span>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/journals" replace /> : children;
};
export default GuestGuard;
