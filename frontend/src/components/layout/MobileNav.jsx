import Button from "../ui/Button";
import ThemeToggle from "../ui/ThemeToggle";
import { ArrowLeftIcon, LogInIcon } from "../ui/Icons";

const MobileNav = ({
  isOpen,
  onClose,
  onNavLinkClick,
  activeSection,
  onLoginClick,
}) => {
  const handleLinkClick = (e, sectionId) => {
    onNavLinkClick(sectionId);
    onClose();
  };

  const handleLoginClick = () => {
    onLoginClick();
    onClose();
  };

  const navLinks = [
    { href: "#home", text: "Home", id: "home" },
    { href: "#features", text: "Features", id: "features" },
    { href: "#workflow", text: "Process", id: "workflow" },
    { href: "#why-us", text: "Why Us", id: "why-us" },
    { href: "#contact", text: "Contact", id: "contact" },
  ];

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
          <div className="relative flex justify-center items-center pb-4">
            <button
              onClick={onClose}
              className="absolute left-0 text-text-primary"
              aria-label="Close menu"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold font-heading text-accent">
              Chitti
            </h2>
            <button
              onClick={handleLoginClick}
              className="absolute right-0 p-1 text-accent"
              aria-label="Log In"
            >
              <LogInIcon className="w-6 h-6" />
            </button>
          </div>
          <hr className="border-border" />

          <nav className="flex flex-col space-y-2 mt-6">
            {navLinks.map((link, index) => (
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

          <hr className="my-6 border-border" />

          <div className="px-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-lg">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          <p className="mt-auto pt-6 text-base text-text-secondary text-center mb-4">
            Log in to access your dashboard!
          </p>
          <hr className="mb-6 border-border" />
          <Button onClick={handleLoginClick} className="w-full mb-4">
            Log In
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
