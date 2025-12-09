// frontend/src/App.jsx

import { useState, useEffect } from "react"; // <-- CORRECTED IMPORT
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "./features/auth/authSlice";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./features/home/pages/HomePage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import ChitsPage from "./features/chits/pages/ChitsPage";
import ChitDetailPage from "./features/chits/pages/ChitDetailPage";
import MembersPage from "./features/members/pages/MembersPage";
import MemberDetailPage from "./features/members/pages/MemberDetailPage";
import LoginModal from "./features/auth/components/LoginModal";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";

// Ensure these files exist or rename them back to PaymentsPage/PaymentDetailPage if needed
import CollectionsPage from "./features/collections/pages/CollectionsPage";
import CollectionDetailPage from "./features/collections/pages/CollectionDetailPage";

import PayoutsPage from "./features/payouts/pages/PayoutsPage";
import PayoutDetailPage from "./features/payouts/pages/PayoutDetailPage";


const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoggedIn } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
      setIsModalOpen(true); // Optionally open login modal
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  const handleLoginModalOpen = () => setIsModalOpen(true);
  const handleLoginModalClose = () => setIsModalOpen(false);

  return (
    <ThemeProvider>
      <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
      <div
        className={`transition-all duration-300 ${isModalOpen ? "blur-sm pointer-events-none" : ""
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
