// frontend/src/components/routing/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * ProtectedRoute - A wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the home page.
 */

// ⚠️ DEVELOPMENT ONLY: Set to true to bypass authentication
// Remember to set this back to false before deploying to production!
const DEV_BYPASS_AUTH = true;

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const location = useLocation();

  // Skip auth check if bypass is enabled (development only)
  if (DEV_BYPASS_AUTH) {
    return children ? children : <Outlet />;
  }

  if (!isLoggedIn) {
    // Redirect to home, saving the attempted location for potential redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If children are passed, render them; otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};

export default ProtectedRoute;

