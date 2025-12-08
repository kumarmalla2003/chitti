// frontend/src/App.jsx

import { useState, useEffect, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./features/auth/components/LoginModal";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";
import { checkSession } from "./features/auth/authSlice";
import { Loader2 } from "lucide-react";
import routes from "./routes";
import { Toaster } from "sonner";

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoggedIn, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  const handleLoginModalOpen = () => setIsModalOpen(true);
  const handleLoginModalClose = () => setIsModalOpen(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-primary">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster position="top-center" richColors />
      <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
      <div
        className={`transition-all duration-300 ${
          isModalOpen ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
              </div>
            }
          >
            <Routes location={location} key={location.pathname}>
              {routes.map(({ path, element: Component, protected: isProtected }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    isProtected ? (
                      isLoggedIn ? (
                        <AnimatedPage>
                          <Component />
                        </AnimatedPage>
                      ) : (
                        <Navigate to="/" replace />
                      )
                    ) : (
                      <AnimatedPage>
                        {/* Pass props if it's HomePage */}
                        <Component onLoginClick={handleLoginModalOpen} />
                      </AnimatedPage>
                    )
                  }
                />
              ))}
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
};

export default App;
