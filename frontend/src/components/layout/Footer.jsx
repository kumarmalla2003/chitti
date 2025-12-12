// frontend/src/components/layout/Footer.jsx

const Footer = () => {
  return (
    // UPDATED: Added /opacity-overlay and backdrop-blur-overlay to match Header
    <footer className="py-4 bg-background-secondary backdrop-blur-overlay">
      <div className="w-full px-4 text-center text-text-secondary">
        {/* Mobile Text */}
        <p className="md:hidden">
          Made with &#9829; by{" "}
          <a
            href="https://github.com/kumarmalla2003"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Kumar
          </a>
        </p>

        {/* Desktop Text */}
        <p className="hidden md:block">
          Made with &#9829; & passion by{" "}
          <a
            href="https://github.com/kumarmalla2003"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Kumar Naidu Malla
          </a>{" "}
          to simplify your work.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
