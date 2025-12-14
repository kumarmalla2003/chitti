// frontend/src/features/members/pages/MemberDetailPage.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import useScrollToTop from "../../../hooks/useScrollToTop";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { useMemberForm } from "../hooks/useMemberForm";
import { useMemberReport } from "../hooks/useMemberReport";
import Message from "../../../components/ui/Message";

import Card from "../../../components/ui/Card";
import TabButton from "../../../components/ui/TabButton";
import Skeleton from "../../../components/ui/Skeleton";
import MemberDetailsForm from "../components/forms/MemberDetailsForm";
import MemberChitsManager from "../components/sections/MemberChitsManager";
import MemberMobileContent from "../components/sections/MemberMobileContent";
import MemberDesktopActionButton from "../components/ui/MemberDesktopActionButton";
import CollectionHistoryList from "../components/sections/CollectionHistoryList";
import MemberViewDashboard from "./MemberViewDashboard";

import {
  Loader2,
  User,
  Layers,
  ArrowLeft,
  SquarePen,
  Printer,
  IndianRupee,
} from "lucide-react";

// --- Helper Component for Desktop Details Section ---
const DetailsSection = ({
  mode,
  control,
  register,
  errors,
  onEnterKeyOnLastInput,
  isPostCreation,
}) => (
  <Card className="h-full">
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <User className="w-6 h-6" /> Member Details
    </h2>
    <hr className="border-border mb-4" />
    <MemberDetailsForm
      mode={mode}
      control={control}
      register={register}
      errors={errors}
      onEnterKeyOnLastInput={onEnterKeyOnLastInput}
      isPostCreation={isPostCreation}
    />
  </Card>
);

/**
 * MemberDetailPage component - handles create, edit, and view modes for member details.
 */
const MemberDetailPage = () => {
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
    createdMemberId,
    createdMemberName,
    isPostCreation,
    pageLoading,
    isSubmitting,
    error,
    success,
    setError,
    setSuccess,
    onSubmit,
  } = useMemberForm(id, mode);

  // --- Local UI State ---
  const [activeTab, setActiveTab] = useState("details");
  const [collectionDefaults, setCollectionDefaults] = useState(null);

  // --- Report Generation Hook ---
  const currentMemberData = getValues();
  const {
    isLoading: isPrinting,
    generateReport: handlePrint,
  } = useMemberReport({
    memberId: id || createdMemberId,
    memberData: currentMemberData,
  });

  // --- Derived Values ---
  const TABS = ["details", "chits", "collections"];
  const activeTabIndex = useMemo(() => TABS.indexOf(activeTab), [activeTab]);
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

  // --- Form Submission Wrapper ---
  const handleFormSubmit = useCallback(
    async (data) => {
      await onSubmit(data, {
        onSuccessCallback: () => {
          if (mode === "create" && !createdMemberId) {
            setActiveTab("chits");
          } else if (mode === "edit" && activeTabIndex < TABS.length - 1) {
            setActiveTab(TABS[activeTabIndex + 1]);
          }
        },
      });
    },
    [onSubmit, mode, createdMemberId, activeTabIndex, TABS]
  );

  // --- Mobile Form Submit Handler ---
  const handleMobileFormSubmit = useCallback(
    async (e) => {
      if (activeTab !== "details") return;

      if (activeTabIndex === TABS.length - 1) {
        handleFinalAction();
      } else if (mode === "create" && activeTabIndex === 0) {
        await handleSubmit(handleFormSubmit)(e);
      } else if (mode === "edit" && activeTabIndex === 0) {
        await handleSubmit(handleFormSubmit)(e);
      } else if (activeTabIndex < TABS.length - 1) {
        setActiveTab(TABS[activeTabIndex + 1]);
      }
    },
    [activeTab, activeTabIndex, TABS, mode, handleSubmit, handleFormSubmit]
  );

  // --- Page Title ---
  const getTitle = useCallback(() => {
    const fullName = getValues("full_name");
    if (mode === "create") {
      return createdMemberName || "Create New Member";
    }
    return fullName || (mode === "edit" ? "Edit Member" : "Member Details");
  }, [mode, createdMemberName, getValues]);

  // --- Navigation Handlers ---
  const handleBackNavigation = useCallback(() => {
    if (activeTabIndex > 0) {
      setActiveTab(TABS[activeTabIndex - 1]);
    } else {
      navigate("/members");
    }
  }, [activeTabIndex, TABS, navigate]);

  const handleSkip = useCallback(() => {
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  }, [activeTabIndex, TABS]);

  const handleNext = useCallback(async () => {
    if (activeTabIndex === 0) {
      const isValidForm = await trigger();
      if (isValidForm) {
        await handleSubmit(handleFormSubmit)();
      }
      return;
    }
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  }, [activeTabIndex, trigger, handleSubmit, handleFormSubmit, TABS]);

  const handleMiddle = useCallback(() => {
    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else {
      handleSkip();
    }
  }, [activeTabIndex, TABS.length, handleSkip]);

  const handleFinalAction = useCallback(() => {
    const memberIdToView = mode === "create" ? createdMemberId : id;
    const memberName = mode === "create" ? createdMemberName : getValues("full_name");

    const successMessage =
      mode === "create"
        ? `Member "${memberName}" has been created successfully!`
        : `Member "${memberName}" has been updated successfully!`;

    navigate(`/members/view/${memberIdToView}`, {
      state: { success: successMessage },
    });
  }, [mode, createdMemberId, createdMemberName, id, getValues, navigate]);

  const handleLogCollectionClick = useCallback((assignment) => {
    setCollectionDefaults({
      assignmentId: assignment.id,
      chitId: assignment.chit.id,
      memberId: assignment.member.id,
    });
    setActiveTab("collections");
  }, []);

  const handleManageChits = useCallback(() => {
    navigate(`/members/edit/${id}`, { state: { initialTab: "chits" } });
  }, [id, navigate]);

  const handleManageCollections = useCallback(() => {
    navigate(`/members/edit/${id}`, { state: { initialTab: "collections" } });
  }, [id, navigate]);

  // --- Loading State ---
  if (pageLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center mb-4 relative">
          <Skeleton.Text width="w-1/3" height="h-8" />
        </div>
        <hr className="my-4 border-border" />
        <div className="w-full space-y-6">
          <Skeleton.Card className="h-40" />
          <Skeleton.Card className="h-48" />
          <Skeleton.Card className="h-48" />
        </div>
      </div>
    );
  }

  const effectiveMemberId = id || createdMemberId;

  return (
    <>
      <div className="container mx-auto">
        <div className="relative flex justify-center items-center mb-4">
          <button
            onClick={handleBackNavigation}
            className="absolute left-0 text-text-primary hover:text-accent transition-colors"
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

          {/* --- Header Actions (Edit, Print) --- */}
          {mode === "view" && (
            <div className="absolute right-0 flex items-center">
              <button
                onClick={() => navigate(`/members/edit/${id}`)}
                className="p-2 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200"
                title="Edit Member"
              >
                <SquarePen className="w-6 h-6" />
              </button>
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200 disabled:opacity-50"
                title="Print Member Report"
              >
                {isPrinting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Printer className="w-6 h-6" />
                )}
              </button>
            </div>
          )}
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

        {/* --- DASHBOARD VIEW MODE --- */}
        {mode === "view" ? (
          <div>
            <MemberViewDashboard
              memberData={currentMemberData}
              memberId={id}
              onLogCollectionClick={handleLogCollectionClick}
              collectionDefaults={collectionDefaults}
              setCollectionDefaults={setCollectionDefaults}
              onManageChits={handleManageChits}
              onManageCollections={handleManageCollections}
            />
          </div>
        ) : (
          /* --- EDIT / CREATE MODE --- */
          <>
            {!isDesktop && (
              <div className="md:hidden">
                <MemberMobileContent
                  TABS={TABS}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  mode={mode}
                  createdMemberId={effectiveMemberId}
                  activeTabIndex={activeTabIndex}
                  isValid={isValid}
                  detailsLoading={isSubmitting}
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
                  id="member-details-form-desktop"
                  onSubmit={handleSubmit(handleFormSubmit)}
                >
                  {/* Stacked Full-Width Sections Layout */}
                  <div className="w-full space-y-6">
                    {/* Details Form Section */}
                    <DetailsSection
                      mode={mode}
                      control={control}
                      register={register}
                      errors={errors}
                      onEnterKeyOnLastInput={() => handleSubmit(handleFormSubmit)()}
                      isPostCreation={isPostCreation}
                    />

                    {mode !== "view" && (
                      <MemberDesktopActionButton
                        mode={mode}
                        loading={isSubmitting}
                        isPostCreation={isPostCreation}
                      />
                    )}

                    {/* Chits Section */}
                    <MemberChitsManager
                      mode={mode}
                      memberId={effectiveMemberId}
                      onLogCollectionClick={handleLogCollectionClick}
                    />

                    {/* Collections Section */}
                    <CollectionHistoryList
                      memberId={effectiveMemberId}
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
    </>
  );
};

export default MemberDetailPage;
