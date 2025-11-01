// frontend/src/components/forms/AssignExistingGroupForm.jsx

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import Table from "../ui/Table";
import { FiSearch, FiCheck, FiLoader, FiCalendar } from "react-icons/fi";
import { getAllChitGroups } from "../../services/chitsService";
import { getUnassignedMonths } from "../../services/assignmentsService";

const AssignExistingGroupForm = forwardRef(
  (
    {
      token,
      memberId,
      onAssignment,
      formatDate,
      existingAssignments,
      onGroupNameChange,
      onBackToList,
    },
    ref
  ) => {
    const [allGroups, setAllGroups] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedGroup, setSelectedGroup] = useState(null);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");

    const [assignmentLoading, setAssignmentLoading] = useState(false);

    // --- Expose goBack function (unchanged) ---
    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (selectedGroup) {
          setSelectedGroup(null);
          onGroupNameChange("");
        } else {
          onBackToList();
        }
      },
    }));

    // --- useEffects (unchanged) ---
    useEffect(() => {
      const fetchAllGroups = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getAllChitGroups(token);
          const activeGroups = data.groups.filter((g) => g.status === "Active");
          setAllGroups(activeGroups);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllGroups();
    }, [token]);

    useEffect(() => {
      if (!selectedGroup) return;

      const fetchMonths = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getUnassignedMonths(selectedGroup.id, token);
          setAvailableMonths(data.available_months);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchMonths();
    }, [selectedGroup, token]);

    // --- Memos and Handlers (unchanged) ---
    const filteredGroups = useMemo(() => {
      if (!searchQuery) return allGroups;
      const lowercasedQuery = searchQuery.toLowerCase();
      return allGroups.filter(
        (group) =>
          group.name.toLowerCase().includes(lowercasedQuery) ||
          group.chit_value.toString().includes(lowercasedQuery)
      );
    }, [allGroups, searchQuery]);

    const handleSelectClick = (group) => {
      setSelectedGroup(group);
      onGroupNameChange(group.name);
      setSelectedMonth("");
    };

    const handleConfirmAssignment = async (e) => {
      e.preventDefault();
      if (!selectedMonth) {
        setError("Please select a month to assign.");
        return;
      }
      setAssignmentLoading(true);
      await onAssignment({
        member_id: memberId,
        chit_group_id: selectedGroup.id,
        chit_month: selectedMonth,
      });
      setAssignmentLoading(false);
    };

    const getExistingAssignmentsForGroup = (groupId) => {
      if (!existingAssignments) return [];
      return existingAssignments.filter((a) => a.chit_group.id === groupId);
    };

    const columns = [
      {
        header: "S.No",
        cell: (row, index) => index + 1,
        className: "text-center",
      },
      {
        header: "Group Name",
        accessor: "name",
        className: "text-left",
      },
      {
        header: "Chit Value",
        accessor: "chit_value",
        cell: (row) => `₹${row.chit_value.toLocaleString("en-IN")}`,
        className: "text-center",
      },
      {
        header: "Existing",
        className: "text-center",
        cell: (row) => {
          const existing = getExistingAssignmentsForGroup(row.id);
          if (existing.length === 0) return "-";
          return (
            <span className="text-xs text-info-accent">
              {existing.length} month{existing.length > 1 ? "s" : ""}
            </span>
          );
        },
      },
      {
        header: "Action",
        className: "text-center",
        cell: (row) => (
          <Button type="button" onClick={() => handleSelectClick(row)}>
            Select
          </Button>
        ),
      },
    ];

    if (selectedGroup) {
      const existingInGroup = getExistingAssignmentsForGroup(selectedGroup.id);

      return (
        <form className="my-4" onSubmit={handleConfirmAssignment}>
          {error && (
            <Message type="error" onClose={() => setError(null)}>
              {error}
            </Message>
          )}

          <h3 className="text-lg font-semibold text-text-primary mb-2 text-center">
            Assign Month in {selectedGroup.name}
          </h3>

          {/* --- MODIFIED: Info Message Removed --- */}

          {existingInGroup.length > 0 && (
            <div
              className={`${
                existingInGroup.length > 0 ? "mt-4" : ""
              } p-3 bg-info-bg border-l-4 border-info-accent rounded`}
            >
              <p className="text-sm text-info-accent">
                <strong>Note:</strong> Member already assigned to this group
                for:{" "}
                {existingInGroup.map((a, idx) => (
                  <span key={a.id}>
                    {formatDate(a.chit_month)}
                    {idx < existingInGroup.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}

          <div className="relative flex items-center mt-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiCalendar className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={loading}
              autoFocus
            >
              <option value="">
                {loading
                  ? "Loading months..."
                  : availableMonths.length > 0
                  ? "Select an available month..."
                  : "No available months"}
              </option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatDate(month)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              variant="success"
              disabled={!selectedMonth || assignmentLoading}
              className="flex items-center justify-center"
            >
              {assignmentLoading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  <FiCheck className="mr-2" /> Confirm Assignment
                </>
              )}
            </Button>
          </div>
        </form>
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
            placeholder="Search by name or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
          />
        </div>

        {loading && (
          <div className="flex justify-center p-4">
            <FiLoader className="animate-spin text-accent" />
          </div>
        )}

        {!loading && filteredGroups.length === 0 && (
          <p className="text-center text-text-secondary py-4">
            {searchQuery
              ? `No matching groups found.`
              : "No active groups are available."}
          </p>
        )}

        {!loading && filteredGroups.length > 0 && (
          <Table columns={columns} data={filteredGroups} variant="secondary" />
        )}
      </div>
    );
  }
);

export default AssignExistingGroupForm;
