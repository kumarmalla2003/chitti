// src/components/forms/RapidAssignForm.jsx

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo, // <-- IMPORT
} from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import Table from "../ui/Table"; // <-- IMPORT
import {
  FiUser, // <-- CHANGED from FiUsers
  FiCalendar,
  FiCheck,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import {
  getUnassignedMonths,
  createBulkAssignments,
} from "../../services/assignmentsService";
import { getAllMembers } from "../../services/membersService";

const RapidAssignForm = forwardRef(
  ({ token, groupId, formatDate, onAssignmentSuccess, onBackToList }, ref) => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [availableMonths, setAvailableMonths] = useState([]);
    const [allMembers, setAllMembers] = useState([]);

    const [assignments, setAssignments] = useState({});

    useImperativeHandle(ref, () => ({
      goBack: () => {
        onBackToList();
      },
    }));

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const [monthsData, membersData] = await Promise.all([
            getUnassignedMonths(groupId, token),
            getAllMembers(token),
          ]);
          setAvailableMonths(monthsData.available_months);
          setAllMembers(membersData.members);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [token, groupId]);

    const handleMemberChange = (month, memberId) => {
      setError(null);
      setAssignments((prev) => ({
        ...prev,
        [month]: memberId,
      }));
    };

    const handleConfirmAssignments = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      setIsSubmitting(true);
      setError(null);

      const bulkData = Object.entries(assignments)
        .map(([month, memberId]) => ({
          chit_month: month,
          member_id: parseInt(memberId),
        }))
        .filter((item) => !isNaN(item.member_id) && item.member_id > 0);

      if (bulkData.length === 0) {
        setError("Please assign at least one member to a month.");
        setIsSubmitting(false);
        return;
      }

      const memberIds = bulkData.map((item) => item.member_id);
      const hasDuplicateMembers = new Set(memberIds).size !== memberIds.length;

      if (hasDuplicateMembers) {
        if (
          !window.confirm(
            "Warning: You have assigned the same member to multiple months. Is this correct?"
          )
        ) {
          setIsSubmitting(false);
          return;
        }
      }

      try {
        await createBulkAssignments(groupId, bulkData, token);
        onAssignmentSuccess();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    // --- NEW: Define columns for the table ---
    const columns = useMemo(
      () => [
        {
          header: "Month",
          accessor: "month",
          className: "text-left w-1/2",
          cell: (row) => (
            <div className="flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-text-secondary" />
              <span className="font-medium text-text-primary">
                {formatDate(row.month)}
              </span>
            </div>
          ),
        },
        {
          header: "Member",
          accessor: "member_id",
          className: "w-1/2",
          cell: (row) => (
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiUser className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>
              <select
                id={`month-${row.month}`}
                name={row.month}
                value={assignments[row.month] || ""}
                onChange={(e) => handleMemberChange(row.month, e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select a member...</option>
                {allMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          ),
        },
      ],
      [allMembers, assignments, formatDate] // Dependencies for memo
    );

    // --- NEW: Map months to table data ---
    const tableData = useMemo(
      () => availableMonths.map((month) => ({ month })),
      [availableMonths]
    );

    if (loading) {
      return (
        <div className="flex justify-center p-8">
          <FiLoader className="w-8 h-8 animate-spin text-accent" />
        </div>
      );
    }

    if (error) {
      return (
        <Message type="error" onClose={() => setError(null)}>
          {error}
        </Message>
      );
    }

    if (availableMonths.length === 0) {
      return (
        <div className="text-center py-8">
          <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No available months to assign in this group.
          </p>
        </div>
      );
    }

    if (allMembers.length === 0) {
      return (
        <div className="text-center py-8">
          <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No members exist in the system. Please add members first.
          </p>
        </div>
      );
    }

    // --- MODIFIED: Return the Table-based form ---
    return (
      <form className="my-4" onSubmit={handleConfirmAssignments}>
        <Table columns={columns} data={tableData} variant="secondary" />

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting}
            className="flex items-center justify-center"
          >
            {isSubmitting ? (
              <FiLoader className="animate-spin" />
            ) : (
              <>
                <FiCheck className="mr-2" /> Save All Assignments
              </>
            )}
          </Button>
        </div>
      </form>
    );
    // --- END MODIFICATION ---
  }
);

export default RapidAssignForm;
