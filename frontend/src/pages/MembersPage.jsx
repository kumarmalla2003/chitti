// frontend/src/pages/MembersPage.jsx

import { useState, useEffect, useMemo } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAllMembers, deleteMember } from "../services/membersService";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Message from "../components/ui/Message";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import {
  FiPlus,
  FiLoader,
  FiSearch,
  FiEye,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";

const MembersPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { token } = useSelector((state) => state.auth);

  // State for delete confirmation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Auto-scroll to top when messages change
  useScrollToTop(success || error);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getAllMembers(token);
        setMembers(data.members);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchMembers();
    }
  }, [token]);

  // Handle success message from navigation state
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleDeleteClick = (member) => {
    setItemToDelete(member);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteMember(itemToDelete.id, token);
      setMembers((prevMembers) =>
        prevMembers.filter((m) => m.id !== itemToDelete.id)
      );
      setSuccess(`Member "${itemToDelete.full_name}" has been deleted.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowercasedQuery = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(lowercasedQuery) ||
        member.phone_number.includes(lowercasedQuery)
    );
  }, [members, searchQuery]);

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      className: "text-center",
      cell: (row, index) => index + 1,
    },
    {
      header: "Full Name",
      accessor: "full_name",
      className: "text-left",
    },
    {
      header: "Phone Number",
      accessor: "phone_number",
      className: "text-center",
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <Link
            to={`/members/view/${row.id}`}
            className="p-2 text-lg rounded-md text-info-accent hover:bg-info-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="View Details"
          >
            <FiEye />
          </Link>
          <Link
            to={`/members/edit/${row.id}`}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit Member"
          >
            <FiEdit />
          </Link>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Delete Member"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection="members"
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  All Members
                </h1>
              </div>
              <hr className="my-4 border-border" />

              {/* Success/Error Messages */}
              {success && <Message type="success">{success}</Message>}
              {error && (
                <Message type="error" onClose={() => setError(null)}>
                  {error}
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
                    placeholder="Search by name or phone number..."
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

              {!loading && !error && filteredMembers.length === 0 && (
                <Card className="text-center p-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {searchQuery ? "No Matching Members" : "No Members Found"}
                  </h2>
                  <p className="text-text-secondary">
                    {searchQuery
                      ? "Try a different search term."
                      : "You haven't added any members yet. Click the button below to create one!"}
                  </p>
                </Card>
              )}

              {!loading && !error && filteredMembers.length > 0 && (
                <Table columns={columns} data={filteredMembers} />
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection="members"
      />
      <BottomNav />
      <Link to="/members/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <FiPlus className="w-6 h-6" />
        </Button>
      </Link>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Member?"
        message={`Are you sure you want to permanently delete "${itemToDelete?.full_name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default MembersPage;
