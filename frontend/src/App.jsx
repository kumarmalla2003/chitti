import { useState } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./pages/HomePage";
import LoginModal from "./components/auth/LoginModal";

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginModalOpen = () => setIsModalOpen(true);
  const handleLoginModalClose = () => setIsModalOpen(false);

  return (
    <ThemeProvider>
      <div
        className={`transition-all duration-300 ${
          isModalOpen ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <HomePage onLoginClick={handleLoginModalOpen} />
      </div>
      <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
    </ThemeProvider>
  );
};

export default App;
