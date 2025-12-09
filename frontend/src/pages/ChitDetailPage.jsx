// frontend/src/pages/ChitDetailPage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { pdf } from "@react-pdf/renderer";
import ChitReportPDF from "../components/reports/ChitReportPDF";
import useScrollToTop from "../hooks/useScrollToTop";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ChitDetailsForm from "../components/forms/ChitDetailsForm";
import PayoutsSection from "../components/sections/PayoutsSection";
import CollectionHistoryList from "../components/sections/CollectionHistoryList";
import ChitMembersManager from "../components/sections/ChitMembersManager";
import ChitViewDashboard from "./ChitViewDashboard";
import StepperButtons from "../components/ui/StepperButtons";
import Message from "../components/ui/Message";
import {
  Info,
  Users,
  Loader2,
  ArrowLeft,
  Plus,
  SquarePen,
  Printer,
  WalletMinimal,
  TrendingUp,
} from "lucide-react";
import { createChit, getChitById, patchChit } from "../services/chitsService";
import { getPayoutsByChitId } from "../services/payoutsService";
import { getAssignmentsForChit } from "../services/assignmentsService";
import { getCollectionsByChitId } from "../services/collectionsService";

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
      <Info className="w-6 h-6" /> Details
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

const MembersSectionComponent = ({ mode, chitId, onLogCollectionClick }) => (
  <Card className="flex-1 flex flex-col">
    <ChitMembersManager
      mode={mode}
      chitId={chitId}
      onLogCollectionClick={onLogCollectionClick}
    />
  </Card>
);

const DesktopActionButton = ({ mode, loading, isPostCreation }) => {
  if (mode === "view") return null;
  let buttonText, Icon, buttonVariant;

  if (mode === "create") {
    if (isPostCreation) {
      buttonText = "Update Chit";
      Icon = SquarePen;
      buttonVariant = "warning";
    } else {
      buttonText = "Create Chit";
      Icon = Plus;
      buttonVariant = "success";
    }
  } else {
    buttonText = "Update Chit";
    Icon = SquarePen;
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
          <Loader2 className="animate-spin mx-auto w-5 h-5" />
        ) : (
          <>
            <Icon className="inline-block mr-2 w-5 h-5" />
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
};

const TabButton = React.forwardRef(
  ({ name, icon: Icon, label, activeTab, setActiveTab, disabled }, ref) => {
    const isActive = activeTab === name;
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => !disabled && setActiveTab(name)}
        disabled={disabled}
        className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${isActive
          ? "bg-background-secondary text-accent border-b-2 border-accent"
          : "text-text-secondary hover:bg-background-tertiary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }
);

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
  onLogCollectionClick,
  collectionDefaults,
  setCollectionDefaults,
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
          icon={Info}
          label="Details"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          ref={(el) => (tabRefs.current["payouts"] = el)}
          name="payouts"
          icon={TrendingUp}
          label="Payouts"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !chitId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["members"] = el)}
          name="members"
          icon={Users}
          label="Members"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !chitId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["collections"] = el)}
          name="collections"
          icon={WalletMinimal}
          label="Collections"
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
            onLogCollectionClick={onLogCollectionClick}
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

      {activeTab === "collections" && (
        <>
          <CollectionHistoryList
            chitId={chitId}
            mode={mode}
            collectionDefaults={collectionDefaults}
            setCollectionDefaults={setCollectionDefaults}
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

const ChitDetailPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
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

  const [collectionDefaults, setCollectionDefaults] = useState(null);

  // --- REPORT STATE ---
  const [isReportLoading, setIsReportLoading] = useState(false);

  useScrollToTop(success || error);

  const TABS = ["details", "payouts", "members", "collections"];
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
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchChit = async () => {
      setPageLoading(true);
      try {
        const chit = await getChitById(id);
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
        setOriginalData(chit);
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
  }, [id, location.pathname, isLoggedIn]);

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
        const newChit = await createChit(dataToSend);
        setCreatedChitId(newChit.id);
        setCreatedChitName(newChit.name);
        setOriginalData(newChit);
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

          const updatedChit = await patchChit(createdChitId, patchData);
          setCreatedChitName(updatedChit.name);
          setOriginalData(updatedChit);
        }
        setActiveTab("payouts");
        setSuccess("Chit details updated successfully!");
      } else if (mode === "edit") {
        const changes = {};
        const patchData = {
          ...formData,
          start_date: getFirstDayOfMonth(formData.start_date),
          chit_value: Number(formData.chit_value),
          size: Number(formData.size),
          monthly_installment: Number(formData.monthly_installment),
          duration_months: Number(formData.duration_months),
          collection_day: Number(formData.collection_day),
          payout_day: Number(formData.payout_day),
        };
        delete patchData.end_date;

        await patchChit(id, patchData);
        setSuccess("Chit updated successfully!");
        if (activeTabIndex < TABS.length - 1) {
          setActiveTab(TABS[activeTabIndex + 1]);
        }
      }
    } catch (err) {
      console.error("Submit Error:", err);
      let errorMessage = err.message;
      if (err.response && err.response.data && err.response.data.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          errorMessage = err.response.data.detail
            .map((e) => `${e.loc[1]}: ${e.msg}`)
            .join(", ");
        } else {
          // Generic detail message
          errorMessage = err.response.data.detail;
        }
      }
      setError(errorMessage);
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
    if (activeTabIndex > 0 && mode !== "view") {
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

  const handleLogCollectionClick = (assignment) => {
    setCollectionDefaults({
      assignmentId: assignment.id,
      chitId: assignment.chit.id,
      memberId: assignment.member.id,
    });
    if (mode !== "view") {
      setActiveTab("collections");
    }
  };

  // --- ONE-CLICK REPORT GENERATION ---
  const handlePrintReport = async () => {
    if (!id || mode !== "view") return;

    setIsReportLoading(true);
    setError(null);

    try {
      const [payoutsData, assignmentsData, collectionsData] = await Promise.all(
        [
          getPayoutsByChitId(id),
          getAssignmentsForChit(id),
          getCollectionsByChitId(id),
        ]
      );

      const reportProps = {
        chit: {
          ...originalData,
          ...formData,
          id: id,
        },
        payouts: payoutsData.payouts,
        assignments: assignmentsData.assignments,
        collections: collectionsData.collections,
      };

      let reportName = formData.name;
      if (!reportName.toLowerCase().endsWith("chit")) {
        reportName += " Chit";
      }
      reportName += " Report";

      const blob = await pdf(<ChitReportPDF {...reportProps} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsReportLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <div className="print:hidden">
          <Header
            onMenuOpen={() => setIsMenuOpen(true)}
            activeSection="chits"
          />
        </div>

        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="relative flex justify-center items-center mb-4">
                <button
                  onClick={handleBackNavigation}
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors print:hidden"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>

                <h1
                  ref={titleRef}
                  tabIndex="-1"
                  className="text-2xl md:text-3xl font-bold text-text-primary text-center outline-none"
                >
                  {getTitle()}
                </h1>

                {/* --- HEADER ACTIONS --- */}
                {mode === "view" && (
                  <div className="absolute right-0 flex print:hidden items-center">
                    <Link
                      to={`/chits/edit/${id}`}
                      className="p-2 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200"
                      title="Edit Chit"
                    >
                      <SquarePen className="w-6 h-6" />
                    </Link>

                    <button
                      onClick={handlePrintReport}
                      disabled={isReportLoading}
                      className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200"
                      title="Download PDF Report"
                    >
                      {isReportLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Printer className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <hr className="my-4 border-border" />
              <div className="w-full max-w-2xl mx-auto print:hidden">
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

              {/* --- VIEW MODE --- */}
              {mode === "view" ? (
                <div className="max-w-6xl mx-auto">
                  <ChitViewDashboard
                    chitData={formData}
                    chitId={id}
                    onLogCollectionClick={handleLogCollectionClick}
                    collectionDefaults={collectionDefaults}
                    setCollectionDefaults={setCollectionDefaults}
                  />
                </div>
              ) : (
                /* --- CREATE/EDIT MODE --- */
                <>
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
                      onLogCollectionClick={handleLogCollectionClick}
                      collectionDefaults={collectionDefaults}
                      setCollectionDefaults={setCollectionDefaults}
                    />
                  </div>

                  <div className="hidden md:block">
                    <form
                      id="chit-details-form-desktop"
                      onSubmit={handleSubmit}
                    >
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
                              onLogCollectionClick={handleLogCollectionClick}
                            />
                          </div>
                        )}

                        {activeTab === "collections" && (
                          <div className="md:col-span-2 flex flex-col gap-8">
                            <CollectionHistoryList
                              chitId={id || createdChitId}
                              mode={mode}
                              collectionDefaults={collectionDefaults}
                              setCollectionDefaults={setCollectionDefaults}
                            />
                          </div>
                        )}

                        {activeTab === "details" && (
                          <div className="md:col-span-1 flex flex-col gap-8">
                            <PayoutsSectionComponent
                              mode={mode}
                              chitId={id || createdChitId}
                            />
                            <MembersSectionComponent
                              mode={mode}
                              chitId={id || createdChitId}
                              onLogCollectionClick={handleLogCollectionClick}
                            />
                          </div>
                        )}

                        <div className="md:col-span-2 flex items-center border-b border-border -mt-8">
                          <TabButton
                            name="details"
                            icon={Info}
                            label="Details"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                          />
                          <TabButton
                            name="payouts"
                            icon={TrendingUp}
                            label="Payouts"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            disabled={mode === "create" && !createdChitId}
                          />
                          <TabButton
                            name="members"
                            icon={Users}
                            label="Members"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            disabled={mode === "create" && !createdChitId}
                          />
                          <TabButton
                            name="collections"
                            icon={WalletMinimal}
                            label="Collections"
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
                </>
              )}
            </div>
          </main>
          <div className="print:hidden">
            <Footer />
          </div>
        </div>
      </div>
      <div className="print:hidden">
        <MobileNav
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activeSection="chits"
        />
      </div>
      <div className="print:hidden">
        <BottomNav />
      </div>
    </>
  );
};

export default ChitDetailPage;
