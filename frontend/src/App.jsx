import { useState } from "react";
import HomePage from "./pages/HomePage";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./components/auth/LoginModal";

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <ThemeProvider>
      <HomePage onLoginClick={handleOpenModal} />
      <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </ThemeProvider>
  );
};

export default App;
