// frontend/src/pages/GroupsPage.jsx

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAllChitGroups } from "../services/chitsService";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
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
import CreateGroupModal from "../components/groups/CreateGroupModal";
import useScreenSize from "../hooks/useScreenSize";

const GroupsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { token } = useSelector((state) => state.auth);
  const isDesktop = useScreenSize();

  // --- ADD THIS useEffect HOOK ---
  useEffect(() => {
    // Add/remove class from body to prevent background scrolling
    if (isModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup function to remove the class when the component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isModalOpen]);
  // --- END OF NEW HOOK ---

  const fetchGroups = async () => {
    try {
      if (groups.length === 0) setLoading(true);
      const data = await getAllChitGroups(token);
      setGroups(data.groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const handleGroupCreated = () => {
    setSuccess("New chit group has been created successfully!");
    fetchGroups();
  };

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
          <Link
            to={`/groups/view/${row.id}`}
            className="p-2 text-lg rounded-md text-info-accent hover:bg-info-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="View"
          >
            <FiEye />
          </Link>
          <Link
            to={`/groups/edit/${row.id}`}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit"
          >
            <FiEdit />
          </Link>
          <button
            className="p-2 text-lg rounded-md text-success-accent hover:bg-success-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Reports"
          >
            <FiBarChart2 />
          </button>
        </div>
      ),
    },
  ];

  const Fab = () => {
    const fabProps = {
      variant: "fab",
      className: "group-hover:scale-110",
      children: <FiPlus className="w-6 h-6" />,
    };

    if (isDesktop) {
      return <Button onClick={() => setIsModalOpen(true)} {...fabProps} />;
    }

    return (
      <Link to="/groups/create" className="group">
        <Button {...fabProps} />
      </Link>
    );
  };

  return (
    <>
      <div
        className={`transition-all duration-300 ${
          isMenuOpen || isModalOpen ? "blur-sm" : ""
        }`}
      >
        <Header onMenuOpen={() => setIsMenuOpen(true)} activeSection="groups" />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  My Chit Groups
                </h1>
              </div>
              <hr className="my-4 border-border" />
              {success && (
                <Message
                  type="success"
                  title="Success"
                  onClose={() => setSuccess(null)}
                >
                  {success}
                </Message>
              )}
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
              {loading && (
                <div className="flex justify-center items-center h-64">
                  <FiLoader className="w-10 h-10 animate-spin text-accent" />
                </div>
              )}
              {error && (
                <Message
                  type="error"
                  title="Error"
                  onClose={() => setError(null)}
                >
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
        activeSection="groups"
      />
      <BottomNav />
      <Fab />
      {isDesktop && (
        <CreateGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </>
  );
};

export default GroupsPage;
