// frontend/src/App.jsx

import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import MembersPage from "./pages/MembersPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import LoginModal from "./components/auth/LoginModal";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";

// --- IMPORTS FOR NEW PAGES (to be created in 2.3 & 2.4) ---
// We add these now to set up the routes.
import PaymentsPage from "./pages/PaymentsPage";
import PaymentDetailPage from "./pages/PaymentDetailPage";
// --- END IMPORTS ---

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoggedIn } = useSelector((state) => state.auth);
  const location = useLocation();

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
            {/* --- GROUPS ROUTES --- */}
            <Route
              path="/groups"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <GroupsPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/groups/create"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <GroupDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/groups/view/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <GroupDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/groups/edit/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <GroupDetailPage />
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

            {/* --- NEW: PAYMENTS ROUTES --- */}
            <Route
              path="/payments"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PaymentsPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/payments/create"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PaymentDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/payments/view/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PaymentDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/payments/edit/:id"
              element={
                isLoggedIn ? (
                  <AnimatedPage>
                    <PaymentDetailPage />
                  </AnimatedPage>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* --- END: PAYMENTS ROUTES --- */}
          </Routes>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
};

export default App;
