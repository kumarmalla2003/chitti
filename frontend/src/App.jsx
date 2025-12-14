// frontend/src/App.jsx

import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "./features/auth/authSlice";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/ToastProvider";
import LoginModal from "./features/auth/components/LoginModal";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";
import MainLayout from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/routing";

// --- Lazy Imports ---
const HomePage = lazy(() => import("./features/home/pages/HomePage"));
const DashboardPage = lazy(() => import("./features/dashboard/pages/DashboardPage"));

const ChitsPage = lazy(() => import("./features/chits/pages/ChitsPage"));
const ChitDetailPage = lazy(() => import("./features/chits/pages/ChitDetailPage"));

const MembersPage = lazy(() => import("./features/members/pages/MembersPage"));
const MemberDetailPage = lazy(() => import("./features/members/pages/MemberDetailPage"));

const CollectionsPage = lazy(() => import("./features/collections/pages/CollectionsPage"));
const CollectionDetailPage = lazy(() => import("./features/collections/pages/CollectionDetailPage"));

const PayoutsPage = lazy(() => import("./features/payouts/pages/PayoutsPage"));
const PayoutDetailPage = lazy(() => import("./features/payouts/pages/PayoutDetailPage"));

const NotFoundPage = lazy(() => import("./features/errors/pages/NotFoundPage"));

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <ErrorBoundary>
        <ToastProvider>
          <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
          {/* Background blur managed by LoginModal's overlay usually, or keep if needed for whole app */}
          <div className={`transition-all duration-300 ${isModalOpen ? "blur-sm pointer-events-none" : ""}`}>
            <Suspense fallback={null}>
              <AnimatePresence mode="wait">
                <Routes location={location}>
                  {/* Public Route */}
                  <Route
                    path="/"
                    element={
                      <AnimatedPage key="home">
                        <HomePage onLoginClick={handleLoginModalOpen} />
                      </AnimatedPage>
                    }
                  />

                  {/* Authenticated Routes wrapped in ProtectedRoute and MainLayout */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                      <Route
                        path="/dashboard"
                        element={
                          <AnimatedPage key="dashboard">
                            <DashboardPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- CHITS ROUTES --- */}
                      <Route
                        path="/chits"
                        element={
                          <AnimatedPage key="chits">
                            <ChitsPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/chits/create"
                        element={
                          <AnimatedPage key="chits-create">
                            <ChitDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/chits/view/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <ChitDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/chits/edit/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <ChitDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- MEMBERS ROUTES --- */}
                      <Route
                        path="/members"
                        element={
                          <AnimatedPage key="members">
                            <MembersPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/members/create"
                        element={
                          <AnimatedPage key="members-create">
                            <MemberDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/members/view/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <MemberDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/members/edit/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <MemberDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- COLLECTIONS ROUTES --- */}
                      <Route
                        path="/collections"
                        element={
                          <AnimatedPage key="collections">
                            <CollectionsPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/collections/create"
                        element={
                          <AnimatedPage key="collections-create">
                            <CollectionDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/collections/view/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <CollectionDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/collections/edit/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <CollectionDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- PAYOUTS ROUTES --- */}
                      <Route
                        path="/payouts"
                        element={
                          <AnimatedPage key="payouts">
                            <PayoutsPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/payouts/create"
                        element={
                          <AnimatedPage key="payouts-create">
                            <PayoutDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/payouts/view/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <PayoutDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/payouts/edit/:id"
                        element={
                          <AnimatedPage key={location.pathname}>
                            <PayoutDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* 404 Catch-all for authenticated users */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Route>

                  {/* Global 404 Catch-all for unauthenticated users */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </div>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
