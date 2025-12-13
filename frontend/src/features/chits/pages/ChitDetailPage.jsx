// frontend/src/features/chits/pages/ChitDetailPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chitSchema } from "../schemas/chitSchema";

import useScrollToTop from "../../../hooks/useScrollToTop";
import useMediaQuery from "../../../hooks/useMediaQuery";
import Message from "../../../components/ui/Message";

import Card from "../../../components/ui/Card";
import TabButton from "../../../components/ui/TabButton";
import Skeleton from "../../../components/ui/Skeleton";
import ChitDetailsForm from "../components/forms/ChitDetailsForm";
import PayoutsSection from "../components/sections/PayoutsSection";
import ChitMembersManager from "../components/sections/ChitMembersManager";
import ChitMobileContent from "../components/sections/ChitMobileContent";
import ChitDesktopActionButton from "../components/ui/ChitDesktopActionButton";
import ChitViewDashboard from "./ChitViewDashboard";
import CollectionHistoryList from "../../members/components/sections/CollectionHistoryList";
import ChitReportPDF from "../components/reports/ChitReportPDF";
import { pdf } from "@react-pdf/renderer";
import {
  Info,
  Users,
  Loader2,
  ArrowLeft,
  SquarePen,
  Printer,
  WalletMinimal,
  TrendingUp,
} from "lucide-react";
import { createChit, getChitById, patchChit } from "../../../services/chitsService";
import { chitKeys } from "../hooks/useChits";
import { getPayoutsByChitId } from "../../../services/payoutsService";
import { getAssignmentsForChit } from "../../../services/assignmentsService";
import { getCollectionsByChitId } from "../../../services/collectionsService";
import {
  calculateEndDate,
  calculateStartDate,
  calculateDuration,
} from "../../../utils/calculations";
import { toYearMonth, getFirstDayOfMonth } from "../../../utils/formatters";

// --- Helper Components for Desktop View ---
const DetailsSectionComponent = ({
  mode,
  control,
  register,
  errors,
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
      control={control}
      register={register}
      errors={errors}
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

/**
 * ChitDetailPage component - handles create, edit, and view modes for chit details.
 */
const ChitDetailPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const [mode, setMode] = useState("view");
  const [activeTab, setActiveTab] = useState("details");
  const [originalData, setOriginalData] = useState(null);

  // --- React Hook Form Setup ---
  const {
    register,
    handleSubmit: handleRHSubmit,
    control,
    setValue,
    reset,
    trigger,
    formState: { errors, isValid },
    getValues,
  } = useForm({
    resolver: zodResolver(chitSchema),
    defaultValues: {
      name: "",
      chit_value: "",
      size: "",
      chit_type: "fixed",
      monthly_installment: "",
      installment_before_payout: "",
      installment_after_payout: "",
      duration_months: "",
      start_date: "",
      end_date: "",
      collection_day: "",
      payout_day: "",
    },
    mode: "onTouched",
  });

  // Watch fields for calculations
  const wSize = useWatch({ control, name: "size" });
  const wDuration = useWatch({ control, name: "duration_months" });
  const wStartDate = useWatch({ control, name: "start_date" });
  const wEndDate = useWatch({ control, name: "end_date" });

  // --- Auto-Calculation Effects ---

  // Sync Size <-> Duration
  useEffect(() => {
    if (wSize && Number(wSize) !== Number(wDuration)) {
      setValue("duration_months", Number(wSize), { shouldValidate: true });
    }
  }, [wSize, setValue]); // Avoid wDuration dept to prevent loop

  useEffect(() => {
    if (wDuration && Number(wDuration) !== Number(wSize)) {
      setValue("size", Number(wDuration), { shouldValidate: true });
    }
  }, [wDuration, setValue]);

  // Calculate End Date from Start Date + Duration
  useEffect(() => {
    if (wStartDate && wStartDate.match(/^\d{4}-\d{2}$/) && wDuration) {
      const newEndDate = calculateEndDate(wStartDate, wDuration);
      if (newEndDate !== wEndDate) {
        setValue("end_date", newEndDate, { shouldValidate: true });
      }
    }
  }, [wStartDate, wDuration, setValue]); // Remove wEndDate to break loop

  // Calculate Start Date from End Date + Duration (if Start Date empty or user changing end)
  // Or calculate Duration if Start & End exist (less common in this flow, usually size drives duration)
  // For simplicity, we prioritize Start + Duration -> End.

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
          chit_value: chit.chit_value,
          size: chit.size,
          chit_type: chit.chit_type || "fixed",
          monthly_installment: chit.monthly_installment || 0,
          installment_before_payout: chit.installment_before_payout || 0,
          installment_after_payout: chit.installment_after_payout || 0,
          duration_months: chit.duration_months,
          start_date: toYearMonth(chit.start_date),
          end_date: toYearMonth(chit.end_date),
          collection_day: chit.collection_day,
          payout_day: chit.payout_day,
        };
        reset(fetchedData);
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
  }, [id, location.pathname, isLoggedIn, reset]);

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

  const handleMobileFormSubmit = async (e) => {
    // Mobile stepper submit wrapper
    // We need to trigger handleRHSubmit(onSubmit)(e) but only if it's the right time
    if (activeTab !== "details") return;

    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else if (mode === "create" && activeTabIndex === 0) {
      // Validate and Submit
      await handleRHSubmit(onSubmit)(e);
    } else {
      // Just next step
      if (activeTabIndex < TABS.length - 1) {
        setActiveTab(TABS[activeTabIndex + 1]);
      }
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // data is already validated and converted numbers by Zod

    try {
      if (mode === "create" && !createdChitId) {
        const dataToSend = {
          ...data,
          start_date: getFirstDayOfMonth(data.start_date),
        };
        delete dataToSend.end_date; // Backend calculates or keys mismatched? Usually backend ignores or re-calcs.

        const newChit = await createChit(dataToSend);
        queryClient.invalidateQueries({ queryKey: chitKeys.lists() });
        setCreatedChitId(newChit.id);
        setCreatedChitName(newChit.name);
        setOriginalData(newChit);
        setActiveTab("payouts");
        setSuccess("Chit details saved. You can now manage payouts.");
      } else if (mode === "create" && createdChitId) {
        // Patching existing logic
        // ... (Existing PATCH Logic for post-creation updates if any)
        const changes = {};
        // Compare with originalData
        // Note: originalData has fields like 'monthly_installment', data has 'monthly_installment'.
        // Ensure types match for comparison.
        for (const key in data) {
          if (originalData[key] !== undefined && data[key] != originalData[key]) {
            changes[key] = data[key];
          }
        }
        // ... Logic similar to below ...
        if (Object.keys(changes).length > 0) {
          const patchData = { ...changes };
          if (patchData.start_date) patchData.start_date = getFirstDayOfMonth(patchData.start_date);
          // ...
          const updatedChit = await patchChit(createdChitId, patchData);
          setCreatedChitName(updatedChit.name);
          setOriginalData(updatedChit);
        }
        setActiveTab("payouts");
        setSuccess("Chit details updated successfully!");

      } else if (mode === "edit") {
        const patchData = {
          ...data,
          start_date: getFirstDayOfMonth(data.start_date),
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
          errorMessage = err.response.data.detail
            .map((e) => `${e.loc[1]}: ${e.msg}`)
            .join(", ");
        } else {
          errorMessage = err.response.data.detail;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const currentName = getValues("name");
    if (mode === "create") {
      return createdChitName || "Create New Chit";
    }
    if (mode === "edit") return currentName || "Edit Chit";
    return currentName || "Chit Details";
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

  const handleNext = async () => {
    // If on details tab and creating/editing, trigger validation/submit
    if ((mode === "create" || mode === "edit") && activeTabIndex === 0) {
      // Trigger validation
      const isValidForm = await trigger();
      if (isValidForm) {
        // Submit form
        await handleRHSubmit(onSubmit)();
      }
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
    const currentName = getValues("name");
    if (mode === "edit") {
      navigate("/chits", {
        state: {
          success: `Chit "${currentName}" has been updated successfully!`,
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

      const formVals = getValues();
      const reportProps = {
        chit: {
          ...originalData,
          ...formVals,
          id: id,
        },
        payouts: payoutsData.payouts,
        assignments: assignmentsData.assignments,
        collections: collectionsData.collections,
      };

      let reportName = formVals.name;
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

  // --- VIEW MODE ---
  // View helper to decide if we show mobile or desktop
  // We use useMediaQuery to prevent duplicate DOM with same IDs
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (pageLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center mb-4 relative">
             <Skeleton.Text width="w-1/3" height="h-8" />
        </div>
        <hr className="my-4 border-border" />
        <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-5xl mx-auto">
            <div className="md:col-span-1">
                 <Skeleton.Card className="h-64" />
            </div>
            <div className="md:col-span-1">
                 <Skeleton.Card className="h-64" />
            </div>
        </div>
      </div>
    );
  }

  // View Mode passes values from getValues() to Dashboard? 
  const currentChitData = getValues();

  return (
    <>
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
          <div>
            <ChitViewDashboard
              chitData={currentChitData} // Passing form values as data
              chitId={id}
              onLogCollectionClick={handleLogCollectionClick}
              collectionDefaults={collectionDefaults}
              setCollectionDefaults={setCollectionDefaults}
            />
          </div>
        ) : (
          /* --- CREATE/EDIT MODE --- */
          /* Conditionally render based on screen size to prevent ID conflicts */
          <>
            {!isDesktop && (
              <div className="md:hidden">
                <ChitMobileContent
                  TABS={TABS}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  mode={mode}
                  chitId={id || createdChitId}
                  activeTabIndex={activeTabIndex}
                  isValid={isValid}
                  loading={loading}
                  handleNext={handleNext}
                  handleMiddle={handleMiddle}
                  handleMobileFormSubmit={handleMobileFormSubmit}
                  isPostCreation={!!(mode === "create" && createdChitId)}
                  onLogCollectionClick={handleLogCollectionClick}
                  collectionDefaults={collectionDefaults}
                  setCollectionDefaults={setCollectionDefaults}
                  // RHForm Props
                  control={control}
                  register={register}
                  errors={errors}
                />
              </div>
            )}

            {isDesktop && (
              <div className="hidden md:block">
                <form
                  id="chit-details-form-desktop"
                  onSubmit={handleRHSubmit(onSubmit)}
                >
                  <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-5xl mx-auto">
                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <DetailsSectionComponent
                          mode={mode}
                          control={control}
                          register={register}
                          errors={errors}
                          isPostCreation={
                            !!(mode === "create" && createdChitId)
                          }
                          onEnterKeyOnLastInput={() => handleRHSubmit(onSubmit)()}
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
                        <ChitDesktopActionButton
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
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ChitDetailPage;
