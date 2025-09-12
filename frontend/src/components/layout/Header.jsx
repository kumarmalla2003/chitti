import { useState, useRef, useEffect } from "react";
import ThemeToggle from "../ui/ThemeToggle";
import { FiMenu, FiLogIn } from "react-icons/fi";

const Header = ({
  onLoginClick,
  activeSection,
  onNavLinkClick,
  onMenuOpen,
}) => {
  const [underlineStyle, setUnderlineStyle] = useState({});
  const [hoveredLink, setHoveredLink] = useState(null);

  const homeLinkRef = useRef(null);
  const featuresLinkRef = useRef(null);
  const workflowLinkRef = useRef(null);
  const whyUsLinkRef = useRef(null);
  const contactLinkRef = useRef(null);

  const navLinks = {
    home: homeLinkRef,
    features: featuresLinkRef,
    workflow: workflowLinkRef,
    "why-us": whyUsLinkRef,
    contact: contactLinkRef,
  };

  useEffect(() => {
    const targetLink = hoveredLink || activeSection;
    const activeLinkRef = navLinks[targetLink];

    if (activeLinkRef && activeLinkRef.current) {
      setUnderlineStyle({
        left: activeLinkRef.current.offsetLeft,
        width: activeLinkRef.current.offsetWidth,
        opacity: 1,
      });
    } else if (!hoveredLink) {
      setUnderlineStyle({ opacity: 0 });
    }
  }, [activeSection, hoveredLink]);

  const handleLinkClick = (e, sectionId) => {
    onNavLinkClick(sectionId);
  };

  return (
    <header className="sticky top-0 z-20 bg-background-secondary/80 backdrop-blur-sm shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex-shrink-0">
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, "home")}
            className="hidden md:block text-3xl font-bold font-heading text-accent"
          >
            Chitti
          </a>
          <div className="md:hidden">
            <button
              onClick={onMenuOpen}
              className="text-text-primary"
              aria-label="Open menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="md:hidden">
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, "home")}
            className="text-3xl font-bold font-heading text-accent"
          >
            Chitti
          </a>
        </div>

        <div
          onMouseLeave={() => setHoveredLink(null)}
          className="hidden md:flex items-center space-x-8 relative"
        >
          <a
            ref={homeLinkRef}
            href="#home"
            onClick={(e) => handleLinkClick(e, "home")}
            onMouseEnter={() => setHoveredLink("home")}
            className={`transition-colors ${
              activeSection === "home" ? "text-accent" : "text-text-secondary"
            }`}
          >
            Home
          </a>
          <a
            ref={featuresLinkRef}
            href="#features"
            onClick={(e) => handleLinkClick(e, "features")}
            onMouseEnter={() => setHoveredLink("features")}
            className={`transition-colors ${
              activeSection === "features"
                ? "text-accent"
                : "text-text-secondary"
            }`}
          >
            Features
          </a>
          <a
            ref={workflowLinkRef}
            href="#workflow"
            onClick={(e) => handleLinkClick(e, "workflow")}
            onMouseEnter={() => setHoveredLink("workflow")}
            className={`transition-colors ${
              activeSection === "workflow"
                ? "text-accent"
                : "text-text-secondary"
            }`}
          >
            Process
          </a>
          <a
            ref={whyUsLinkRef}
            href="#why-us"
            onClick={(e) => handleLinkClick(e, "why-us")}
            onMouseEnter={() => setHoveredLink("why-us")}
            className={`transition-colors ${
              activeSection === "why-us" ? "text-accent" : "text-text-secondary"
            }`}
          >
            Why Us
          </a>
          <a
            ref={contactLinkRef}
            href="#contact"
            onClick={(e) => handleLinkClick(e, "contact")}
            onMouseEnter={() => setHoveredLink("contact")}
            className={`transition-colors ${
              activeSection === "contact"
                ? "text-accent"
                : "text-text-secondary"
            }`}
          >
            Contact
          </a>
          <span
            className="absolute bottom-[-5px] h-0.5 bg-accent transition-all duration-300 ease-out"
            style={underlineStyle}
          />
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <button
            onClick={onLoginClick}
            className="text-accent transition-opacity hover:opacity-80 cursor-pointer"
            aria-label="Log In"
          >
            <FiLogIn className="w-8 h-8" />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
