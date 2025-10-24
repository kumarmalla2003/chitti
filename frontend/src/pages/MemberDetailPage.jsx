// frontend/src/pages/MemberDetailPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MemberDetailsForm from "../components/forms/MemberDetailsForm";
import StatusBadge from "../components/ui/StatusBadge";
import Message from "../components/ui/Message";
import StepperButtons from "../components/ui/StepperButtons";
import {
  getMemberById,
  createMember,
  patchMember, // Using patch instead of update
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
const DetailsSection = ({ mode, formData, onFormChange }) => (
  <Card className="h-full">
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <FiUser /> Member Details
    </h2>
    <hr className="border-border mb-4" />
    <MemberDetailsForm
      mode={mode}
      formData={formData}
      onFormChange={onFormChange}
    />
  </Card>
);

const ChitsSection = ({
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
  createdMemberId,
}) => (
  <Card className="flex-1 flex flex-col">
    <div className="relative flex justify-center items-center mb-2">
      <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
        <FiBox /> Chits
      </h2>
      {(mode === "edit" || (mode === "create" && createdMemberId)) && (
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
    <div className="flex-grow">
      {mode !== "create" && assignments.length > 0 && (
        <div className="space-y-3 mb-6">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="p-3 bg-background-primary rounded-md border border-border flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-text-primary">
                  {a.chit_group.name}
                </p>
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
        </form>
      )}
    </div>
  </Card>
);

const PaymentsSection = () => (
  <Card className="flex-1 flex flex-col">
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <RupeeIcon className="w-5 h-5" /> Payments
    </h2>
    <hr className="border-border mb-4" />
    <div className="flex-grow flex items-center justify-center text-center text-text-secondary py-8">
      This feature is coming soon!
    </div>
  </Card>
);

const DesktopActionButton = ({ mode, loading }) => {
  if (mode === "view") return null;
  return (
    <div className="md:col-start-2 md:flex md:justify-end">
      <Button
        type="submit"
        form="member-details-form-desktop"
        variant={mode === "create" ? "success" : "warning"}
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? (
          <FiLoader className="animate-spin mx-auto" />
        ) : mode === "create" ? (
          <>
            <FiPlus className="inline-block mr-2" />
            Create Member
          </>
        ) : (
          <>
            <FiEdit className="inline-block mr-2" />
            Update Member
          </>
        )}
      </Button>
    </div>
  );
};

const TabButton = ({
  name,
  icon,
  label,
  activeTab,
  setActiveTab,
  disabled,
}) => {
  const isActive = activeTab === name;
  return (
    <button
      type="button"
      onClick={() => !disabled && setActiveTab(name)}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${
        isActive
          ? "bg-background-secondary text-accent border-b-2 border-accent"
          : "text-text-secondary hover:bg-background-tertiary"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// --- Extracted MobileContent Component ---
const MobileContent = ({
  TABS,
  activeTab,
  setActiveTab,
  mode,
  createdMemberId,
  formData,
  onFormChange,
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
  activeTabIndex,
  isDetailsFormValid,
  detailsLoading,
  handleNext,
  handleMiddle, // <-- UPDATED PROP NAME
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto md:hidden">
      <div className="flex items-center border-b border-border mb-6">
        <TabButton
          name="details"
          icon={<FiUser />}
          label="Details"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          name="chits"
          icon={<FiBox />}
          label="Chits"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !createdMemberId}
        />
        <TabButton
          name="payments"
          icon={<RupeeIcon className="w-4 h-4" />}
          label="Payments"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !createdMemberId}
        />
      </div>
      {activeTab === "details" && (
        <DetailsSection
          mode={mode}
          formData={formData}
          onFormChange={onFormChange}
        />
      )}
      {activeTab === "chits" && (
        <ChitsSection
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
          createdMemberId={createdMemberId}
        />
      )}
      {activeTab === "payments" && <PaymentsSection />}
      {mode !== "view" && (
        <StepperButtons
          currentStep={activeTabIndex}
          totalSteps={TABS.length}
          onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
          onNext={handleNext}
          onMiddle={handleMiddle}
          isNextDisabled={activeTabIndex === 0 && !isDetailsFormValid}
          loading={detailsLoading || assignmentLoading}
          mode={mode}
        />
      )}
    </div>
  );
};

// --- Main Page Component ---
const MemberDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({ full_name: "", phone_number: "" });
  const [originalData, setOriginalData] = useState(null);
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
  const [createdMemberId, setCreatedMemberId] = useState(null);

  const TABS = ["details", "chits", "payments"];
  const activeTabIndex = TABS.indexOf(activeTab);

  const isDetailsFormValid = useMemo(
    () =>
      formData.full_name.trim() !== "" &&
      formData.phone_number.trim().length === 10,
    [formData]
  );

  const fetchMemberAndAssignments = async () => {
    if (!id) return;
    setPageLoading(true);
    try {
      const [memberData, assignmentsData] = await Promise.all([
        getMemberById(id, token),
        getAssignmentsForMember(id, token),
      ]);
      const fetchedData = {
        full_name: memberData.full_name,
        phone_number: memberData.phone_number,
      };
      setFormData(fetchedData);
      setOriginalData(fetchedData);
      setAssignments(assignmentsData);
    } catch (err) {
      setError({ message: err.message, context: "page" });
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
    if (mode === "create" || mode === "edit") {
      fetchGroups();
    }
  }, [token, mode]);

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus({ preventScroll: true });
    }
  }, [activeTab]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setError(null);
    setSuccess(null);
    let processedValue = value;
    if (name === "phone_number") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleMobileFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Determine which action to take based on current step
    if (activeTabIndex === TABS.length - 1) {
      // Last step: Finish/Update action
      handleFinalAction();
    } else if (mode === "create" && activeTabIndex === 0) {
      // First step in create mode: Save & Next
      await handleDetailsSubmit();
    } else {
      // All other cases: Just navigate to next tab
      if (activeTabIndex < TABS.length - 1) {
        setActiveTab(TABS[activeTabIndex + 1]);
      }
    }
  };

  const handleDetailsSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);
    setDetailsLoading(true);
    try {
      if (mode === "create") {
        const newMember = await createMember(formData, token);
        setSuccess("Member details saved. You can now assign them to a chit.");
        setCreatedMemberId(newMember.id);
        setActiveTab("chits");
      } else {
        // 'edit' mode
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }
        if (Object.keys(changes).length > 0) {
          await patchMember(id, changes, token);
        }
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
    const memberIdToAssign = mode === "create" ? createdMemberId : parseInt(id);
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
          member_id: memberIdToAssign,
          chit_group_id: parseInt(selectedGroupId),
          chit_month: selectedMonth,
        },
        token
      );
      setSuccess("Member successfully assigned to new chit group.");
      setSelectedGroupId("");
      setSelectedMonth("");
      setShowAssignForm(false);
      const assignmentsData = await getAssignmentsForMember(
        memberIdToAssign,
        token
      );
      setAssignments(assignmentsData);
    } catch (err) {
      setError({ context: "assignment", message: err.message });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "create") return "Create New Member";
    if (mode === "edit") return formData.full_name || "Edit Member";
    return formData.full_name || "Member Details";
  };

  const formatDate = (
    dateString,
    options = { year: "numeric", month: "long" }
  ) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", options);
  };

  const handleSkip = () => {
    // Navigates to the next tab without saving anything (used by the middle 'Skip' button)
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  };

  const handleNext = () => {
    // This is for the right-side button ('Save & Next', 'Next')

    // 1. First step in CREATE mode: Must submit details
    if (mode === "create" && activeTabIndex === 0) {
      handleDetailsSubmit(); // Submits form, saves member, sets createdMemberId, and navigates to 'chits' tab
      return;
    }

    // 2. All other cases ('Next' button)
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  };

  const handleMiddle = () => {
    // This is for the middle button ('Skip' or 'Update'/'Finish')
    if (activeTabIndex === TABS.length - 1) {
      // Final step: Update/Finish button should trigger final submission/navigation
      handleFinalAction();
    } else {
      // All other steps: Skip button should just navigate to the next tab
      handleSkip();
    }
  };

  const handleFinalAction = () => {
    // This is the logic that executes when the final button (Update/Finish) is pressed.
    if (mode === "edit") {
      handleDetailsSubmit(); // Patches the member and navigates away.
      return;
    }
    // In create mode, the final button only needs to navigate away since saving details
    // is mandatory on step 1 and assignments are optional on the 'Chits' tab.
    if (createdMemberId) {
      navigate(`/members/view/${createdMemberId}`);
    } else {
      // Fallback.
      navigate("/members");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

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
                <h1
                  ref={titleRef}
                  tabIndex="-1"
                  className="text-2xl md:text-3xl font-bold text-text-primary text-center outline-none"
                >
                  {getTitle()}
                </h1>
              </div>
              <hr className="my-4 border-border" />
              <div className="w-full max-w-2xl mx-auto">
                {success && (
                  <Message type="success" title="Success">
                    {success}
                  </Message>
                )}
                {error && error.context !== "assignment" && (
                  <Message
                    type="error"
                    title="Error"
                    onClose={() => setError(null)}
                  >
                    {error.message || error}
                  </Message>
                )}
              </div>

              {/* Mobile View */}
              <div className="md:hidden">
                <form
                  id="member-details-form-mobile"
                  onSubmit={handleMobileFormSubmit}
                >
                  <MobileContent
                    TABS={TABS}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    mode={mode}
                    createdMemberId={createdMemberId}
                    formData={formData}
                    onFormChange={handleFormChange}
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
                    activeTabIndex={activeTabIndex}
                    isDetailsFormValid={isDetailsFormValid}
                    detailsLoading={detailsLoading}
                    handleNext={handleNext}
                    handleMiddle={handleMiddle}
                  />
                </form>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <form
                  id="member-details-form-desktop"
                  onSubmit={handleDetailsSubmit}
                >
                  <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-4xl mx-auto">
                    <div className="md:col-span-1">
                      <DetailsSection
                        mode={mode}
                        formData={formData}
                        onFormChange={handleFormChange}
                      />
                    </div>
                    <div className="flex flex-col gap-8">
                      <ChitsSection
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
                        createdMemberId={createdMemberId}
                      />
                      <PaymentsSection />
                    </div>
                    <div className="md:col-span-2">
                      <DesktopActionButton
                        mode={mode}
                        loading={detailsLoading}
                      />
                    </div>
                  </div>
                </form>
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
