// frontend/src/pages/ChitDetailPage.jsx

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
import ChitDetailsForm from "../components/forms/ChitDetailsForm";
import PayoutsSection from "../components/sections/PayoutsSection";
import PaymentHistoryList from "../components/sections/PaymentHistoryList";
import ChitMembersManager from "../components/sections/ChitMembersManager";
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
import { createChit, getChitById, patchChit } from "../services/chitsService";

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

// --- Helper Components ---
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
    <ChitDetailsForm
      mode={mode}
      formData={formData}
      onFormChange={handleFormChange}
      isPostCreation={isPostCreation}
      onEnterKeyOnLastInput={onEnterKeyOnLastInput}
    />
  </Card>
);

const PayoutsSectionComponent = ({ mode, chitId }) => (
  <Card className="flex-1 flex flex-col">
    <PayoutsSection mode={mode} chitId={chitId} />
  </Card>
);

const MembersSectionComponent = ({ mode, chitId, onLogPaymentClick }) => (
  <Card className="flex-1 flex flex-col">
    <ChitMembersManager
      mode={mode}
      chitId={chitId}
      onLogPaymentClick={onLogPaymentClick}
    />
  </Card>
);

// --- DesktopActionButton (unchanged) ---
const DesktopActionButton = ({ mode, loading, isPostCreation }) => {
  if (mode === "view") return null;
  let buttonText, Icon, buttonVariant;

  if (mode === "create") {
    if (isPostCreation) {
      buttonText = "Update Chit";
      Icon = FiEdit;
      buttonVariant = "warning";
    } else {
      buttonText = "Create Chit";
      Icon = FiPlus;
      buttonVariant = "success";
    }
  } else {
    buttonText = "Update Chit";
    Icon = FiEdit;
    buttonVariant = "warning";
  }

  return (
    <div className="md:col-start-2 md:flex md:justify-end">
      <Button
        type="submit"
        form="chit-details-form-desktop"
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
  chitId,
  formData,
  handleFormChange,
  activeTabIndex,
  isDetailsFormValid,
  loading,
  handleNext,
  handleMiddle,
  handleMobileFormSubmit,
  isPostCreation,
  onLogPaymentClick,
  paymentDefaults,
  setPaymentDefaults,
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
          disabled={mode === "create" && !chitId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["members"] = el)}
          name="members"
          icon={<FiUsers />}
          label="Members"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !chitId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["payments"] = el)}
          name="payments"
          icon={<RupeeIcon className="w-4 h-4" />}
          label="Payments"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !chitId}
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
          <PayoutsSectionComponent mode={mode} chitId={chitId} />
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
          <MembersSectionComponent
            mode={mode}
            chitId={chitId}
            onLogPaymentClick={onLogPaymentClick}
          />
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
          <PaymentHistoryList
            chitId={chitId}
            mode={mode}
            paymentDefaults={paymentDefaults}
            setPaymentDefaults={setPaymentDefaults}
          />
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

// --- ChitDetailPage (Main component) ---
const ChitDetailPage = () => {
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
    size: "",
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
  const [createdChitId, setCreatedChitId] = useState(null);
  const [createdChitName, setCreatedChitName] = useState(null);

  const [paymentDefaults, setPaymentDefaults] = useState(null);

  useScrollToTop(success || error);

  const TABS = ["details", "payouts", "members", "payments"];
  const activeTabIndex = TABS.indexOf(activeTab);

  const isDetailsFormValid = useMemo(
    () =>
      formData.name.trim() !== "" &&
      formData.chit_value.trim() !== "" &&
      formData.size.trim() !== "" &&
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

    const fetchChit = async () => {
      setPageLoading(true);
      try {
        const chit = await getChitById(id, token);
        const fetchedData = {
          name: chit.name,
          chit_value: chit.chit_value.toString(),
          size: chit.size.toString(),
          monthly_installment: chit.monthly_installment.toString(),
          duration_months: chit.duration_months.toString(),
          start_date: toYearMonth(chit.start_date),
          end_date: toYearMonth(chit.end_date),
          collection_day: chit.collection_day.toString(),
          payout_day: chit.payout_day.toString(),
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
      fetchChit();
    } else {
      setMode("view");
      fetchChit();
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
      } else if (name === "size") {
        newFormData.duration_months = value;
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.end_date = calculateEndDate(
            newFormData.start_date,
            value
          );
        }
      } else if (name === "duration_months") {
        newFormData.size = value;
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
          newFormData.size = newDuration;
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
          newFormData.size = newDuration;
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
      if (mode === "create" && !createdChitId) {
        const dataToSend = {
          ...formData,
          start_date: getFirstDayOfMonth(formData.start_date),
          chit_value: Number(formData.chit_value),
          size: Number(formData.size),
          monthly_installment: Number(formData.monthly_installment),
          duration_months: Number(formData.duration_months),
          collection_day: Number(formData.collection_day),
          payout_day: Number(formData.payout_day),
        };
        delete dataToSend.end_date;
        const newChit = await createChit(dataToSend, token);
        setCreatedChitId(newChit.id);
        setCreatedChitName(newChit.name);
        setOriginalData({
          name: newChit.name,
          chit_value: newChit.chit_value.toString(),
          size: newChit.size.toString(),
          monthly_installment: newChit.monthly_installment.toString(),
          duration_months: newChit.duration_months.toString(),
          start_date: toYearMonth(newChit.start_date),
          end_date: toYearMonth(newChit.end_date),
          collection_day: newChit.collection_day.toString(),
          payout_day: newChit.payout_day.toString(),
        });
        setActiveTab("payouts");
        setSuccess("Chit details saved. You can now manage payouts.");
      } else if (mode === "create" && createdChitId) {
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
          if (patchData.size) patchData.size = Number(patchData.size);
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

          const updatedChit = await patchChit(createdChitId, patchData, token);
          setCreatedChitName(updatedChit.name);
          setOriginalData({
            name: updatedChit.name,
            chit_value: updatedChit.chit_value.toString(),
            size: updatedChit.size.toString(),
            monthly_installment: updatedChit.monthly_installment.toString(),
            duration_months: updatedChit.duration_months.toString(),
            start_date: toYearMonth(updatedChit.start_date),
            end_date: toYearMonth(updatedChit.end_date),
            collection_day: updatedChit.collection_day.toString(),
            payout_day: updatedChit.payout_day.toString(),
          });
        }
        setActiveTab("payouts");
        setSuccess("Chit details updated successfully!");
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
          if (patchData.size) patchData.size = Number(patchData.size);
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

          await patchChit(id, patchData, token);
          setSuccess("Chit updated successfully!");
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
      return createdChitName || "Create New Chit";
    }
    if (mode === "edit") return formData.name || "Edit Chit";
    return formData.name || "Chit Details";
  };

  const handleBackNavigation = () => {
    if (activeTabIndex > 0) {
      setActiveTab(TABS[activeTabIndex - 1]);
    } else {
      navigate("/chits");
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
      navigate("/chits", {
        state: {
          success: `Chit "${formData.name}" has been updated successfully!`,
        },
      });
      return;
    }
    if (createdChitId) {
      navigate(`/chits/view/${createdChitId}`, {
        state: {
          success: `Chit "${createdChitName}" has been created successfully!`,
        },
      });
    } else {
      navigate("/chits");
    }
  };

  const handleLogPaymentClick = (assignment) => {
    setPaymentDefaults({
      assignmentId: assignment.id,
      chitId: assignment.chit.id,
      memberId: assignment.member.id,
    });
    setActiveTab("payments");
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
        <Header onMenuOpen={() => setIsMenuOpen(true)} activeSection="chits" />
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
                  chitId={id || createdChitId}
                  formData={formData}
                  handleFormChange={handleFormChange}
                  activeTabIndex={activeTabIndex}
                  isDetailsFormValid={isDetailsFormValid}
                  loading={loading}
                  handleNext={handleNext}
                  handleMiddle={handleMiddle}
                  handleMobileFormSubmit={handleMobileFormSubmit}
                  isPostCreation={!!(mode === "create" && createdChitId)}
                  onLogPaymentClick={handleLogPaymentClick}
                  paymentDefaults={paymentDefaults}
                  setPaymentDefaults={setPaymentDefaults}
                />
              </div>

              {/* --- MODIFIED DESKTOP VIEW --- */}
              <div className="hidden md:block">
                <form id="chit-details-form-desktop" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-5xl mx-auto">
                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <DetailsSectionComponent
                          mode={mode}
                          formData={formData}
                          handleFormChange={handleFormChange}
                          isPostCreation={
                            !!(mode === "create" && createdChitId)
                          }
                          onEnterKeyOnLastInput={handleSubmit}
                        />
                      </div>
                    )}

                    {activeTab === "payouts" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <PayoutsSectionComponent
                          mode={mode}
                          chitId={id || createdChitId}
                        />
                      </div>
                    )}

                    {activeTab === "members" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <MembersSectionComponent
                          mode={mode}
                          chitId={id || createdChitId}
                          onLogPaymentClick={handleLogPaymentClick}
                        />
                      </div>
                    )}

                    {activeTab === "payments" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <PaymentHistoryList
                          chitId={id || createdChitId}
                          mode={mode}
                          paymentDefaults={paymentDefaults}
                          setPaymentDefaults={setPaymentDefaults}
                        />
                      </div>
                    )}

                    {/* --- Right Column on Details Tab (Original) --- */}
                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <PayoutsSectionComponent
                          mode={mode}
                          chitId={id || createdChitId}
                        />
                        <MembersSectionComponent
                          mode={mode}
                          chitId={id || createdChitId}
                          onLogPaymentClick={handleLogPaymentClick}
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
                        disabled={mode === "create" && !createdChitId}
                      />
                      <TabButton
                        name="members"
                        icon={<FiUsers />}
                        label="Members"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdChitId}
                      />
                      <TabButton
                        name="payments"
                        icon={<RupeeIcon className="w-4 h-4" />}
                        label="Payments"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdChitId}
                      />
                    </div>

                    {mode !== "view" && activeTab === "details" && (
                      <div className="md:col-span-2">
                        <DesktopActionButton
                          mode={mode}
                          loading={loading}
                          isPostCreation={
                            !!(mode === "create" && createdChitId)
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
        activeSection="chits"
      />
      <BottomNav />
    </>
  );
};

export default ChitDetailPage;
