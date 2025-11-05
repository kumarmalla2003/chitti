// frontend/src/pages/DashboardPage.jsx

import { useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Placeholder props for components that expect them
  const dummyNavLinkClick = () => {};
  const dummyActiveSection = null;
  const dummyLoginClick = () => {};

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection={dummyActiveSection}
          onNavLinkClick={dummyNavLinkClick}
          onLoginClick={dummyLoginClick}
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] bg-background-primary">
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
                  Welcome to your <span className="text-accent">Dashboard</span>
                </h1>
                <p className="mt-4 text-text-secondary">
                  This area is secure and only visible to logged-in users.
                </p>
                {/* MODIFIED THIS LINK */}
                <Link to="/chits" className="inline-block mt-8">
                  <Button className="px-8 py-3 text-lg">View My Chits</Button>
                </Link>
                {/* END OF MODIFICATION */}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={dummyActiveSection}
        onNavLinkClick={dummyNavLinkClick}
        onLoginClick={dummyLoginClick}
      />
      <BottomNav />
    </>
  );
};

export default DashboardPage;
