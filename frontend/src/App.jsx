import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import LoginModal from "./components/auth/LoginModal";

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginModalOpen = () => setIsModalOpen(true);
  const handleLoginModalClose = () => setIsModalOpen(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    handleLoginModalClose();
  };

  return (
    <ThemeProvider>
      <LoginModal
        isOpen={isModalOpen}
        onClose={handleLoginModalClose}
        onLoginSuccess={handleLogin}
      />
      <div
        className={`transition-all duration-300 ${
          isModalOpen ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onLoginClick={handleLoginModalOpen}
                isLoggedIn={isLoggedIn}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <DashboardPage isLoggedIn={isLoggedIn} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;
