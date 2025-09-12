import { useTheme } from "../../hooks/useTheme";
import { FiSun, FiMoon } from "react-icons/fi";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-8 w-14 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background-secondary bg-background-tertiary cursor-pointer"
      aria-label="Toggle theme"
    >
      <span
        className={`inline-flex items-center justify-center w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out transform ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <FiMoon className="w-4 h-4 text-gray-600" />
        ) : (
          <FiSun className="w-4 h-4 text-yellow-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
