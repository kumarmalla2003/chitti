import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import LoginModal from "./components/auth/LoginModal";

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoggedIn } = useSelector((state) => state.auth);

  const handleLoginModalOpen = () => setIsModalOpen(true);
  const handleLoginModalClose = () => setIsModalOpen(false);

  return (
    <ThemeProvider>
      <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
      <div
        className={`transition-all duration-300 ${
          isModalOpen ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <Routes>
          <Route
            path="/"
            element={<HomePage onLoginClick={handleLoginModalOpen} />}
          />
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? <DashboardPage /> : <Navigate to="/" replace />
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;
