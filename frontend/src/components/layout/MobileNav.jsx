// frontend/src/components/layout/MobileNav.jsx

import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import Button from "../ui/Button";
import ThemeToggle from "../ui/ThemeToggle";
import { FiArrowLeft, FiLogIn, FiLogOut } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { RupeeIcon } from "../ui/Icons";

const MobileNav = ({
  isOpen,
  onClose,
  onNavLinkClick,
  activeSection,
  onLoginClick,
}) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const handleLinkClick = (e, sectionId) => {
    if (onNavLinkClick) {
      onNavLinkClick(sectionId);
    }
    onClose();
  };

  const handleLoginClick = () => {
    onLoginClick();
    onClose();
  };

  const handleLogoutClick = () => {
    dispatch(logout());
    onClose();
  };

  const isLinkActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/chits") {
      // <-- ADDED
      return location.pathname.startsWith("/chits");
    }
    if (path === "/members") {
      return (
        location.pathname.startsWith("/members") ||
        location.pathname.startsWith("/assignments")
      );
    }
    if (path === "/payments") {
      return location.pathname.startsWith("/payments");
    }
    return location.pathname.startsWith(path);
  };

  const loggedOutNavLinks = [
    { href: "#home", text: "Home", id: "home" },
    { href: "#features", text: "Features", id: "features" },
    { href: "#workflow", text: "Process", id: "workflow" },
    { href: "#why-us", text: "Why Us", id: "why-us" },
    { href: "#contact", text: "Contact", id: "contact" },
  ];

  const loggedInNavLinks = [
    { href: "/", text: "Home" },
    { href: "/dashboard", text: "Dashboard" },
    { href: "/chits", text: "Chits" }, // <-- RENAMED
    { href: "/members", text: "Members" },
    { href: "/payments", text: "Payments" },
  ];

  const BrandLogo = () => {
    const className = "text-2xl font-bold font-heading text-accent";
    if (location.pathname === "/") {
      return (
        <a
          href="#home"
          className={className}
          onClick={(e) => handleLinkClick(e, "home")}
        >
          Chitti
        </a>
      );
    }
    return (
      <Link to="/" className={className} onClick={onClose}>
        Chitti
      </Link>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ease-in-out md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-background-secondary z-40 shadow-lg transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-5 flex flex-col h-full">
          {/* Header */}
          <div className="relative flex justify-center items-center pb-4">
            <button
              onClick={onClose}
              className="absolute left-0 text-text-primary"
              aria-label="Close menu"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <BrandLogo />
            {isLoggedIn ? (
              <button
                onClick={handleLogoutClick}
                className="absolute right-0 p-1 text-error-accent"
                aria-label="Log Out"
              >
                <FiLogOut className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={handleLoginClick}
                className="absolute right-0 p-1 text-accent"
                aria-label="Log In"
              >
                <FiLogIn className="w-6 h-6" />
              </button>
            )}
          </div>
          <hr className="border-border" />

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-2 mt-6">
            {isLoggedIn
              ? loggedInNavLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className={`px-4 py-3 rounded-md transition-[background-color,transform,opacity] duration-200 text-lg hover:bg-background-tertiary ${
                      isLinkActive(link.href)
                        ? "text-accent font-semibold underline underline-offset-4"
                        : "text-text-primary"
                    }`}
                    style={{
                      transitionDelay: `${75 + index * 25}ms`,
                      transform: isOpen ? "translateX(0)" : "translateX(-20px)",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    {link.text}
                  </Link>
                ))
              : loggedOutNavLinks.map((link, index) => (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={`px-4 py-3 rounded-md transition-[background-color,transform,opacity] duration-200 text-lg hover:bg-background-tertiary ${
                      activeSection === link.id
                        ? "text-accent font-semibold underline underline-offset-4"
                        : "text-text-primary"
                    }`}
                    style={{
                      transitionDelay: `${75 + index * 25}ms`,
                      transform: isOpen ? "translateX(0)" : "translateX(-20px)",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    {link.text}
                  </a>
                ))}
          </nav>

          {/* Theme Toggle */}
          <hr className="my-6 border-border" />
          <div className="px-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-lg">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          {/* Session Actions (Login/Logout) */}
          <div className="mt-auto">
            {isLoggedIn ? (
              <>
                <hr className="mb-6 border-border" />
                <Button
                  onClick={handleLogoutClick}
                  className="w-full mb-4"
                  variant="error"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <p className="pt-6 text-base text-text-secondary text-center mb-4">
                  Log in to access your dashboard!
                </p>
                <hr className="mb-6 border-border" />
                <Button onClick={handleLoginClick} className="w-full mb-4">
                  Log In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
