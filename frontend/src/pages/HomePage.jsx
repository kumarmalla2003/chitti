import { useState, useRef, useEffect } from "react";
import Header from "../components/layout/Header";
import Hero from "../components/sections/Hero";
import Features from "../components/sections/Features";
import Workflow from "../components/sections/Workflow";
import WhyUs from "../components/sections/WhyUs";
import Contact from "../components/sections/Contact";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import { useActiveSection } from "../hooks/useActiveSection";

const HomePage = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const homeRef = useRef(null);
  const featuresRef = useRef(null);
  const workflowRef = useRef(null);
  const whyUsRef = useRef(null);
  const contactRef = useRef(null);

  const [clickedSection, setClickedSection] = useState(null);

  const observedSection = useActiveSection([
    homeRef,
    featuresRef,
    workflowRef,
    whyUsRef,
    contactRef,
  ]);

  const activeSection = clickedSection || observedSection;

  useEffect(() => {
    const handleManualScroll = () => {
      setClickedSection(null);
    };

    window.addEventListener("wheel", handleManualScroll, { passive: true });
    window.addEventListener("touchmove", handleManualScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleManualScroll);
      window.removeEventListener("touchmove", handleManualScroll);
    };
  }, []);

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onLoginClick={onLoginClick}
          activeSection={activeSection}
          onNavLinkClick={setClickedSection}
          onMenuOpen={() => setIsMenuOpen(true)}
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow">
            <Hero ref={homeRef} onLoginClick={onLoginClick} />
            <Features ref={featuresRef} />
            <Workflow ref={workflowRef} />
            <WhyUs ref={whyUsRef} />
            <Contact ref={contactRef} />
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavLinkClick={setClickedSection}
        activeSection={activeSection}
        onLoginClick={onLoginClick}
      />
      <BottomNav onLoginClick={onLoginClick} />
    </>
  );
};

export default HomePage;
