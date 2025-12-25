// frontend/src/components/layout/BottomNav.jsx

import { useSelector } from "react-redux";
import Button from "../ui/Button";
import { useLocation } from "react-router-dom";
import { NavigationLink } from "../routing";
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
} from "lucide-react";

const BottomNav = ({ onLoginClick }) => {
  const location = useLocation();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const isChitsActive = location.pathname.startsWith("/chits");
  const isMembersActive =
    location.pathname.startsWith("/members") ||
    location.pathname.startsWith("/assignments");
  const isLedgerActive =
    location.pathname.startsWith("/ledger") ||
    location.pathname.startsWith("/collections") ||
    location.pathname.startsWith("/payouts");
  const isDashboardActive =
    location.pathname === "/dashboard" &&
    !isChitsActive &&
    !isMembersActive &&
    !isLedgerActive;

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-background-secondary/80 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full h-16 px-2">
        {isLoggedIn ? (
          <nav className="grid h-full w-full grid-cols-4 items-center justify-items-center">
            {/* 1. CHITS */}
            <NavigationLink
              to="/chits"
              className="flex items-center justify-center w-full h-full"
              aria-label="Chits"
            >
              <div
                className={`flex items-center justify-center p-2 rounded-2xl transition-all duration-300 ${isChitsActive
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-text-secondary hover:bg-background-tertiary/50"
                  }`}
              >
                <Layers
                  className={`w-6 h-6 transition-transform duration-300 ${isChitsActive ? "scale-105" : ""
                    }`}
                />
              </div>
            </NavigationLink>

            {/* 2. LEDGER (Unified Collections + Payouts) */}
            <NavigationLink
              to="/ledger"
              className="flex items-center justify-center w-full h-full"
              aria-label="Ledger"
            >
              <div
                className={`flex items-center justify-center p-2 rounded-2xl transition-all duration-300 ${isLedgerActive
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-text-secondary hover:bg-background-tertiary/50"
                  }`}
              >
                <BookOpen
                  className={`w-6 h-6 transition-transform duration-300 ${isLedgerActive ? "scale-105" : ""
                    }`}
                />
              </div>
            </NavigationLink>

            {/* 3. DASHBOARD */}
            <NavigationLink
              to="/dashboard"
              className="flex items-center justify-center w-full h-full"
              aria-label="Dashboard"
            >
              <div
                className={`flex items-center justify-center p-2.5 rounded-2xl transition-all duration-300 ${isDashboardActive
                  ? "bg-accent text-white shadow-md shadow-accent/25"
                  : "text-text-secondary hover:bg-background-tertiary/50"
                  }`}
              >
                <LayoutDashboard
                  className={`w-6 h-6 transition-transform duration-300 ${isDashboardActive ? "scale-105" : ""
                    }`}
                />
              </div>
            </NavigationLink>

            {/* 4. MEMBERS */}
            <NavigationLink
              to="/members"
              className="flex items-center justify-center w-full h-full"
              aria-label="Members"
            >
              <div
                className={`flex items-center justify-center p-2 rounded-2xl transition-all duration-300 ${isMembersActive
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-text-secondary hover:bg-background-tertiary/50"
                  }`}
              >
                <Users
                  className={`w-6 h-6 transition-transform duration-300 ${isMembersActive ? "scale-105" : ""
                    }`}
                />
              </div>
            </NavigationLink>
          </nav>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Button onClick={onLoginClick} className="w-full mx-4">
              Log In to access your Dashboard!
            </Button>
          </div>
        )}
      </div>
    </footer>
  );
};

export default BottomNav;

