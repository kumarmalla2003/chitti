import Button from "../ui/Button";
import { Link, useLocation } from "react-router-dom";
import { FiGrid } from "react-icons/fi";

const BottomNav = ({ onLoginClick, isLoggedIn }) => {
  const location = useLocation();

  return (
    <footer className="fixed bottom-0 left-0 w-full h-16 bg-background-secondary shadow-[0_-2px_6px_rgba(0,0,0,0.1)] px-4 border-t border-border md:hidden flex items-center">
      <div className="container mx-auto h-full flex items-center">
        {isLoggedIn ? (
          <nav className="grid h-full w-full grid-cols-5 items-center gap-2">
            {/* Placeholder for the first two icons */}
            <div></div>
            <div></div>
            {/* Centered Dashboard Icon */}
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                location.pathname === "/dashboard"
                  ? "text-accent"
                  : "text-text-primary"
              }`}
              aria-label="Dashboard"
            >
              <FiGrid
                className={`w-7 h-7 transition-transform duration-300 ${
                  location.pathname === "/dashboard" ? "scale-110" : ""
                }`}
              />
            </Link>
            {/* Placeholder for the last two icons */}
            <div></div>
            <div></div>
          </nav>
        ) : (
          <Button onClick={onLoginClick} className="w-full">
            Log In
          </Button>
        )}
      </div>
    </footer>
  );
};

export default BottomNav;
