// frontend/src/App.jsx

import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "./features/auth/authSlice";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/ToastProvider";
import LoginModal from "./features/auth/components/LoginModal";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";
import MainLayout from "./components/layout/MainLayout";

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
      <ErrorBoundary>
        <ToastProvider>
          <LoginModal isOpen={isModalOpen} onClose={handleLoginModalClose} />
          {/* Background blur managed by LoginModal's overlay usually, or keep if needed for whole app */}
          <div className={`transition-all duration-300 ${isModalOpen ? "blur-sm pointer-events-none" : ""}`}>
            <Suspense fallback={null}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {/* Public Route */}
                  <Route
                    path="/"
                    element={
                      <AnimatedPage>
                        <HomePage onLoginClick={handleLoginModalOpen} />
                      </AnimatedPage>
                    }
                  />

                  {/* Authenticated Routes wrapped in MainLayout */}
                  {isLoggedIn ? (
                    <Route element={<MainLayout />}>
                      <Route
                        path="/dashboard"
                        element={
                          <AnimatedPage>
                            <DashboardPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- CHITS ROUTES --- */}
                      <Route
                        path="/chits"
                        element={
                          <AnimatedPage>
                            <ChitsPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/chits/create"
                        element={
                          <AnimatedPage>
                            <ChitDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/chits/view/:id"
                        element={
                          <AnimatedPage>
                            <ChitDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/chits/edit/:id"
                        element={
                          <AnimatedPage>
                            <ChitDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- MEMBERS ROUTES --- */}
                      <Route
                        path="/members"
                        element={
                          <AnimatedPage>
                            <MembersPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/members/create"
                        element={
                          <AnimatedPage>
                            <MemberDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/members/view/:id"
                        element={
                          <AnimatedPage>
                            <MemberDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/members/edit/:id"
                        element={
                          <AnimatedPage>
                            <MemberDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- COLLECTIONS ROUTES --- */}
                      <Route
                        path="/collections"
                        element={
                          <AnimatedPage>
                            <CollectionsPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/collections/create"
                        element={
                          <AnimatedPage>
                            <CollectionDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/collections/view/:id"
                        element={
                          <AnimatedPage>
                            <CollectionDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/collections/edit/:id"
                        element={
                          <AnimatedPage>
                            <CollectionDetailPage />
                          </AnimatedPage>
                        }
                      />

                      {/* --- PAYOUTS ROUTES --- */}
                      <Route
                        path="/payouts"
                        element={
                          <AnimatedPage>
                            <PayoutsPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/payouts/create"
                        element={
                          <AnimatedPage>
                            <PayoutDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/payouts/view/:id"
                        element={
                          <AnimatedPage>
                            <PayoutDetailPage />
                          </AnimatedPage>
                        }
                      />
                      <Route
                        path="/payouts/edit/:id"
                        element={
                          <AnimatedPage>
                            <PayoutDetailPage />
                          </AnimatedPage>
                        }
                      />
                    </Route>
                  ) : (
                    // Catch-all for non-logged in users trying to access protected routes
                    <Route path="*" element={<NotFoundPage />} />
                  )}
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
