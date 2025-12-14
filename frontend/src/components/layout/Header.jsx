// frontend/src/components/layout/Header.jsx

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavigationLink } from "../routing";
import { useSelector } from "react-redux";
import ThemeToggle from "../ui/ThemeToggle";
import ProfileDropdown from "../ui/ProfileDropdown";
import useClickOutside from "../../hooks/useClickOutside";
import { Menu, LogIn, User } from "lucide-react";
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
    chits: useRef(null),
    members: useRef(null),
    collections: useRef(null),
    payouts: useRef(null),
  };

  const loggedOutNavLinks = [
    { href: "#home", text: "Home", id: "home" },
    { href: "#features", text: "Features", id: "features" },
    { href: "#workflow", text: "Process", id: "workflow" },
    { href: "#why-us", text: "Why Us", id: "why-us" },
    { href: "#contact", text: "Contact", id: "contact" },
  ];

  // UPDATED: Reordered links
  const loggedInNavLinks = [
    { href: "/chits", text: "Chits", id: "chits" },
    { href: "/payouts", text: "Payouts", id: "payouts" },
    { href: "/dashboard", text: "Dashboard", id: "dashboard" },
    { href: "/members", text: "Members", id: "members" },
    { href: "/collections", text: "Collections", id: "collections" },
  ];

  const getActiveId = () => {
    if (!isLoggedIn) return activeSection;
    if (location.pathname.startsWith("/chits")) return "chits";
    if (location.pathname.startsWith("/members")) return "members";
    if (location.pathname.startsWith("/assignments")) return "members";
    if (location.pathname.startsWith("/collections")) return "collections";
    if (location.pathname.startsWith("/payouts")) return "payouts";
    if (location.pathname === "/dashboard") return "dashboard";
    return "home";
  };

  useEffect(() => {
    const activeId = getActiveId();
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

  const isLinkActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/chits") return location.pathname.startsWith("/chits");
    if (path === "/members")
      return (
        location.pathname.startsWith("/members") ||
        location.pathname.startsWith("/assignments")
      );
    if (path === "/collections")
      return location.pathname.startsWith("/collections");
    if (path === "/payouts") return location.pathname.startsWith("/payouts");
    return location.pathname.startsWith(path);
  };

  const NavLinks = () => {
    if (isLoggedIn) {
      return loggedInNavLinks.map((link) => (
        <NavigationLink
          key={link.id}
          ref={linkRefs[link.id]}
          to={link.href}
          onMouseEnter={() => setHoveredLink(link.id)}
          className={`relative z-40 transition-colors duration-normal ease-smooth ${
            isLinkActive(link.href) ? "text-accent" : "text-text-secondary"
          }`}
        >
          {link.text}
        </NavigationLink>
      ));
    }
    return loggedOutNavLinks.map((link) => (
      <a
        key={link.id}
        ref={linkRefs[link.id]}
        href={link.href}
        onClick={(e) => handleLinkClick(e, link.id)}
        onMouseEnter={() => setHoveredLink(link.id)}
        className={`transition-colors duration-normal ease-smooth ${
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
    <header className="sticky top-0 z-sticky bg-background-secondary/80 backdrop-blur-overlay shadow-card">
      <nav className="w-full px-4 py-4 flex justify-between items-center">
        <div className="flex-shrink-0">
          {location.pathname === "/" ? (
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, "home")}
              className="hidden md:block text-display font-bold font-heading text-accent"
            >
              Chitti
            </a>
          ) : (
            <Link
              to="/"
              className="hidden md:block text-display font-bold font-heading text-accent"
            >
              Chitti
            </Link>
          )}
          <div className="md:hidden">
            <button
              onClick={onMenuOpen}
              className="text-text-primary"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="md:hidden">
          {location.pathname === "/" ? (
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, "home")}
              className="text-display font-bold font-heading text-accent"
            >
              Chitti
            </a>
          ) : (
            <Link
              to="/"
              className="text-display font-bold font-heading text-accent"
            >
              Chitti
            </Link>
          )}
        </div>

        <div
          onMouseLeave={() => setHoveredLink(null)}
          className="hidden md:flex items-center md:space-x-4 lg:space-x-8 relative z-30"
        >
          {isLoggedIn
            ? loggedInNavLinks.map((link) => (
                <NavigationLink
                  key={link.id}
                  ref={linkRefs[link.id]}
                  to={link.href}
                  onMouseEnter={() => setHoveredLink(link.id)}
                  className={`relative z-40 transition-colors duration-normal ease-smooth ${
                    isLinkActive(link.href)
                      ? "text-accent"
                      : "text-text-secondary"
                  }`}
                >
                  {link.text}
                </NavigationLink>
              ))
            : loggedOutNavLinks.map((link) => (
                <a
                  key={link.id}
                  ref={linkRefs[link.id]}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  onMouseEnter={() => setHoveredLink(link.id)}
                  className={`relative z-40 transition-colors duration-normal ease-smooth ${
                    activeSection === link.id
                      ? "text-accent"
                      : "text-text-secondary"
                  }`}
                >
                  {link.text}
                </a>
              ))}
          <span
            className="absolute bottom-[-5px] h-0.5 bg-accent transition-all duration-normal ease-smooth pointer-events-none"
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
                <User className="w-6 h-6 md:w-8 md:h-8" />
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
              <LogIn className="w-8 h-8" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
