// frontend/src/features/chits/pages/ChitDetailPage.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";

import useScrollToTop from "../../../hooks/useScrollToTop";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { useChitForm } from "../hooks/useChitForm";
import { useChitReport } from "../hooks/useChitReport";
import Message from "../../../components/ui/Message";

import Card from "../../../components/ui/Card";
import TabButton from "../../../components/ui/TabButton";
import Skeleton from "../../../components/ui/Skeleton";
import ChitDetailsForm from "../components/forms/ChitDetailsForm";
import PayoutsSection from "../components/sections/PayoutsSection";
import ChitMembersManager from "../components/sections/ChitMembersManager";
import ChitMobileContent from "../components/sections/ChitMobileContent";
import AuctionsSection from "../components/sections/AuctionsSection";
import ChitDesktopActionButton from "../components/ui/ChitDesktopActionButton";
import ChitViewDashboard from "./ChitViewDashboard";
import CollectionHistoryList from "../../members/components/sections/CollectionHistoryList";
import {
  Info,
  Users,
  Loader2,
  ArrowLeft,
  SquarePen,
  Printer,
  WalletMinimal,
  TrendingUp,
  Gavel,
} from "lucide-react";

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

const AuctionsSectionComponent = ({ mode, chitId }) => (
  <Card className="flex-1 flex flex-col">
    <AuctionsSection mode={mode} chitId={chitId} />
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
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  // --- Mode Detection ---
  const mode = useMemo(() => {
    const path = location.pathname;
    if (path.includes("create")) return "create";
    if (path.includes("edit")) return "edit";
    return "view";
  }, [location.pathname]);

  // --- Custom Form Hook ---
  const {
    register,
    control,
    errors,
    isValid,
    handleSubmit,
    trigger,
    getValues,
    originalData,
    createdChitId,
    createdChitName,
    isPostCreation,
    pageLoading,
    isSubmitting,
    error,
    success,
    setError,
    setSuccess,
    TABS,
    watchedChitType,
    onSubmit,
  } = useChitForm(id, mode);

  // --- Local UI State ---
  const [activeTab, setActiveTab] = useState("details");
  const [collectionDefaults, setCollectionDefaults] = useState(null);

  // --- Report Generation Hook ---
  const currentChitData = getValues();
  const {
    isLoading: isReportLoading,
    generateReport: handlePrintReport,
  } = useChitReport({
    chitId: id,
    chitData: currentChitData,
    originalData,
  });

  // --- Derived Values ---
  const activeTabIndex = useMemo(() => TABS.indexOf(activeTab), [TABS, activeTab]);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // --- Scroll to Top on Messages ---
  useScrollToTop(success || error);

  // --- Handle Initial Tab from Navigation State ---
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- Handle Success Message from Navigation State ---
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setSuccess]);

  // --- Focus Title on Tab Change ---
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus({ preventScroll: true });
    }
  }, [activeTab]);

  // --- Form Submission Wrapper for Details Tab ---
  const handleFormSubmit = useCallback(
    async (data) => {
      await onSubmit(data, {
        onSuccessCallback: () => {
          // Move to next tab after successful submission
          if (mode === "create" && !createdChitId) {
            setActiveTab("payouts");
          } else if (mode === "edit" && activeTabIndex < TABS.length - 1) {
            setActiveTab(TABS[activeTabIndex + 1]);
          }
        },
      });
    },
    [onSubmit, mode, createdChitId, activeTabIndex, TABS]
  );

  // --- Mobile Form Submit Handler ---
  const handleMobileFormSubmit = useCallback(
    async (e) => {
      if (activeTab !== "details") return;

      if (activeTabIndex === TABS.length - 1) {
        handleFinalAction();
      } else if (mode === "create" && activeTabIndex === 0) {
        await handleSubmit(handleFormSubmit)(e);
      } else {
        if (activeTabIndex < TABS.length - 1) {
          setActiveTab(TABS[activeTabIndex + 1]);
        }
      }
    },
    [activeTab, activeTabIndex, TABS, mode, handleSubmit, handleFormSubmit]
  );

  // --- Page Title ---
  const getTitle = useCallback(() => {
    const currentName = getValues("name");
    if (mode === "create") {
      return createdChitName || "Create New Chit";
    }
    if (mode === "edit") return currentName || "Edit Chit";
    return currentName || "Chit Details";
  }, [mode, createdChitName, getValues]);

  // --- Navigation Handlers ---
  const handleBackNavigation = useCallback(() => {
    if (activeTabIndex > 0 && mode !== "view") {
      setActiveTab(TABS[activeTabIndex - 1]);
    } else {
      navigate("/chits");
    }
  }, [activeTabIndex, mode, TABS, navigate]);

  const handleSkip = useCallback(() => {
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  }, [activeTabIndex, TABS]);

  const handleNext = useCallback(async () => {
    if ((mode === "create" || mode === "edit") && activeTabIndex === 0) {
      const isValidForm = await trigger();
      if (isValidForm) {
        await handleSubmit(handleFormSubmit)();
      }
      return;
    }

    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  }, [mode, activeTabIndex, trigger, handleSubmit, handleFormSubmit, TABS]);

  const handleFinalAction = useCallback(() => {
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
  }, [mode, createdChitId, createdChitName, getValues, navigate]);

  const handleMiddle = useCallback(() => {
    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else {
      handleSkip();
    }
  }, [activeTabIndex, TABS.length, handleSkip, handleFinalAction]);

  const handleLogCollectionClick = useCallback(
    (assignment) => {
      setCollectionDefaults({
        assignmentId: assignment.id,
        chitId: assignment.chit.id,
        memberId: assignment.member.id,
      });
      if (mode !== "view") {
        setActiveTab("collections");
      }
    },
    [mode]
  );

  // --- Loading State ---
  if (pageLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center mb-4 relative">
          <Skeleton.Text width="w-1/3" height="h-8" />
        </div>
        <hr className="my-4 border-border" />
        <div className="w-full space-y-6">
          <Skeleton.Card className="h-64" />
          <Skeleton.Card className="h-48" />
          <Skeleton.Card className="h-48" />
        </div>
      </div>
    );
  }

  const effectiveChitId = id || createdChitId;

  return (
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
        <div className="w-full max-w-2xl mx-auto print:hidden" role="alert" aria-live="polite">
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
              chitData={currentChitData}
              chitId={id}
              onLogCollectionClick={handleLogCollectionClick}
              collectionDefaults={collectionDefaults}
              setCollectionDefaults={setCollectionDefaults}
            />
          </div>
        ) : (
          /* --- CREATE/EDIT MODE --- */
          <>
            {!isDesktop && (
              <div className="md:hidden">
                <ChitMobileContent
                  TABS={TABS}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  mode={mode}
                  chitId={effectiveChitId}
                  activeTabIndex={activeTabIndex}
                  isValid={isValid}
                  loading={isSubmitting}
                  handleNext={handleNext}
                  handleMiddle={handleMiddle}
                  handleMobileFormSubmit={handleMobileFormSubmit}
                  isPostCreation={isPostCreation}
                  onLogCollectionClick={handleLogCollectionClick}
                  collectionDefaults={collectionDefaults}
                  setCollectionDefaults={setCollectionDefaults}
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
                  onSubmit={handleSubmit(handleFormSubmit)}
                >
                  {/* Stacked Full-Width Sections Layout */}
                  <div className="w-full space-y-6">
                    {/* Details Form Section */}
                    <DetailsSectionComponent
                      mode={mode}
                      control={control}
                      register={register}
                      errors={errors}
                      isPostCreation={isPostCreation}
                      onEnterKeyOnLastInput={() => handleSubmit(handleFormSubmit)()}
                    />

                    <ChitDesktopActionButton
                      mode={mode}
                      loading={isSubmitting}
                      isPostCreation={isPostCreation}
                    />

                    {/* Auctions Section (if auction type) */}
                    {watchedChitType === "auction" && (
                      <AuctionsSectionComponent
                        mode={mode}
                        chitId={effectiveChitId}
                      />
                    )}

                    {/* Payouts Section */}
                    <PayoutsSectionComponent
                      mode={mode}
                      chitId={effectiveChitId}
                    />

                    {/* Members Section */}
                    <MembersSectionComponent
                      mode={mode}
                      chitId={effectiveChitId}
                      onLogCollectionClick={handleLogCollectionClick}
                    />

                    {/* Collections Section */}
                    <CollectionHistoryList
                      chitId={effectiveChitId}
                      mode={mode}
                      collectionDefaults={collectionDefaults}
                      setCollectionDefaults={setCollectionDefaults}
                    />
                  </div>
                </form>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default ChitDetailPage;
