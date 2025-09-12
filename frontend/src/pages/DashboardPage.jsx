import { useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";

const DashboardPage = ({ isLoggedIn }) => {
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
          isLoggedIn={isLoggedIn}
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
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        activeSection={dummyActiveSection}
        onNavLinkClick={dummyNavLinkClick}
        onLoginClick={dummyLoginClick}
      />
      <BottomNav isLoggedIn={isLoggedIn} />
    </>
  );
};

export default DashboardPage;
