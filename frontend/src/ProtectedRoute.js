import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "./authService";

/**
 * ProtectedRoute Component
 * Restricts access to authenticated users only.
 * If not authenticated, redirects the client to the entry point preserving shopId.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements to render if authenticated
 */
export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    const shopId = localStorage.getItem("shopId") || "";
    return <Navigate to={shopId ? `/?shopId=${shopId}` : "/"} replace />;
  }
  return children;
};

/**
 * PublicRoute Component
 * Restricts access to unauthenticated users only (e.g. Login, Register pages).
 * If already authenticated, automatically redirects the client to the Home page.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements to render if unauthenticated
 */
export const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />;
  }
  return children;
};
