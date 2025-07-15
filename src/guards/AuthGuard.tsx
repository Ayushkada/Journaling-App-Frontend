import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../provider";

const AuthGuard = ({ children }: { children: JSX.Element }) => {
  const { authStatus, isAuthenticated } = useAuth();
  if (authStatus === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span>Connecting to the server, please wait...</span>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};
export default AuthGuard;
