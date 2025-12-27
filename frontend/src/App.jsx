// frontend/src/App.jsx

import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
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

// --- Page-Specific Skeleton Imports (Direct, not lazy) ---
import {
  ChitsPageSkeleton,
  MembersPageSkeleton,
  CollectionsPageSkeleton,
  PayoutsPageSkeleton,
  DashboardSkeleton,
  DetailPageSkeleton,
  HomePageSkeleton,
} from "./components/skeletons";

// --- Lazy Page Imports ---
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

const LedgerPage = lazy(() => import("./features/ledger/pages/LedgerPage"));
const LedgerPageSkeleton = lazy(() => import("./features/ledger/pages/LedgerPageSkeleton"));
const TransactionDetailsPage = lazy(() => import("./features/ledger/pages/TransactionDetailsPage"));

const NotFoundPage = lazy(() => import("./features/errors/pages/NotFoundPage"));

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
      setIsModalOpen(true);
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
          <div className={`transition-all duration-300 ${isModalOpen ? "blur-sm pointer-events-none" : ""}`}>
            <AnimatePresence mode="wait">
              <Routes location={location}>
                {/* Public Route */}
                <Route
                  path="/"
                  element={
                    <AnimatedPage key="home">
                      <Suspense fallback={<HomePageSkeleton />}>
                        <HomePage onLoginClick={handleLoginModalOpen} />
                      </Suspense>
                    </AnimatedPage>
                  }
                />

                {/* Authenticated Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    {/* Dashboard */}
                    <Route
                      path="/dashboard"
                      element={
                        <AnimatedPage key="dashboard">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <DashboardPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />

                    {/* --- CHITS ROUTES --- */}
                    <Route
                      path="/chits"
                      element={
                        <AnimatedPage key="chits">
                          <Suspense fallback={<ChitsPageSkeleton />}>
                            <ChitsPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/chits/create"
                      element={
                        <AnimatedPage key="chits-create">
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <ChitDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/chits/view/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <ChitDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/chits/edit/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <ChitDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />

                    {/* --- MEMBERS ROUTES --- */}
                    <Route
                      path="/members"
                      element={
                        <AnimatedPage key="members">
                          <Suspense fallback={<MembersPageSkeleton />}>
                            <MembersPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/members/create"
                      element={
                        <AnimatedPage key="members-create">
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <MemberDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/members/view/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <MemberDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/members/edit/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <MemberDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />

                    {/* --- COLLECTIONS ROUTES --- */}
                    {/* Redirect old /collections to new Ledger page */}
                    <Route
                      path="/collections"
                      element={<Navigate to="/ledger?tab=collections" replace />}
                    />
                    <Route
                      path="/collections/create"
                      element={
                        <AnimatedPage key="collections-create">
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <CollectionDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/collections/view/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <CollectionDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/collections/edit/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <CollectionDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />

                    {/* --- PAYOUTS ROUTES --- */}
                    {/* Redirect old /payouts to new Ledger page */}
                    <Route
                      path="/payouts"
                      element={<Navigate to="/ledger?tab=payouts" replace />}
                    />
                    <Route
                      path="/payouts/create"
                      element={
                        <AnimatedPage key="payouts-create">
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <PayoutDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/payouts/view/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <PayoutDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/payouts/edit/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <PayoutDetailPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />

                    {/* --- LEDGER ROUTE (Unified Collections + Payouts) --- */}
                    <Route
                      path="/ledger"
                      element={
                        <AnimatedPage key="ledger">
                          <Suspense fallback={<LedgerPageSkeleton />}>
                            <LedgerPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/ledger/create"
                      element={
                        <AnimatedPage key="ledger-create">
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <TransactionDetailsPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />
                    <Route
                      path="/ledger/edit/:id"
                      element={
                        <AnimatedPage key={location.pathname}>
                          <Suspense fallback={<DetailPageSkeleton />}>
                            <TransactionDetailsPage />
                          </Suspense>
                        </AnimatedPage>
                      }
                    />

                    {/* 404 Catch-all for authenticated users */}
                    <Route
                      path="*"
                      element={
                        <Suspense fallback={null}>
                          <NotFoundPage />
                        </Suspense>
                      }
                    />
                  </Route>
                </Route>

                {/* Global 404 Catch-all for unauthenticated users */}
                <Route
                  path="*"
                  element={
                    <Suspense fallback={null}>
                      <NotFoundPage />
                    </Suspense>
                  }
                />
              </Routes>
            </AnimatePresence>
          </div>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
