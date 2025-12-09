// frontend/src/features/dashboard/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users,
  Layers,
  AlertCircle,
  CircleCheck,
  Clock,
  Activity,
  Calendar,
  Loader2,
  Search,
  TrendingUp,
  WalletMinimal,
  ArrowUpRight,
  ArrowDownLeft,
  IndianRupee,
} from "lucide-react";

// --- Layout & UI Imports ---
import Card from "../../../components/ui/Card";
import Table from "../../../components/ui/Table";
import TabButton from "../../../components/ui/TabButton"; // Imported shared component
import { formatCurrency } from "../../../utils/formatters"; // Imported shared utility

import api from "../../../lib/api";

// API calls
const fetchDashboardData = async () => {
  const [chitsRes, membersRes, collectionsRes] = await Promise.all([
    api.get("/chits"),
    api.get("/members"),
    api.get("/collections"),
  ]);

  const chits = chitsRes.data;
  const members = membersRes.data;
  const collections = collectionsRes.data;

  return {
    chits: chits.chits || [],
    members: members.members || [],
    collections: collections.collections || [],
  };
};

// TabButton removed (using shared)

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);

  // isMenuOpen state removed (handled by MainLayout)
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ chits: [], members: [], collections: [] });
  const [stats, setStats] = useState(null);

  // Pending Collection State: 'chit' | 'member'
  const [pendingView, setPendingView] = useState("chit");
  const [pendingSearch, setPendingSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
        calculateStats(dashboardData);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const calculateStats = ({ chits, members, collections }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayStr = today.toISOString().split("T")[0];

    const activeChits = chits.filter((c) => c.status === "Active");

    const monthlyTarget = activeChits.reduce(
      (sum, c) => sum + c.monthly_installment * c.size,
      0
    );

    const monthlyPayouts = activeChits.reduce(
      (sum, c) => sum + c.chit_value,
      0
    );

    const collectedThisMonth = collections.reduce((sum, p) => {
      if (!p.collection_date) return sum;
      const [pYear, pMonth] = p.collection_date.split("-").map(Number);
      if (pYear === currentYear && pMonth - 1 === currentMonth) {
        return sum + (p.amount_paid || 0);
      }
      return sum;
    }, 0);

    const activeMembersCount = members.filter((m) => {
      if (!m.assignments || m.assignments.length === 0) return false;
      return m.assignments.some((a) => {
        return (
          a.chit && a.chit.start_date <= todayStr && a.chit.end_date >= todayStr
        );
      });
    }).length;

    const recentCollections = collections
      .sort((a, b) => new Date(b.collection_date) - new Date(a.collection_date))
      .slice(0, 5);

    const upcomingCount = activeChits.length * 3;

    setStats({
      activeChits: activeChits.length,
      totalChits: chits.length,
      totalMembers: members.length,
      activeMembers: activeMembersCount,
      collectedThisMonth,
      monthlyTarget,
      monthlyPayouts,
      pendingAmount: monthlyTarget - collectedThisMonth,
      recentCollections,
      upcomingCount,
      collectionRate:
        monthlyTarget > 0
          ? ((collectedThisMonth / monthlyTarget) * 100).toFixed(1)
          : 0,
    });
  };

  // --- Helpers for Grouping Pending Data ---
  const getPendingData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let rawPendingList = [];

    data.members.forEach((member) => {
      if (!member.assignments) return;

      member.assignments.forEach((assignment) => {
        if (!assignment.chit || assignment.chit.status !== "Active") return;

        const expectedAmount = assignment.chit.monthly_installment;

        const paidThisMonth = data.collections
          .filter((p) => {
            if (p.chit_assignment_id !== assignment.id) return false;
            const [pYear, pMonth] = p.collection_date.split("-").map(Number);
            return pYear === currentYear && pMonth - 1 === currentMonth;
          })
          .reduce((sum, p) => sum + p.amount_paid, 0);

        if (paidThisMonth < expectedAmount) {
          rawPendingList.push({
            assignmentId: assignment.id,
            memberId: member.id,
            memberName: member.full_name,
            chitId: assignment.chit.id,
            chitName: assignment.chit.name,
            dueAmount: expectedAmount - paidThisMonth,
          });
        }
      });
    });

    // Group By Chit
    const byChit = rawPendingList.reduce((acc, item) => {
      if (!acc[item.chitId]) {
        acc[item.chitId] = {
          id: item.chitId,
          chitName: item.chitName,
          totalDue: 0,
          membersCount: 0,
          members: [],
        };
      }
      acc[item.chitId].totalDue += item.dueAmount;
      acc[item.chitId].membersCount += 1;
      acc[item.chitId].members.push(item);
      return acc;
    }, {});

    // Group By Member
    const byMember = rawPendingList.reduce((acc, item) => {
      if (!acc[item.memberId]) {
        acc[item.memberId] = {
          id: item.memberId,
          memberName: item.memberName,
          totalDue: 0,
          chits: [],
        };
      }
      acc[item.memberId].totalDue += item.dueAmount;
      acc[item.memberId].chits.push(item);
      return acc;
    }, {});

    return {
      byChit: Object.values(byChit),
      byMember: Object.values(byMember),
      totalCount: rawPendingList.length,
    };
  };

  const pendingData = useMemo(() => getPendingData(), [data]);

  // --- Filtered Data for Search ---
  const filteredPendingList = useMemo(() => {
    const query = pendingSearch.toLowerCase();
    if (pendingView === "chit") {
      return pendingData.byChit.filter((group) =>
        group.chitName.toLowerCase().includes(query)
      );
    } else {
      return pendingData.byMember.filter((group) =>
        group.memberName.toLowerCase().includes(query)
      );
    }
  }, [pendingData, pendingView, pendingSearch]);

  // formatCurrency removed (using shared)

  // --- TABLE COLUMNS ---

  const chitColumns = [
    {
      header: "S.No",
      className: "text-center w-16",
      cell: (row, index) => index + 1,
    },
    {
      header: "Chit Group",
      accessor: "chitName",
      className: "text-center font-semibold text-text-primary",
    },
    {
      header: "Pending Members",
      accessor: "membersCount",
      className: "text-center",
      cell: (row) => (
        <span className="font-medium text-text-secondary">
          {row.membersCount}
        </span>
      ),
    },
    {
      header: "Total Due",
      accessor: "totalDue",
      className: "text-center font-bold text-text-primary",
      cell: (row) => formatCurrency(row.totalDue),
    },
  ];

  const memberColumns = [
    {
      header: "S.No",
      className: "text-center w-16",
      cell: (row, index) => index + 1,
    },
    {
      header: "Member Name",
      accessor: "memberName",
      className: "text-center font-semibold text-text-primary",
    },
    {
      header: "Pending In",
      accessor: "chits",
      className: "text-center text-text-secondary text-sm",
      cell: (row) => <span>{row.chits.map((c) => c.chitName).join(", ")}</span>,
    },
    {
      header: "Total Due",
      accessor: "totalDue",
      className: "text-center font-bold text-error-accent",
      cell: (row) => formatCurrency(row.totalDue),
    },
  ];

  // --- Components ---

  const MetricCard = ({ icon: Icon, label, value, subtext, onClick }) => (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br from-accent to-blue-600 p-6 rounded-xl shadow-card text-white flex items-center justify-between min-w-[200px] flex-1 ${onClick
        ? "cursor-pointer hover:shadow-floating hover:-translate-y-1 transition-all duration-300"
        : ""
        }`}
    >
      <div className="flex flex-col z-10">
        <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2 opacity-80">
          {label}
        </p>
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
        {subtext && (
          <p className="text-blue-50 text-xs mt-2 font-medium opacity-90">
            {subtext}
          </p>
        )}
      </div>
      <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white z-10 border border-white/10">
        <Icon className="w-7 h-7" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
    </div>
  );

  const ActivityItem = ({ collection }) => (
    <div
      className="flex items-center justify-between p-3 hover:bg-background-primary rounded-lg transition-colors cursor-pointer border-b border-border/40 last:border-0"
      onClick={() => navigate(`/collections/view/${collection.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-success-bg rounded-full">
          <CircleCheck className="w-4 h-4 text-success-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {collection.member?.full_name || "Unknown"}
          </p>
          <p className="text-xs text-text-secondary">
            {collection.chit?.name || "Unknown Chit"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-success-accent">
          {formatCurrency(collection.amount_paid)}
        </p>
        <p className="text-xs text-text-secondary">
          {new Date(collection.collection_date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, label, onClick, color = "accent" }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 bg-background-secondary rounded-xl border border-border hover:border-${color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
    >
      <div
        className={`p-3 rounded-full bg-${color === "accent" ? "accent" : `${color}-bg`
          }`}
      >
        <Icon
          className={`w-6 h-6 ${color === "accent" ? "text-white" : `text-${color}-accent`
            }`}
        />
      </div>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-primary">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  // Search Bar Visibility Logic
  const showSearchBar =
    (pendingView === "chit" && pendingData.byChit.length >= 2) ||
    (pendingView === "member" && pendingData.byMember.length >= 2);

  return (
    <>

      <div className="container mx-auto space-y-8">
        {/* --- 1. Page Heading --- */}
        <div className="relative flex justify-center items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
            Dashboard
          </h1>
        </div>
        <hr className="my-4 border-border" />

        {/* --- 2. Key Metrics Grid (4 Columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={WalletMinimal}
            label="Monthly Collection"
            value={formatCurrency(stats?.collectedThisMonth)}
            subtext={`Target: ${formatCurrency(stats?.monthlyTarget)}`}
            onClick={() => navigate("/collections")}
          />
          <MetricCard
            icon={TrendingUp}
            label="Monthly Payouts"
            value={formatCurrency(stats?.monthlyPayouts)}
            subtext="Total Liability"
            onClick={() => navigate("/chits")}
          />
          <MetricCard
            icon={Layers}
            label="Active Chits"
            value={stats?.activeChits || 0}
            subtext={`Total Chits: ${stats?.totalChits || 0}`}
            onClick={() => navigate("/chits")}
          />
          <MetricCard
            icon={Users}
            label="Active Members"
            value={stats?.activeMembers || 0}
            subtext={`Total Members: ${stats?.totalMembers || 0}`}
            onClick={() => navigate("/members")}
          />
        </div>

        {/* --- 3. Main Layout Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* SECTION A: Pending Collections */}
            <Card>
              <div className="relative flex justify-center items-center mb-4">
                {/* Icon matches Heading Color */}
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <AlertCircle className="text-text-primary w-6 h-6" />
                  Pending Collections
                </h2>
              </div>
              <hr className="border-border mb-4" />

              {/* Scrollable Tabs */}
              <div className="flex items-center border-b border-border mb-4 overflow-x-auto whitespace-nowrap no-scrollbar">
                <TabButton
                  name="chit"
                  icon={Layers}
                  label="By Chits"
                  activeTab={pendingView}
                  setActiveTab={setPendingView}
                />
                <TabButton
                  name="member"
                  icon={Users}
                  label="By Members"
                  activeTab={pendingView}
                  setActiveTab={setPendingView}
                />
              </div>

              {/* Search Bar - Conditional Rendering */}
              {showSearchBar && (
                <div className="relative w-full sm:max-w-md mb-4">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 top-2.5 h-5 w-px bg-border"></div>
                  <input
                    type="text"
                    placeholder={`Search by ${pendingView === "chit" ? "chit name" : "member name"
                      }...`}
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent text-sm"
                  />
                </div>
              )}

              {/* Content */}
              <div className="max-h-[500px] overflow-y-auto">
                {filteredPendingList.length > 0 ? (
                  <Table
                    columns={
                      pendingView === "chit" ? chitColumns : memberColumns
                    }
                    data={filteredPendingList}
                    variant="secondary"
                  />
                ) : (
                  <EmptyState message="No pending collections." />
                )}
              </div>
            </Card>

            {/* SECTION B: Upcoming Payouts */}
            <Card>
              <div className="relative flex justify-center items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Clock className="text-warning-accent w-6 h-6" />
                  Upcoming Payouts
                </h2>
              </div>
              <hr className="border-border mb-6" />

              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-xl bg-background-primary/50">
                <div className="p-4 bg-background-tertiary rounded-full mb-3">
                  <Calendar className="w-8 h-8 text-text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  No Scheduled Payouts
                </h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  There are no payouts scheduled for the current month
                  based on active chit cycles.
                </p>
              </div>
            </Card>

            {/* SECTION C: Recent Activity */}
            <Card>
              <div className="relative flex justify-center items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Activity className="text-accent w-6 h-6" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => navigate("/collections")}
                  className="absolute right-0 text-sm text-accent hover:underline font-semibold"
                >
                  View All
                </button>
              </div>
              <hr className="border-border mb-4" />

              <div className="space-y-1">
                {stats?.recentCollections?.length > 0 ? (
                  stats.recentCollections.map((collection) => (
                    <ActivityItem
                      key={collection.id}
                      collection={collection}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-text-secondary">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent collections</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card>
              <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
                Quick Actions
              </h2>
              <hr className="border-border mb-6" />
              <div className="grid grid-cols-2 gap-3">
                <QuickAction
                  icon={Layers}
                  label="New Chit"
                  onClick={() => navigate("/chits/create")}
                  color="accent"
                />
                <QuickAction
                  icon={Users}
                  label="Add Member"
                  onClick={() => navigate("/members/create")}
                  color="success"
                />
                <QuickAction
                  icon={WalletMinimal}
                  label="Log Collection"
                  onClick={() => navigate("/collections/create")}
                  color="success"
                />
                <QuickAction
                  icon={Activity}
                  label="View Reports"
                  onClick={() => navigate("/chits")}
                  color="accent"
                />
              </div>
            </Card>

            {/* Alerts & Reminders */}
            <Card>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center justify-center gap-2">
                <AlertCircle className="text-warning-accent w-6 h-6" />
                Reminders
              </h2>
              <hr className="border-border mb-6" />
              <div className="space-y-3">
                <div className="p-3 bg-warning-bg border border-warning-accent/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-warning-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-warning-accent">
                        Pending Collections
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {pendingData.totalCount} members pending this
                        month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-info-bg border border-info-accent/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-info-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-info-accent">
                        Payout Schedule
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {stats?.activeChits || 0} payouts scheduled this
                        month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Summary */}
            <Card>
              <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
                Performance
              </h2>
              <hr className="border-border mb-6" />
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-text-secondary">
                      Collection Rate
                    </span>
                    <span className="text-lg font-bold text-success-accent">
                      {stats?.collectionRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-background-primary rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-success-accent transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          stats?.collectionRate || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-text-secondary">
                    Total Collected
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    {formatCurrency(stats?.collectedThisMonth)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <CircleCheck className="w-12 h-12 text-success-accent mb-3 opacity-80" />
    <p className="text-text-secondary font-medium">{message}</p>
    <p className="text-xs text-text-secondary mt-1 opacity-70">
      Everything is up to date!
    </p>
  </div>
);

export default DashboardPage;
