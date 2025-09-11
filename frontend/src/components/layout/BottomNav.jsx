import Button from "../ui/Button";
import {
  HomeIcon,
  GridIcon,
  TrendingUpIcon,
  HeartIcon,
  MessageSquareIcon,
} from "../ui/Icons";

const BottomNav = ({ isLoggedIn, activeSection, onLoginClick }) => {
  const navLinks = [
    { href: "#home", id: "home", icon: HomeIcon, label: "Home" },
    { href: "#features", id: "features", icon: GridIcon, label: "Features" },
    {
      href: "#workflow",
      id: "workflow",
      icon: TrendingUpIcon,
      label: "Process",
    },
    { href: "#why-us", id: "why-us", icon: HeartIcon, label: "Why Us" },
    {
      href: "#contact",
      id: "contact",
      icon: MessageSquareIcon,
      label: "Contact",
    },
  ];

  // Animate the bar in after a short delay on page load
  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 animate-[fade-in-up_0.5s_ease-out_0.5s_forwards] opacity-0">
      <div className="bg-background-secondary rounded-md shadow-lg p-2">
        {!isLoggedIn ? (
          // Logged-out view
          <div className="w-80">
            <Button onClick={onLoginClick} className="w-full">
              Log In
            </Button>
          </div>
        ) : (
          // Logged-in view
          <nav className="flex items-center gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors w-20 ${
                    isActive
                      ? "text-accent"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{link.label}</span>
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </footer>
  );
};

export default BottomNav;
