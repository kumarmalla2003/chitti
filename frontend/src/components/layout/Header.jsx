// frontend/src/components/layout/Header.jsx

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import ThemeToggle from "../ui/ThemeToggle";
import ProfileDropdown from "../ui/ProfileDropdown";
import useClickOutside from "../../hooks/useClickOutside";
import { FiMenu, FiLogIn, FiUser } from "react-icons/fi";
import { AnimatePresence } from "framer-motion";

const Header = ({
  onLoginClick,
  activeSection,
  onNavLinkClick,
  onMenuOpen,
}) => {
  const location = useLocation();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [underlineStyle, setUnderlineStyle] = useState({});
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useClickOutside(() => setIsDropdownOpen(false));

  const linkRefs = {
    home: useRef(null),
    features: useRef(null),
    workflow: useRef(null),
    "why-us": useRef(null),
    contact: useRef(null),
    dashboard: useRef(null),
    groups: useRef(null),
  };

  const loggedOutNavLinks = [
    { href: "#home", text: "Home", id: "home" },
    { href: "#features", text: "Features", id: "features" },
    { href: "#workflow", text: "Process", id: "workflow" },
    { href: "#why-us", text: "Why Us", id: "why-us" },
    { href: "#contact", text: "Contact", id: "contact" },
  ];

  const loggedInNavLinks = [
    { href: "/", text: "Home", id: "home" },
    { href: "/dashboard", text: "Dashboard", id: "dashboard" },
    { href: "/groups", text: "Groups", id: "groups" },
  ];

  useEffect(() => {
    const activeId = isLoggedIn
      ? location.pathname === "/dashboard"
        ? "dashboard"
        : location.pathname === "/groups"
        ? "groups"
        : "home"
      : activeSection;

    const targetId = hoveredLink || activeId;
    const activeLinkRef = linkRefs[targetId];

    if (activeLinkRef && activeLinkRef.current) {
      setUnderlineStyle({
        left: activeLinkRef.current.offsetLeft,
        width: activeLinkRef.current.offsetWidth,
        opacity: 1,
      });
    } else if (!hoveredLink) {
      setUnderlineStyle({ opacity: 0 });
    }
  }, [activeSection, hoveredLink, isLoggedIn, location.pathname]);

  const handleLinkClick = (e, sectionId) => {
    if (onNavLinkClick) {
      onNavLinkClick(sectionId);
    }
  };

  const NavLinks = () => {
    if (isLoggedIn) {
      return loggedInNavLinks.map((link) => (
        <Link
          key={link.id}
          ref={linkRefs[link.id]}
          to={link.href}
          onMouseEnter={() => setHoveredLink(link.id)}
          className={`transition-colors ${
            location.pathname === link.href
              ? "text-accent"
              : "text-text-secondary"
          }`}
        >
          {link.text}
        </Link>
      ));
    }
    return loggedOutNavLinks.map((link) => (
      <a
        key={link.id}
        ref={linkRefs[link.id]}
        href={link.href}
        onClick={(e) => handleLinkClick(e, link.id)}
        onMouseEnter={() => setHoveredLink(link.id)}
        className={`transition-colors ${
          activeSection === link.id ? "text-accent" : "text-text-secondary"
        }`}
      >
        {link.text}
      </a>
    ));
  };

  const BrandLogo = ({ className }) => {
    if (location.pathname === "/") {
      return (
        <a
          href="#home"
          onClick={(e) => handleLinkClick(e, "home")}
          className={className}
        >
          Chitti
        </a>
      );
    }
    return (
      <Link to="/" className={className}>
        Chitti
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 bg-background-secondary/80 backdrop-blur-sm shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex-shrink-0">
          <BrandLogo className="hidden md:block text-3xl font-bold font-heading text-accent" />
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
          <BrandLogo className="text-3xl font-bold font-heading text-accent" />
        </div>

        <div
          onMouseLeave={() => setHoveredLink(null)}
          className="hidden md:flex items-center space-x-8 relative"
        >
          <NavLinks />
          <span
            className="absolute bottom-[-5px] h-0.5 bg-accent transition-all duration-300 ease-out"
            style={underlineStyle}
          />
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="text-text-primary cursor-pointer"
                aria-label="Profile"
              >
                <FiUser className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <ProfileDropdown onClose={() => setIsDropdownOpen(false)} />
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="text-accent transition-opacity hover:opacity-80 cursor-pointer"
              aria-label="Log In"
            >
              <FiLogIn className="w-8 h-8" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
