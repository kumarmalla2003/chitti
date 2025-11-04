// frontend/src/pages/GroupDetailPage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import PayoutsSection from "../components/sections/PayoutsSection";
import PaymentHistoryList from "../components/sections/PaymentHistoryList";
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
  FiTrendingUp,
} from "react-icons/fi";
import {
  createChitGroup,
  getChitGroupById,
  patchChitGroup,
} from "../services/chitsService";

// --- Helper Functions (unchanged) ---
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

// --- Helper Components (unchanged) ---
const DetailsSectionComponent = ({
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

const PayoutsSectionComponent = ({ mode, groupId }) => (
  <Card className="flex-1 flex flex-col">
    <PayoutsSection mode={mode} groupId={groupId} />
  </Card>
);

const MembersSectionComponent = ({ mode, groupId }) => (
  <Card className="flex-1 flex flex-col">
    <GroupMembersManager mode={mode} groupId={groupId} />
  </Card>
);

// --- DesktopActionButton (unchanged) ---
const DesktopActionButton = ({ mode, loading, isPostCreation }) => {
  if (mode === "view") return null;
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

// --- TabButton (unchanged) ---
const TabButton = React.forwardRef(
  ({ name, icon, label, activeTab, setActiveTab, disabled }, ref) => {
    const isActive = activeTab === name;
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => !disabled && setActiveTab(name)}
        disabled={disabled}
        className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${
          isActive
            ? "bg-background-secondary text-accent border-b-2 border-accent"
            : "text-text-secondary hover:bg-background-tertiary"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }
);

// --- MobileContent (MODIFIED) ---
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
  handleMobileFormSubmit,
  isPostCreation,
}) => {
  const tabRefs = useRef({});

  useEffect(() => {
    const activeTabRef = tabRefs.current[activeTab];
    if (activeTabRef) {
      activeTabRef.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-2xl mx-auto md:hidden">
      <div className="flex items-center border-b border-border mb-6 overflow-x-auto whitespace-nowrap no-scrollbar">
        <TabButton
          ref={(el) => (tabRefs.current["details"] = el)}
          name="details"
          icon={<FiInfo />}
          label="Details"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          ref={(el) => (tabRefs.current["payouts"] = el)}
          name="payouts"
          icon={<FiTrendingUp />}
          label="Payouts"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !groupId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["members"] = el)}
          name="members"
          icon={<FiUsers />}
          label="Members"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !groupId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["payments"] = el)}
          name="payments"
          icon={<RupeeIcon className="w-4 h-4" />}
          label="Payments"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !groupId}
        />
      </div>

      {activeTab === "details" && (
        <form onSubmit={handleMobileFormSubmit}>
          <DetailsSectionComponent
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
              isPostCreation={isPostCreation}
            />
          )}
        </form>
      )}

      {activeTab === "payouts" && (
        <>
          <PayoutsSectionComponent mode={mode} groupId={groupId} />
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
              isPostCreation={isPostCreation}
            />
          )}
        </>
      )}

      {activeTab === "members" && (
        <>
          <MembersSectionComponent mode={mode} groupId={groupId} />
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
              isPostCreation={isPostCreation}
            />
          )}
        </>
      )}

      {activeTab === "payments" && (
        <>
          {/* --- MODIFICATION: Removed Card wrapper and header --- */}
          <PaymentHistoryList groupId={groupId} mode={mode} />
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
              isPostCreation={isPostCreation}
            />
          )}
        </>
      )}
    </div>
  );
};

// --- GroupDetailPage (Main component, no changes) ---
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
    collection_day: "",
    payout_day: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdGroupId, setCreatedGroupId] = useState(null);
  const [createdGroupName, setCreatedGroupName] = useState(null);
  useScrollToTop(success || error);

  const TABS = ["details", "payouts", "members", "payments"];
  const activeTabIndex = TABS.indexOf(activeTab);

  const isDetailsFormValid = useMemo(
    () =>
      formData.name.trim() !== "" &&
      formData.chit_value.trim() !== "" &&
      formData.group_size.trim() !== "" &&
      formData.monthly_installment.trim() !== "" &&
      formData.duration_months.trim() !== "" &&
      formData.start_date.trim() !== "" &&
      formData.collection_day.trim() !== "" &&
      formData.payout_day.trim() !== "",
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
          collection_day: group.collection_day.toString(),
          payout_day: group.payout_day.toString(),
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

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
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
      if (
        name === "chit_value" ||
        name === "monthly_installment" ||
        name === "collection_day" ||
        name === "payout_day"
      ) {
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
        if (newFormData.duration_months) {
          newFormData.start_date = calculateStartDate(
            value,
            newFormData.duration_months
          );
        } else if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          const newDuration = calculateDuration(newFormData.start_date, value);
          newFormData.duration_months = newDuration;
          newFormData.group_size = newDuration;
        }
      }
      return newFormData;
    });
  };

  const handleMobileFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab !== "details") {
      return;
    }
    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else if (mode === "create" && activeTabIndex === 0) {
      await handleSubmit();
    } else {
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
        const dataToSend = {
          ...formData,
          start_date: getFirstDayOfMonth(formData.start_date),
          chit_value: Number(formData.chit_value),
          group_size: Number(formData.group_size),
          monthly_installment: Number(formData.monthly_installment),
          duration_months: Number(formData.duration_months),
          collection_day: Number(formData.collection_day),
          payout_day: Number(formData.payout_day),
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
          collection_day: newGroup.collection_day.toString(),
          payout_day: newGroup.payout_day.toString(),
        });
        setActiveTab("payouts");
        setSuccess("Group details saved. You can now manage payouts.");
      } else if (mode === "create" && createdGroupId) {
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
          if (patchData.collection_day)
            patchData.collection_day = Number(patchData.collection_day);
          if (patchData.payout_day)
            patchData.payout_day = Number(patchData.payout_day);

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
            collection_day: updatedGroup.collection_day.toString(),
            payout_day: updatedGroup.payout_day.toString(),
          });
        }
        setActiveTab("payouts");
        setSuccess("Group details updated successfully!");
      } else if (mode === "edit") {
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
          if (patchData.collection_day)
            patchData.collection_day = Number(patchData.collection_day);
          if (patchData.payout_day)
            patchData.payout_day = Number(patchData.payout_day);

          await patchChitGroup(id, patchData, token);
          setSuccess("Chit group updated successfully!");
          if (activeTabIndex < TABS.length - 1) {
            setActiveTab(TABS[activeTabIndex + 1]);
          }
        } else {
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

  const handleBackNavigation = () => {
    if (activeTabIndex > 0) {
      setActiveTab(TABS[activeTabIndex - 1]);
    } else {
      navigate("/groups");
    }
  };

  const handleSkip = () => {
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  };

  const handleNext = () => {
    if (mode === "create" && activeTabIndex === 0) {
      handleSubmit();
      return;
    }

    if (mode === "edit" && activeTabIndex === 0) {
      handleSubmit();
      return;
    }

    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  };

  const handleMiddle = () => {
    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else {
      handleSkip();
    }
  };

  const handleFinalAction = () => {
    if (mode === "edit") {
      navigate("/groups", {
        state: {
          success: `Chit group "${formData.name}" has been updated successfully!`,
        },
      });
      return;
    }
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
                <button
                  onClick={handleBackNavigation}
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
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
                  handleMobileFormSubmit={handleMobileFormSubmit}
                  isPostCreation={!!(mode === "create" && createdGroupId)}
                />
              </div>

              {/* --- MODIFIED DESKTOP VIEW --- */}
              <div className="hidden md:block">
                <form id="group-details-form-desktop" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-5xl mx-auto">
                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <DetailsSectionComponent
                          mode={mode}
                          formData={formData}
                          handleFormChange={handleFormChange}
                          isPostCreation={
                            !!(mode === "create" && createdGroupId)
                          }
                          onEnterKeyOnLastInput={handleSubmit}
                        />
                      </div>
                    )}

                    {activeTab === "payouts" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <PayoutsSectionComponent
                          mode={mode}
                          groupId={id || createdGroupId}
                        />
                      </div>
                    )}

                    {activeTab === "members" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <MembersSectionComponent
                          mode={mode}
                          groupId={id || createdGroupId}
                        />
                      </div>
                    )}

                    {activeTab === "payments" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        {/* --- MODIFICATION: Removed Card wrapper and header --- */}
                        <PaymentHistoryList
                          groupId={id || createdGroupId}
                          mode={mode}
                        />
                      </div>
                    )}

                    {/* --- Right Column on Details Tab (Original) --- */}
                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <PayoutsSectionComponent
                          mode={mode}
                          groupId={id || createdGroupId}
                        />
                        <MembersSectionComponent
                          mode={mode}
                          groupId={id || createdGroupId}
                        />
                      </div>
                    )}

                    {/* --- Desktop Tab Buttons --- */}
                    <div className="md:col-span-2 flex items-center border-b border-border -mt-8">
                      <TabButton
                        name="details"
                        icon={<FiInfo />}
                        label="Details"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                      />
                      <TabButton
                        name="payouts"
                        icon={<FiTrendingUp />}
                        label="Payouts"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdGroupId}
                      />
                      <TabButton
                        name="members"
                        icon={<FiUsers />}
                        label="Members"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdGroupId}
                      />
                      <TabButton
                        name="payments"
                        icon={<RupeeIcon className="w-4 h-4" />}
                        label="Payments"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdGroupId}
                      />
                    </div>

                    {mode !== "view" && activeTab === "details" && (
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
