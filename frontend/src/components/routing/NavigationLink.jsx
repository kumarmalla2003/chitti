// frontend/src/components/routing/NavigationLink.jsx

import { Link, useLocation } from "react-router-dom";
import { useCallback } from "react";

// Import map for preloading routes
const routeImports = {
  "/dashboard": () => import("../../features/dashboard/pages/DashboardPage"),
  "/chits": () => import("../../features/chits/pages/ChitsPage"),
  "/members": () => import("../../features/members/pages/MembersPage"),
  "/collections": () => import("../../features/collections/pages/CollectionsPage"),
  "/payouts": () => import("../../features/payouts/pages/PayoutsPage"),
};

/**
 * NavigationLink - A Link component that preloads route chunks on hover.
 * Improves perceived performance by loading code before navigation.
 */
const NavigationLink = ({ to, children, className, ...props }) => {
  const location = useLocation();

  const handleMouseEnter = useCallback(() => {
    // Find matching route import and trigger preload
    const matchingRoute = Object.keys(routeImports).find(route => 
      to === route || to.startsWith(route + "/")
    );
    
    if (matchingRoute && routeImports[matchingRoute]) {
      // Preload the chunk - the import() call triggers webpack to load the chunk
      routeImports[matchingRoute]();
    }
  }, [to]);

  return (
    <Link 
      to={to} 
      className={className} 
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
};

export default NavigationLink;
