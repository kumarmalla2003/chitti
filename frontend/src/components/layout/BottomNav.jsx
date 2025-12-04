// frontend/src/components/layout/BottomNav.jsx

import { useSelector } from "react-redux";
import Button from "../ui/Button";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Layers,
  WalletMinimal,
  TrendingUp,
} from "lucide-react";

const BottomNav = ({ onLoginClick }) => {
  const location = useLocation();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const isChitsActive = location.pathname.startsWith("/chits");
  const isMembersActive =
    location.pathname.startsWith("/members") ||
    location.pathname.startsWith("/assignments");
  const isCollectionsActive = location.pathname.startsWith("/collections");
  const isPayoutsActive = location.pathname.startsWith("/payouts");
  const isDashboardActive =
    location.pathname === "/dashboard" &&
    !isChitsActive &&
    !isMembersActive &&
    !isCollectionsActive &&
    !isPayoutsActive;

  return (
    <footer className="fixed bottom-0 left-0 w-full h-16 bg-background-secondary shadow-[0_-2px_6px_rgba(0,0,0,0.1)] px-4 border-t border-border md:hidden flex items-center">
      <div className="container mx-auto h-full flex items-center">
        {isLoggedIn ? (
          <nav className="grid h-full w-full grid-cols-5 items-center gap-2">
            {/* 1. CHITS */}
            <Link
              to="/chits"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isChitsActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Chits"
            >
              <Layers
                className={`w-7 h-7 transition-transform duration-300 ${
                  isChitsActive ? "scale-110" : ""
                }`}
              />
            </Link>

            {/* 2. PAYOUTS */}
            <Link
              to="/payouts"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isPayoutsActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Payouts"
            >
              <TrendingUp
                className={`w-7 h-7 transition-transform duration-300 ${
                  isPayoutsActive ? "scale-110" : ""
                }`}
              />
            </Link>

            {/* 3. DASHBOARD */}
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isDashboardActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Dashboard"
            >
              <LayoutDashboard
                className={`w-7 h-7 transition-transform duration-300 ${
                  isDashboardActive ? "scale-110" : ""
                }`}
              />
            </Link>

            {/* 4. MEMBERS */}
            <Link
              to="/members"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isMembersActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Members"
            >
              <Users
                className={`w-7 h-7 transition-transform duration-300 ${
                  isMembersActive ? "scale-110" : ""
                }`}
              />
            </Link>

            {/* 5. COLLECTIONS */}
            <Link
              to="/collections"
              className={`flex flex-col items-center justify-center transition-colors duration-300 ${
                isCollectionsActive ? "text-accent" : "text-text-primary"
              }`}
              aria-label="Collections"
            >
              <WalletMinimal
                className={`w-7 h-7 transition-transform duration-300 ${
                  isCollectionsActive ? "scale-110" : ""
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
