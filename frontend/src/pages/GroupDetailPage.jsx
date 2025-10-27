// frontend/src/pages/GroupDetailPage.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useScrollToTop from "../hooks/useScrollToTop";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import GroupDetailsForm from "../components/forms/GroupDetailsForm";
import GroupMembersManager from "../components/sections/GroupMembersManager";
import { RupeeIcon } from "../components/ui/Icons";
import StepperButtons from "../components/ui/StepperButtons";
import Message from "../components/ui/Message";
import {
  FiInfo,
  FiUsers,
  FiLoader,
  FiArrowLeft,
  FiPlus,
  FiEdit,
} from "react-icons/fi";
import {
  createChitGroup,
  getChitGroupById,
  patchChitGroup,
} from "../services/chitsService";

// --- Helper Functions ---
const getFirstDayOfMonth = (yearMonth) => (yearMonth ? `${yearMonth}-01` : "");
const toYearMonth = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};
const calculateEndDate = (startYearMonth, durationMonths) => {
  if (!startYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = startYearMonth.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  startDate.setMonth(startDate.getMonth() + parseInt(durationMonths) - 1);
  return toYearMonth(startDate.toISOString());
};
const calculateStartDate = (endYearMonth, durationMonths) => {
  if (!endYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = endYearMonth.split("-").map(Number);
  const endDate = new Date(year, month, 0);
  endDate.setMonth(endDate.getMonth() - parseInt(durationMonths) + 1);
  return toYearMonth(endDate.toISOString());
};
const calculateDuration = (startYearMonth, endYearMonth) => {
  if (!startYearMonth || !endYearMonth) return "";
  const [startYear, startMonth] = startYearMonth.split("-").map(Number);
  const [endYear, endMonth] = endYearMonth.split("-").map(Number);
  if (endYear < startYear || (endYear === startYear && endMonth < startMonth))
    return "";
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  return totalMonths > 0 ? totalMonths.toString() : "";
};

// --- Helper Components (Extracted) ---
const DetailsSection = ({
  mode,
  formData,
  handleFormChange,
  isPostCreation,
  onEnterKeyOnLastInput,
}) => (
  <Card className="h-full">
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <FiInfo /> Details
    </h2>
    <hr className="border-border mb-4" />
    <GroupDetailsForm
      mode={mode}
      formData={formData}
      onFormChange={handleFormChange}
      isPostCreation={isPostCreation}
      onEnterKeyOnLastInput={onEnterKeyOnLastInput}
    />
  </Card>
);

const MembersSection = ({ mode, groupId }) => (
  <Card className="flex-1 flex flex-col">
    <GroupMembersManager mode={mode} groupId={groupId} />
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

const DesktopActionButton = ({ mode, loading, isPostCreation }) => {
  if (mode === "view") return null;

  // Determine button properties based on mode and creation state
  let buttonText, Icon, buttonVariant;

  if (mode === "create") {
    if (isPostCreation) {
      buttonText = "Update Chit Group";
      Icon = FiEdit;
      buttonVariant = "warning";
    } else {
      buttonText = "Create Chit Group";
      Icon = FiPlus;
      buttonVariant = "success";
    }
  } else {
    buttonText = "Update Chit Group";
    Icon = FiEdit;
    buttonVariant = "warning";
  }

  return (
    <div className="md:col-start-2 md:flex md:justify-end">
      <Button
        type="submit"
        form="group-details-form-desktop"
        variant={buttonVariant}
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? (
          <FiLoader className="animate-spin mx-auto" />
        ) : (
          <>
            <Icon className="inline-block mr-2" />
            {buttonText}
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
  groupId,
  formData,
  handleFormChange,
  activeTabIndex,
  isDetailsFormValid,
  loading,
  handleNext,
  handleMiddle,
  handleMobileFormSubmit, // <-- NEW PROP
  isPostCreation,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto md:hidden">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-border mb-6">
        <TabButton
          name="details"
          icon={<FiInfo />}
          label="Details"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          name="members"
          icon={<FiUsers />}
          label="Members"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !groupId}
        />
        <TabButton
          name="payments"
          icon={<RupeeIcon className="w-4 h-4" />}
          label="Payments"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !groupId}
        />
      </div>

      {/* DETAILS TAB - Wrapped in form for Enter key support */}
      {activeTab === "details" && (
        <form onSubmit={handleMobileFormSubmit}>
          <DetailsSection
            mode={mode}
            formData={formData}
            handleFormChange={handleFormChange}
            isPostCreation={isPostCreation}
            onEnterKeyOnLastInput={handleNext}
          />
          {mode !== "view" && (
            <StepperButtons
              currentStep={activeTabIndex}
              totalSteps={TABS.length}
              onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
              onNext={handleNext}
              onMiddle={handleMiddle}
              isNextDisabled={activeTabIndex === 0 && !isDetailsFormValid}
              loading={loading}
              mode={mode}
              isPostCreation={isPostCreation} // ADD THIS LINE
            />
          )}
        </form>
      )}

      {/* MEMBERS TAB - NO form wrapper (AssignNewMemberForm has its own forms) */}
      {activeTab === "members" && (
        <>
          <MembersSection mode={mode} groupId={groupId} />
          {mode !== "view" && (
            <StepperButtons
              currentStep={activeTabIndex}
              totalSteps={TABS.length}
              onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
              onNext={handleNext}
              onMiddle={handleMiddle}
              isNextDisabled={false}
              loading={loading}
              mode={mode}
              isPostCreation={isPostCreation} // ADD THIS LINE
            />
          )}
        </>
      )}

      {/* PAYMENTS TAB - NO form wrapper (no inputs) */}
      {activeTab === "payments" && (
        <>
          <PaymentsSection />
          {mode !== "view" && (
            <StepperButtons
              currentStep={activeTabIndex}
              totalSteps={TABS.length}
              onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
              onNext={handleNext}
              onMiddle={handleMiddle}
              isNextDisabled={false}
              loading={loading}
              mode={mode}
              isPostCreation={isPostCreation} // ADD THIS LINE
            />
          )}
        </>
      )}
    </div>
  );
};

// --- Main Page Component ---
const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    chit_value: "",
    group_size: "",
    monthly_installment: "",
    duration_months: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdGroupId, setCreatedGroupId] = useState(null);
  const [createdGroupName, setCreatedGroupName] = useState(null);
  // Auto-scroll to top when messages change
  useScrollToTop(success || error);

  const TABS = ["details", "members", "payments"];
  const activeTabIndex = TABS.indexOf(activeTab);

  const isDetailsFormValid = useMemo(
    () =>
      formData.name.trim() !== "" &&
      formData.chit_value.trim() !== "" &&
      formData.group_size.trim() !== "" &&
      formData.monthly_installment.trim() !== "" &&
      formData.duration_months.trim() !== "" &&
      formData.start_date.trim() !== "",
    [formData]
  );

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchGroup = async () => {
      setPageLoading(true);
      try {
        const group = await getChitGroupById(id, token);
        const fetchedData = {
          name: group.name,
          chit_value: group.chit_value.toString(),
          group_size: group.group_size.toString(),
          monthly_installment: group.monthly_installment.toString(),
          duration_months: group.duration_months.toString(),
          start_date: toYearMonth(group.start_date),
          end_date: toYearMonth(group.end_date),
        };
        setFormData(fetchedData);
        setOriginalData(fetchedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    if (isCreate) {
      setMode("create");
      setPageLoading(false);
    } else if (isEdit) {
      setMode("edit");
      fetchGroup();
    } else {
      setMode("view");
      fetchGroup();
    }
  }, [id, location.pathname, token]);

  // Handle success message from navigation state
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    setFormData((prevFormData) => {
      let newFormData = { ...prevFormData, [name]: value };
      if (name === "chit_value" || name === "monthly_installment") {
        newFormData[name] = value.replace(/[^0-9]/g, "");
      } else if (name === "group_size") {
        newFormData.duration_months = value;
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.end_date = calculateEndDate(
            newFormData.start_date,
            value
          );
        }
      } else if (name === "duration_months") {
        newFormData.group_size = value;
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.end_date = calculateEndDate(
            newFormData.start_date,
            value
          );
        } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.start_date = calculateStartDate(
            newFormData.end_date,
            value
          );
        }
      } else if (name === "start_date" && value.match(/^\d{4}-\d{2}$/)) {
        if (newFormData.duration_months) {
          newFormData.end_date = calculateEndDate(
            value,
            newFormData.duration_months
          );
        } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
          const newDuration = calculateDuration(value, newFormData.end_date);
          newFormData.duration_months = newDuration;
          newFormData.group_size = newDuration;
        }
      } else if (name === "end_date" && value.match(/^\d{4}-\d{2}$/)) {
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          const newDuration = calculateDuration(newFormData.start_date, value);
          newFormData.duration_months = newDuration;
          newFormData.group_size = newDuration;
        } else if (newFormData.duration_months) {
          newFormData.start_date = calculateStartDate(
            value,
            newFormData.duration_months
          );
        }
      }
      return newFormData;
    });
  };

  const handleMobileFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Mobile form submitted", { mode, activeTabIndex, activeTab });

    // ⚠️ CRITICAL FIX: Don't process form submission when on members or payments tab
    if (activeTab === "members" || activeTab === "payments") {
      console.log("Ignoring submit - on members/payments tab");
      return;
    }

    // Determine which action to take based on current step
    if (activeTabIndex === TABS.length - 1) {
      // Last step: Finish/Update action
      handleFinalAction();
    } else if (mode === "create" && activeTabIndex === 0) {
      // First step in create mode: Save & Next
      await handleSubmit();
    } else {
      // All other cases: Just navigate to next tab
      if (activeTabIndex < TABS.length - 1) {
        setActiveTab(TABS[activeTabIndex + 1]);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "create" && !createdGroupId) {
        // Initial creation
        const dataToSend = {
          ...formData,
          start_date: getFirstDayOfMonth(formData.start_date),
          chit_value: Number(formData.chit_value),
          group_size: Number(formData.group_size),
          monthly_installment: Number(formData.monthly_installment),
          duration_months: Number(formData.duration_months),
        };
        delete dataToSend.end_date;
        const newGroup = await createChitGroup(dataToSend, token);
        setCreatedGroupId(newGroup.id);
        setCreatedGroupName(newGroup.name);
        setOriginalData({
          name: newGroup.name,
          chit_value: newGroup.chit_value.toString(),
          group_size: newGroup.group_size.toString(),
          monthly_installment: newGroup.monthly_installment.toString(),
          duration_months: newGroup.duration_months.toString(),
          start_date: toYearMonth(newGroup.start_date),
          end_date: toYearMonth(newGroup.end_date),
        });
        setActiveTab("members");
        setSuccess("Group details saved. You can now add members.");
      } else if (mode === "create" && createdGroupId) {
        // Updating after creation (post-creation edit)
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }

        if (Object.keys(changes).length > 0) {
          const patchData = { ...changes };
          if (patchData.start_date)
            patchData.start_date = getFirstDayOfMonth(patchData.start_date);
          if (patchData.chit_value)
            patchData.chit_value = Number(patchData.chit_value);
          if (patchData.group_size)
            patchData.group_size = Number(patchData.group_size);
          if (patchData.monthly_installment)
            patchData.monthly_installment = Number(
              patchData.monthly_installment
            );
          if (patchData.duration_months)
            patchData.duration_months = Number(patchData.duration_months);

          const updatedGroup = await patchChitGroup(
            createdGroupId,
            patchData,
            token
          );
          setCreatedGroupName(updatedGroup.name);
          setOriginalData({
            name: updatedGroup.name,
            chit_value: updatedGroup.chit_value.toString(),
            group_size: updatedGroup.group_size.toString(),
            monthly_installment: updatedGroup.monthly_installment.toString(),
            duration_months: updatedGroup.duration_months.toString(),
            start_date: toYearMonth(updatedGroup.start_date),
            end_date: toYearMonth(updatedGroup.end_date),
          });
        }
        setActiveTab("members");
        setSuccess("Group details updated successfully!");
      } else if (mode === "edit") {
        // Edit mode - save changes and navigate
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }

        if (Object.keys(changes).length > 0) {
          const patchData = { ...changes };
          if (patchData.start_date)
            patchData.start_date = getFirstDayOfMonth(patchData.start_date);
          if (patchData.chit_value)
            patchData.chit_value = Number(patchData.chit_value);
          if (patchData.group_size)
            patchData.group_size = Number(patchData.group_size);
          if (patchData.monthly_installment)
            patchData.monthly_installment = Number(
              patchData.monthly_installment
            );
          if (patchData.duration_months)
            patchData.duration_months = Number(patchData.duration_months);

          await patchChitGroup(id, patchData, token);

          // Show success message
          setSuccess("Chit group updated successfully!");

          // Navigate to next tab
          if (activeTabIndex < TABS.length - 1) {
            setActiveTab(TABS[activeTabIndex + 1]);
          }
        } else {
          // No changes, just navigate
          if (activeTabIndex < TABS.length - 1) {
            setActiveTab(TABS[activeTabIndex + 1]);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "create") {
      return createdGroupName || "Create New Chit Group";
    }
    if (mode === "edit") return formData.name || "Edit Chit Group";
    return formData.name || "Group Details";
  };

  const handleSkip = () => {
    // Navigates to the next tab without saving anything (used by the middle 'Skip' button)
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  };

  const handleNext = () => {
    // 1. First step in CREATE mode: Must submit details
    if (mode === "create" && activeTabIndex === 0) {
      handleSubmit(); // Submits form, creates/updates group, and navigates
      return;
    }

    // 2. First step in EDIT mode: Save changes and navigate
    if (mode === "edit" && activeTabIndex === 0) {
      handleSubmit(); // Saves changes and navigates
      return;
    }

    // 3. All other cases ('Next' button) - Just navigate
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
    if (mode === "edit") {
      // In edit mode, navigate to groups list with success message
      navigate("/groups", {
        state: {
          success: `Chit group "${formData.name}" has been updated successfully!`,
        },
      });
      return;
    }
    // In create mode, navigate to view page with success message
    if (createdGroupId) {
      navigate(`/groups/view/${createdGroupId}`, {
        state: {
          success: `Chit group "${createdGroupName}" has been created successfully!`,
        },
      });
    } else {
      navigate("/groups");
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
        <Header onMenuOpen={() => setIsMenuOpen(true)} activeSection="groups" />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="relative flex justify-center items-center mb-4">
                <Link
                  to="/groups"
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
                {error && (
                  <Message
                    type="error"
                    title="Error"
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Message>
                )}
              </div>
              {/* Mobile View */}
              <div className="md:hidden">
                <MobileContent
                  TABS={TABS}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  mode={mode}
                  groupId={id || createdGroupId}
                  formData={formData}
                  handleFormChange={handleFormChange}
                  activeTabIndex={activeTabIndex}
                  isDetailsFormValid={isDetailsFormValid}
                  loading={loading}
                  handleNext={handleNext}
                  handleMiddle={handleMiddle}
                  handleMobileFormSubmit={handleMobileFormSubmit} // <-- ADDED THIS LINE
                  isPostCreation={!!(mode === "create" && createdGroupId)} // ADD THIS LINE
                />
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <form id="group-details-form-desktop" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-4xl mx-auto">
                    <div className="md:col-span-1">
                      <DetailsSection
                        mode={mode}
                        formData={formData}
                        handleFormChange={handleFormChange}
                        isPostCreation={!!(mode === "create" && createdGroupId)}
                        onEnterKeyOnLastInput={handleNext}
                      />
                    </div>
                    <div className="flex flex-col gap-8">
                      <MembersSection
                        mode={mode}
                        groupId={id || createdGroupId}
                      />
                      <PaymentsSection />
                    </div>
                    {mode !== "view" && (
                      <div className="md:col-span-2">
                        <DesktopActionButton
                          mode={mode}
                          loading={loading}
                          isPostCreation={
                            !!(mode === "create" && createdGroupId)
                          }
                        />
                      </div>
                    )}
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
        activeSection="groups"
      />
      <BottomNav />
    </>
  );
};

export default GroupDetailPage;
