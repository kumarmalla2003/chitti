// frontend/src/pages/MemberDetailPage.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import MemberDetailsForm from "../components/forms/MemberDetailsForm";
import StatusBadge from "../components/ui/StatusBadge";
import Button from "../components/ui/Button";
import Message from "../components/ui/Message";
import {
  getMemberById,
  createMember,
  updateMember,
} from "../services/membersService";
import { getAllChitGroups } from "../services/chitsService";
import {
  getUnassignedMonths,
  createAssignment,
  getAssignmentsForMember,
} from "../services/assignmentsService";
import { RupeeIcon } from "../components/ui/Icons";
import {
  FiLoader,
  FiUser,
  FiBox,
  FiArrowLeft,
  FiPlus,
  FiCalendar,
  FiUsers,
  FiChevronUp,
  FiEdit,
} from "react-icons/fi";

// --- Helper Components (Extracted) ---

const DetailsSection = ({
  mode,
  formData,
  onFormChange,
  handleDetailsSubmit,
  error,
  success,
}) => (
  <Card>
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <FiUser /> Member Details
    </h2>
    <hr className="border-border mb-4" />
    <MemberDetailsForm
      mode={mode}
      formData={formData}
      onFormChange={onFormChange}
      onFormSubmit={handleDetailsSubmit}
      error={error && error.context === "details" ? error.message : null}
      success={success}
    />
  </Card>
);

const AssignmentsSection = ({
  mode,
  assignments,
  showAssignForm,
  setShowAssignForm,
  handleAssignmentSubmit,
  error,
  setError,
  selectedGroupId,
  setSelectedGroupId,
  groups,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  assignmentLoading,
  formatDate,
}) => (
  <Card>
    <div className="relative flex justify-center items-center mb-2">
      <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
        <FiBox /> Chit Assignments
      </h2>
      {mode !== "create" && (
        <div className="absolute right-0">
          <Button
            variant="secondary"
            onClick={() => setShowAssignForm((p) => !p)}
          >
            {showAssignForm ? <FiChevronUp /> : <FiPlus />}
          </Button>
        </div>
      )}
    </div>
    <hr className="border-border mb-4" />
    {mode !== "create" && assignments.length > 0 && (
      <div className="space-y-3 mb-6">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="p-3 bg-background-primary rounded-md border border-border flex justify-between items-center"
          >
            <div>
              <p className="font-bold text-text-primary">{a.chit_group.name}</p>
              <p className="text-sm text-text-secondary">
                {formatDate(a.chit_month)}
              </p>
            </div>
            <StatusBadge status={a.chit_group.status} />
          </div>
        ))}
      </div>
    )}
    {mode !== "create" && assignments.length === 0 && !showAssignForm && (
      <p className="text-center text-text-secondary py-4">
        This member has no active assignments.
      </p>
    )}
    {showAssignForm && (
      <form onSubmit={handleAssignmentSubmit} className="space-y-6">
        {error && error.context === "assignment" && (
          <Message type="error" onClose={() => setError(null)}>
            {error.message}
          </Message>
        )}
        <div>
          <label
            htmlFor="chit_group"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Active Chit Group
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiUsers className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <select
              id="chit_group"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              <option value="">Select an active group...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} - (₹{group.chit_value.toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="chit_month"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Chit Month
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiCalendar className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <select
              id="chit_month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
              disabled={!selectedGroupId || availableMonths.length === 0}
            >
              <option value="">
                {selectedGroupId
                  ? availableMonths.length > 0
                    ? "Select an available month..."
                    : "No available months"
                  : "Select a group first"}
              </option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatDate(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {mode !== "create" && (
          <Button
            type="submit"
            className="w-full"
            variant="success"
            disabled={assignmentLoading}
          >
            {assignmentLoading ? (
              <FiLoader className="animate-spin mx-auto" />
            ) : (
              <>
                <FiPlus className="inline mr-2" />
                Assign Member
              </>
            )}
          </Button>
        )}
      </form>
    )}
  </Card>
);

const PaymentsSection = ({ children }) => (
  <Card>
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <RupeeIcon className="w-5 h-5" /> Payments
    </h2>
    <hr className="border-border mb-4" />
    <div className="text-center text-text-secondary py-8">
      This feature is coming soon!
    </div>
    {children}
  </Card>
);

// --- Main Page Component ---

const MemberDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
  });
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchMemberAndAssignments = async () => {
    if (!id) return;
    setPageLoading(true);
    try {
      const [memberData, assignmentsData] = await Promise.all([
        getMemberById(id, token),
        getAssignmentsForMember(id, token),
      ]);
      setFormData({
        full_name: memberData.full_name,
        phone_number: memberData.phone_number,
      });
      setAssignments(assignmentsData);
    } catch (err) {
      setError({ context: "page", message: err.message });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    if (isCreate) {
      setMode("create");
      setPageLoading(false);
      setShowAssignForm(true);
    } else if (isEdit) {
      setMode("edit");
      fetchMemberAndAssignments();
    } else {
      setMode("view");
      fetchMemberAndAssignments();
    }
  }, [id, location.pathname, token]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (token) {
        try {
          const data = await getAllChitGroups(token);
          const activeGroups = data.groups.filter((g) => g.status === "Active");
          setGroups(activeGroups);
        } catch (err) {
          console.error("Failed to load chit groups:", err);
        }
      }
    };
    fetchGroups();
  }, [token]);

  useEffect(() => {
    if (!selectedGroupId) {
      setAvailableMonths([]);
      setSelectedMonth("");
      return;
    }
    const fetchMonths = async () => {
      try {
        const data = await getUnassignedMonths(selectedGroupId, token);
        setAvailableMonths(data.available_months);
      } catch (err) {
        setError({ context: "assignment", message: err.message });
      }
    };
    fetchMonths();
  }, [selectedGroupId, token]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phone_number") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleDetailsSubmit = async (currentFormData) => {
    setError(null);
    setSuccess(null);
    setDetailsLoading(true);
    try {
      let memberId = id;
      let successMessage = "";
      if (mode === "create") {
        const newMember = await createMember(currentFormData, token);
        memberId = newMember.id;
        successMessage = "Member created successfully!";
        if (newMember.id && selectedGroupId && selectedMonth) {
          await createAssignment(
            {
              member_id: newMember.id,
              chit_group_id: parseInt(selectedGroupId),
              chit_month: selectedMonth,
            },
            token
          );
          successMessage += " And assigned to the chit group.";
        }
        setSuccess(successMessage);
        setTimeout(() => navigate(`/members/view/${newMember.id}`), 1500);
      } else {
        const updatedMember = await updateMember(id, currentFormData, token);
        setFormData({
          full_name: updatedMember.full_name,
          phone_number: updatedMember.phone_number,
        });
        setSuccess("Member details updated successfully!");
        setTimeout(() => navigate(`/members/view/${id}`), 1500);
      }
    } catch (err) {
      setError({ context: "details", message: err.message });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedMonth) {
      setError({
        context: "assignment",
        message: "Please select both a group and a month.",
      });
      return;
    }
    setError(null);
    setSuccess(null);
    setAssignmentLoading(true);
    try {
      await createAssignment(
        {
          member_id: parseInt(id),
          chit_group_id: parseInt(selectedGroupId),
          chit_month: selectedMonth,
        },
        token
      );
      setSuccess("Member successfully assigned to new chit group.");
      setSelectedGroupId("");
      setSelectedMonth("");
      setShowAssignForm(false);
      await fetchMemberAndAssignments();
    } catch (err) {
      setError({ context: "assignment", message: err.message });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "create") return "Create New Member";
    if (mode === "edit") return "Edit Member";
    return formData.full_name || "Member Details";
  };

  const formatDate = (
    dateString,
    options = { year: "numeric", month: "long" }
  ) => {
    const date = new Date(dateString);
    date.setUTCDate(date.getUTCDate() + 1); // Adjust for timezone display issue
    return date.toLocaleDateString("en-IN", options);
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  const TabButton = ({ name, icon, label }) => {
    const isActive = activeTab === name;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(name)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${
          isActive
            ? "bg-background-secondary text-accent border-b-2 border-accent"
            : "text-text-secondary hover:bg-background-tertiary"
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  const SubmitButton = () =>
    mode !== "view" && (
      <Button
        type="submit"
        form="member-details-form"
        variant={mode === "create" ? "success" : "warning"}
        disabled={detailsLoading}
      >
        {detailsLoading ? (
          <FiLoader className="animate-spin mx-auto" />
        ) : mode === "create" ? (
          <>
            <FiPlus className="inline mr-2" />
            Create Member
          </>
        ) : (
          <>
            <FiEdit className="inline mr-2" />
            Update Member
          </>
        )}
      </Button>
    );

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
              <div className="relative flex justify-center items-center mb-4">
                <Link
                  to="/members"
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
                  {getTitle()}
                </h1>
              </div>
              <hr className="my-4 border-border" />
              {error && error.context === "page" && !pageLoading && (
                <Message type="error">{error.message}</Message>
              )}
              <div className="w-full max-w-2xl mx-auto md:hidden">
                <div className="flex items-center border-b border-border mb-6">
                  <TabButton name="details" icon={<FiUser />} label="Details" />
                  <TabButton
                    name="assignments"
                    icon={<FiBox />}
                    label="Assignments"
                  />
                  <TabButton
                    name="payments"
                    icon={<RupeeIcon className="w-4 h-4" />}
                    label="Payments"
                  />
                </div>
                {activeTab === "details" && (
                  <DetailsSection
                    mode={mode}
                    formData={formData}
                    onFormChange={handleFormChange}
                    handleDetailsSubmit={handleDetailsSubmit}
                    error={error}
                    success={success}
                  />
                )}
                {activeTab === "assignments" && (
                  <AssignmentsSection
                    mode={mode}
                    assignments={assignments}
                    showAssignForm={showAssignForm}
                    setShowAssignForm={setShowAssignForm}
                    handleAssignmentSubmit={handleAssignmentSubmit}
                    error={error}
                    setError={setError}
                    selectedGroupId={selectedGroupId}
                    setSelectedGroupId={setSelectedGroupId}
                    groups={groups}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    availableMonths={availableMonths}
                    assignmentLoading={assignmentLoading}
                    formatDate={formatDate}
                  />
                )}
                {activeTab === "payments" && (
                  <PaymentsSection>
                    <div className="mt-8">
                      <SubmitButton />
                    </div>
                  </PaymentsSection>
                )}
              </div>
              <div className="hidden md:block">
                <div className="space-y-8">
                  <DetailsSection
                    mode={mode}
                    formData={formData}
                    onFormChange={handleFormChange}
                    handleDetailsSubmit={handleDetailsSubmit}
                    error={error}
                    success={success}
                  />
                  <AssignmentsSection
                    mode={mode}
                    assignments={assignments}
                    showAssignForm={showAssignForm}
                    setShowAssignForm={setShowAssignForm}
                    handleAssignmentSubmit={handleAssignmentSubmit}
                    error={error}
                    setError={setError}
                    selectedGroupId={selectedGroupId}
                    setSelectedGroupId={setSelectedGroupId}
                    groups={groups}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    availableMonths={availableMonths}
                    assignmentLoading={assignmentLoading}
                    formatDate={formatDate}
                  />
                  <PaymentsSection />
                </div>
                <div className="mt-8 flex justify-end">
                  <SubmitButton />
                </div>
              </div>
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
    </>
  );
};

export default MemberDetailPage;
