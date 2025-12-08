// frontend/src/routes.js
import { lazy } from "react";

// Lazy load pages
const HomePage = lazy(() => import("./pages/HomePage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const ChitsPage = lazy(() => import("./features/chits/pages/ChitsPage"));
const ChitDetailPage = lazy(() => import("./features/chits/pages/ChitDetailPage"));

const MembersPage = lazy(() => import("./features/members/pages/MembersPage"));
const MemberDetailPage = lazy(() => import("./features/members/pages/MemberDetailPage"));

const CollectionsPage = lazy(() => import("./features/collections/pages/CollectionsPage"));
const CollectionDetailPage = lazy(() => import("./features/collections/pages/CollectionDetailPage"));

const PayoutsPage = lazy(() => import("./features/payouts/pages/PayoutsPage"));
const PayoutDetailPage = lazy(() => import("./features/payouts/pages/PayoutDetailPage"));

const routes = [
  {
    path: "/",
    element: HomePage,
    protected: false,
  },
  {
    path: "/dashboard",
    element: DashboardPage,
    protected: true,
  },
  // --- CHITS ---
  {
    path: "/chits",
    element: ChitsPage,
    protected: true,
  },
  {
    path: "/chits/create",
    element: ChitDetailPage,
    protected: true,
  },
  {
    path: "/chits/view/:id",
    element: ChitDetailPage,
    protected: true,
  },
  {
    path: "/chits/edit/:id",
    element: ChitDetailPage,
    protected: true,
  },
  // --- MEMBERS ---
  {
    path: "/members",
    element: MembersPage,
    protected: true,
  },
  {
    path: "/members/create",
    element: MemberDetailPage,
    protected: true,
  },
  {
    path: "/members/view/:id",
    element: MemberDetailPage,
    protected: true,
  },
  {
    path: "/members/edit/:id",
    element: MemberDetailPage,
    protected: true,
  },
  // --- COLLECTIONS ---
  {
    path: "/collections",
    element: CollectionsPage,
    protected: true,
  },
  {
    path: "/collections/create",
    element: CollectionDetailPage,
    protected: true,
  },
  {
    path: "/collections/view/:id",
    element: CollectionDetailPage,
    protected: true,
  },
  {
    path: "/collections/edit/:id",
    element: CollectionDetailPage,
    protected: true,
  },
  // --- PAYOUTS ---
  {
    path: "/payouts",
    element: PayoutsPage,
    protected: true,
  },
  {
    path: "/payouts/create",
    element: PayoutDetailPage,
    protected: true,
  },
  {
    path: "/payouts/view/:id",
    element: PayoutDetailPage,
    protected: true,
  },
  {
    path: "/payouts/edit/:id",
    element: PayoutDetailPage,
    protected: true,
  },
];

export default routes;
