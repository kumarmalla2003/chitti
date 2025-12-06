// frontend/src/App.jsx

import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ChitsPage from "./pages/ChitsPage";
import ChitDetailPage from "./pages/ChitDetailPage";
import MembersPage from "./pages/MembersPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import LoginModal from "./components/auth/LoginModal";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";
import { checkSession } from "./redux/slices/authSlice";
import { Loader2 } from "lucide-react";

// Ensure these files exist or rename them back to PaymentsPage/PaymentDetailPage if needed
import CollectionsPage from "./pages/CollectionsPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";

import PayoutsPage from "./pages/PayoutsPage";
import PayoutDetailPage from "./pages/PayoutDetailPage";

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
      <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
      <div
        className={`transition-all duration-300 ${
          isModalOpen ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <HomePage onLoginClick={handleLoginModalOpen} />
                </AnimatedPage>
              }
            />
            <Route
              path="/dashboard"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <DashboardPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* --- CHITS ROUTES --- */}
            <Route
              path="/chits"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <ChitsPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/chits/create"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <ChitDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/chits/view/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <ChitDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/chits/edit/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <ChitDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* --- MEMBERS ROUTES --- */}
            <Route
              path="/members"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <MembersPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/members/create"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <MemberDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/members/view/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <MemberDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/members/edit/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <MemberDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* --- COLLECTIONS ROUTES --- */}
            <Route
              path="/collections"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <CollectionsPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/collections/create"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <CollectionDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/collections/view/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <CollectionDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/collections/edit/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <CollectionDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* --- PAYOUTS ROUTES --- */}
            <Route
              path="/payouts"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PayoutsPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/payouts/create"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PayoutDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/payouts/view/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PayoutDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/payouts/edit/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PayoutDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* --- END: PAYOUTS ROUTES --- */}
          </Routes>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
};

export default App;
