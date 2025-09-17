// frontend/src/pages/GroupsPage.jsx

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllChitGroups } from "../services/chitsService";
import { useSelector } from "react-redux";
import Message from "../components/ui/Message";
import {
  FiPlus,
  FiLoader,
  FiEdit,
  FiEye,
  FiBarChart2,
  FiSearch,
} from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import StatusBadge from "../components/ui/StatusBadge";

const GroupsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getAllChitGroups(token);
        setGroups(data.groups);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) {
      return groups;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return groups.filter((group) => {
      const nameMatch = group.name.toLowerCase().includes(lowercasedQuery);
      const valueMatch = group.chit_value.toString().includes(lowercasedQuery);
      return nameMatch || valueMatch;
    });
  }, [groups, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Adding one day to the date to fix the timezone issue
    date.setDate(date.getDate() + 1);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-IN", options);
  };

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      className: "text-center",
      cell: (row, index) => index + 1,
    },
    {
      header: "Group Name",
      accessor: "name",
      className: "text-center",
    },
    {
      header: "Chit Value",
      accessor: "chit_value",
      className: "text-center",
      cell: (row) => `₹${row.chit_value.toLocaleString("en-IN")}`,
    },
    {
      header: "Monthly Installment",
      accessor: "monthly_installment",
      className: "text-center",
      cell: (row) => `₹${row.monthly_installment.toLocaleString("en-IN")}`,
    },
    {
      header: "Chit Cycle",
      accessor: "chit_cycle",
      className: "text-center",
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            className="p-2 text-lg rounded-md text-info-accent hover:bg-info-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="View"
          >
            {" "}
            <FiEye />{" "}
          </button>
          <button
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit"
          >
            {" "}
            <FiEdit />{" "}
          </button>
          <button
            className="p-2 text-lg rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Reports"
          >
            {" "}
            <FiBarChart2 />{" "}
          </button>
        </div>
      ),
    },
  ];

  const dummyNavLinkClick = () => {};
  const dummyActiveSection = "groups";
  const dummyLoginClick = () => {};

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection={dummyActiveSection}
          onNavLinkClick={dummyNavLinkClick}
          onLoginClick={dummyLoginClick}
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  My Chit Groups
                </h1>
              </div>
              <hr className="my-4 border-border" />

              {/* --- UPDATED SEARCH BAR --- */}
              <div className="mb-6">
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiSearch className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    type="text"
                    placeholder="Search by name or value..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                  />
                </div>
              </div>
              {/* --- END OF SEARCH BAR --- */}

              {loading && (
                <div className="flex justify-center items-center h-64">
                  <FiLoader className="w-10 h-10 animate-spin text-accent" />
                </div>
              )}

              {error && (
                <Message type="error" title="Error">
                  {error}
                </Message>
              )}

              {!loading && !error && filteredGroups.length === 0 && (
                <Card className="text-center p-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {searchQuery
                      ? "No Matching Groups"
                      : "No Chit Groups Found"}
                  </h2>
                  <p className="text-text-secondary">
                    {searchQuery
                      ? "Try a different search term."
                      : "You don't have any chit groups yet. Click the button below to create one!"}
                  </p>
                </Card>
              )}

              {!loading && !error && filteredGroups.length > 0 && (
                <Table columns={columns} data={filteredGroups} />
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={dummyActiveSection}
        onNavLinkClick={dummyNavLinkClick}
        onLoginClick={dummyLoginClick}
      />
      <BottomNav />
      <Link to="/groups/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <FiPlus className="w-6 h-6" />
        </Button>
      </Link>
    </>
  );
};

export default GroupsPage;
