// frontend/src/components/layout/BottomNav.jsx

import { useSelector } from "react-redux";
import Button from "../ui/Button";
import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiUsers } from "react-icons/fi";

const BottomNav = ({ onLoginClick }) => {
  const location = useLocation();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const isGroupsActive = location.pathname.startsWith("/groups");
  const isDashboardActive = location.pathname === "/dashboard";

  return (
    <footer className="fixed bottom-0 left-0 w-full h-16 bg-background-secondary shadow-[0_-2px_6px_rgba(0,0,0,0.1)] px-4 border-t border-border md:hidden flex items-center">
      <div className="container mx-auto h-full flex items-center">
        {isLoggedIn ? (
          <nav className="grid h-full w-full grid-cols-2 items-center gap-2">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isDashboardActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Dashboard"
            >
              <FiGrid
                className={`w-7 h-7 transition-transform duration-300 ${
                  isDashboardActive ? "scale-110" : ""
                }`}
              />
            </Link>
            <Link
              to="/groups"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isGroupsActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Groups"
            >
              <FiUsers
                className={`w-7 h-7 transition-transform duration-300 ${
                  isGroupsActive ? "scale-110" : ""
                }`}
              />
            </Link>
          </nav>
        ) : (
          <Button onClick={onLoginClick} className="w-full">
            Log In to access your Dashboard!
          </Button>
        )}
      </div>
    </footer>
  );
};

export default BottomNav;
