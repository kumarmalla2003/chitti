// frontend/src/components/forms/AssignExistingMemberForm.jsx

import { useState, useEffect, useMemo } from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import Table from "../ui/Table";
import { FiSearch, FiCheck, FiLoader, FiCalendar } from "react-icons/fi";
import { getAllMembers } from "../../services/membersService";

const AssignExistingMemberForm = ({
  token,
  groupId,
  availableMonths,
  onAssignment,
  formatDate,
  assignedMemberIds,
  onMemberNameChange, // New prop
}) => {
  const [allMembers, setAllMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const fetchAllMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllMembers(token);
        setAllMembers(data.members);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllMembers();
  }, [token, assignedMemberIds]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return allMembers;
    const lowercasedQuery = searchQuery.toLowerCase();
    return allMembers.filter(
      (member) =>
        member.full_name.toLowerCase().includes(lowercasedQuery) ||
        member.phone_number.includes(lowercasedQuery)
    );
  }, [allMembers, searchQuery]);

  const handleSelectClick = (member) => {
    setSelectedMember(member);
    onMemberNameChange(member.full_name); // Update parent's state
    setSelectedMonth(""); // Reset month selection
  };

  const handleConfirmAssignment = () => {
    if (!selectedMonth) {
      setError("Please select a month to assign.");
      return;
    }
    onAssignment({
      member_id: selectedMember.id,
      chit_group_id: groupId,
      chit_month: selectedMonth,
    });
  };

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
      header: "Action",
      accessor: "action",
      className: "text-center",
      cell: (row) => (
        <Button type="button" size="sm" onClick={() => handleSelectClick(row)}>
          Select
        </Button>
      ),
    },
  ];

  if (selectedMember) {
    return (
      <div className="my-4">
        {/* The title is now handled by the parent, but you can keep this as a sub-header if you like */}
        <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
          Assign Month for {selectedMember.full_name}
        </h3>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiCalendar className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select an available month...</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatDate(month)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end mt-6">
          <Button
            type="button"
            variant="success"
            onClick={handleConfirmAssignment}
            disabled={!selectedMonth}
            className="flex items-center justify-center"
          >
            <FiCheck className="mr-2" /> Confirm Assignment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      {error && (
        <Message type="error" onClose={() => setError(null)}>
          {error}
        </Message>
      )}

      <div className="relative flex items-center mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <FiSearch className="w-5 h-5 text-text-secondary" />
        </span>
        <div className="absolute left-10 h-6 w-px bg-border"></div>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
        />
      </div>

      {loading && (
        <div className="flex justify-center p-4">
          <FiLoader className="animate-spin" />
        </div>
      )}

      {!loading && filteredMembers.length === 0 && (
        <p className="text-center text-text-secondary py-4">
          {searchQuery
            ? `No members found for "${searchQuery}".`
            : "There are no unassigned members available."}
        </p>
      )}

      {!loading && filteredMembers.length > 0 && (
        <Table columns={columns} data={filteredMembers} variant="secondary" />
      )}
    </div>
  );
};

export default AssignExistingMemberForm;
