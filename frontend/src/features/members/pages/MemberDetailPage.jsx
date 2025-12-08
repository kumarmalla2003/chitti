// frontend/src/features/members/pages/MemberDetailPage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import MobileNav from "../../../components/layout/MobileNav";
import BottomNav from "../../../components/layout/BottomNav";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import MemberDetailsForm from "../components/MemberDetailsForm";
import MemberChitsManager from "../components/MemberChitsManager";
import CollectionHistoryList from "../../collections/components/CollectionHistoryList";
import Message from "../../../components/ui/Message";
import StepperButtons from "../../../components/ui/StepperButtons";
import { useMember, useCreateMember, usePatchMember } from "../hooks/useMember"; // Correct hooks
import { useCreateMember as useCreateMemberMutation } from "../hooks/useMembers"; // Actually created in useMembers.js
import { getAssignmentsForMember } from "../../chits/api/assignmentsService";
import { getCollectionsByMemberId } from "../../collections/api/collectionsService";

import MemberReportPDF from "../components/MemberReportPDF";
import { pdf } from "@react-pdf/renderer";

import MemberViewDashboard from "./MemberViewDashboard";

import {
  Loader2,
  User,
  Layers,
  ArrowLeft,
  Plus,
  SquarePen,
  Printer,
  IndianRupee,
} from "lucide-react";

// Helper components (DetailsSection, DesktopActionButton, TabButton, MobileContent)
// Re-implementing them here or assuming they exist. I will re-implement logic inside main component for brevity and correctness with hooks.

const DetailsSection = ({
  mode,
  formData,
  onFormChange,
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
      formData={formData}
      onFormChange={onFormChange}
      onEnterKeyOnLastInput={onEnterKeyOnLastInput}
      isPostCreation={isPostCreation}
    />
  </Card>
);

const DesktopActionButton = ({ mode, loading, isPostCreation }) => {
  if (mode === "view") return null;

  let buttonText, Icon, buttonVariant;

  if (mode === "create") {
    if (isPostCreation) {
      buttonText = "Update Member";
      Icon = SquarePen;
      buttonVariant = "warning";
    } else {
      buttonText = "Create Member";
      Icon = Plus;
      buttonVariant = "success";
    }
  } else {
    buttonText = "Update Member";
    Icon = SquarePen;
    buttonVariant = "warning";
  }

  return (
    <div className="md:col-start-2 md:flex md:justify-end">
      <Button
        type="submit"
        form="member-details-form-desktop"
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
        className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${
          isActive
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
  createdMemberId,
  formData,
  onFormChange,
  activeTabIndex,
  isDetailsFormValid,
  detailsLoading,
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
          icon={User}
          label="Details"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          ref={(el) => (tabRefs.current["chits"] = el)}
          name="chits"
          icon={Layers}
          label="Chits"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !createdMemberId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["collections"] = el)}
          name="collections"
          icon={IndianRupee}
          label="Collections"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !createdMemberId}
        />
      </div>

      {activeTab === "details" && (
        <form onSubmit={handleMobileFormSubmit}>
          <DetailsSection
            mode={mode}
            formData={formData}
            onFormChange={onFormChange}
            onEnterKeyOnLastInput={handleNext}
            isPostCreation={isPostCreation}
          />
          {mode !== "view" && (
            <StepperButtons
              currentStep={activeTabIndex}
              totalSteps={TABS.length}
              onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
              onNext={handleNext}
              onMiddle={handleMiddle}
              isNextDisabled={activeTabIndex === 0 && !isDetailsFormValid}
              loading={detailsLoading}
              mode={mode}
              isPostCreation={isPostCreation}
            />
          )}
        </form>
      )}

      {activeTab === "chits" && (
        <>
          <MemberChitsManager
            mode={mode}
            memberId={createdMemberId}
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
              loading={detailsLoading}
              mode={mode}
              isPostCreation={isPostCreation}
            />
          )}
        </>
      )}

      {activeTab === "collections" && (
        <>
          <CollectionHistoryList
            memberId={createdMemberId}
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
              loading={detailsLoading}
              mode={mode}
              isPostCreation={isPostCreation}
            />
          )}
        </>
      )}
    </div>
  );
};

const MemberDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({ full_name: "", phone_number: "" });
  const [originalData, setOriginalData] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdMemberId, setCreatedMemberId] = useState(null);
  const [createdMemberName, setCreatedMemberName] = useState(null);

  const [collectionDefaults, setCollectionDefaults] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // --- React Query Hooks ---
  // If mode is create, id is undefined, hook should be disabled
  const { data: member, isLoading: pageLoading, error: queryError } = useMember(id);
  const createMemberMutation = useCreateMemberMutation();
  const patchMemberMutation = usePatchMember();

  const detailsLoading = createMemberMutation.isPending || patchMemberMutation.isPending;

  useScrollToTop(success || error || queryError);

  const TABS = ["details", "chits", "collections"];
  const activeTabIndex = TABS.indexOf(activeTab);

  const isDetailsFormValid = useMemo(
    () =>
      formData.full_name.trim() !== "" &&
      formData.phone_number.trim().length === 10,
    [formData]
  );

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    if (isCreate) {
      setMode("create");
    } else if (isEdit) {
      setMode("edit");
      if (location.state?.initialTab) {
        setActiveTab(location.state.initialTab);
        window.history.replaceState({}, document.title);
      }
    } else {
      setMode("view");
    }
  }, [location.pathname, location.state]);

  // Populate form
  useEffect(() => {
    if (member && mode !== "create") {
      const fetchedData = {
        full_name: member.full_name,
        phone_number: member.phone_number,
      };
      setFormData(fetchedData);
      setOriginalData(fetchedData);
    }
  }, [member, mode]);

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

    if (activeTab !== "details") {
      return;
    }

    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else if (mode === "create" && activeTabIndex === 0) {
      await handleDetailsSubmit();
    } else {
      if (mode === "edit" && activeTabIndex === 0) {
        await handleDetailsSubmit();
      } else if (activeTabIndex < TABS.length - 1) {
        setActiveTab(TABS[activeTabIndex + 1]);
      }
    }
  };

  const handleDetailsSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);
    setSuccess(null);

    if (mode === "create" && !createdMemberId) {
      createMemberMutation.mutate(formData, {
        onSuccess: (newMember) => {
          setCreatedMemberId(newMember.id);
          setCreatedMemberName(newMember.full_name);
          setOriginalData(formData);
          setActiveTab("chits");
          setSuccess("Member details saved. You can now assign them to a chit.");
        },
        onError: (err) => setError({ context: "details", message: err.message }),
      });
    } else if (mode === "create" && createdMemberId) {
        // Patching newly created member
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }
        if (Object.keys(changes).length > 0) {
            patchMemberMutation.mutate({ id: createdMemberId, data: changes }, {
                onSuccess: (updatedMember) => {
                    setCreatedMemberName(updatedMember.full_name);
                    setOriginalData(formData);
                    setSuccess("Member details updated.");
                    setActiveTab("chits");
                },
                onError: (err) => setError({ context: "details", message: err.message }),
            });
        } else {
            setActiveTab("chits");
        }
    } else if (mode === "edit") {
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }
        if (Object.keys(changes).length > 0) {
            patchMemberMutation.mutate({ id, data: changes }, {
                onSuccess: () => {
                    setOriginalData(formData);
                    setSuccess("Member details updated.");
                    if (activeTabIndex < TABS.length - 1) {
                        setActiveTab(TABS[activeTabIndex + 1]);
                    }
                },
                onError: (err) => setError({ context: "details", message: err.message }),
            });
        } else if (activeTabIndex < TABS.length - 1) {
            setActiveTab(TABS[activeTabIndex + 1]);
        }
    }
  };

  // ... (Title, Navigation handlers, Report generation same as before) ...
  const getTitle = () => {
    if (mode === "create") {
      return createdMemberName || "Create New Member";
    }
    return (
      formData.full_name || (mode === "edit" ? "Edit Member" : "Member Details")
    );
  };

  const handleBackNavigation = () => {
    if (activeTabIndex > 0) {
      setActiveTab(TABS[activeTabIndex - 1]);
    } else {
      navigate("/members");
    }
  };

  const handleSkip = () => {
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1]);
    }
  };

  const handleNext = () => {
    if (activeTabIndex === 0) {
      handleDetailsSubmit();
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
    const memberIdToView = mode === "create" ? createdMemberId : id;
    const memberName =
      mode === "create" ? createdMemberName : formData.full_name;

    const successMessage =
      mode === "create"
        ? `Member "${memberName}" has been created successfully!`
        : `Member "${memberName}" has been updated successfully!`;

    if (mode === "edit" && originalData) {
      const changes = {};
      for (const key in formData) {
        if (formData[key] !== originalData[key]) {
          changes[key] = formData[key];
        }
      }
      if (Object.keys(changes).length > 0) {
        // Trigger submit logic, but we need to wait for it or handle it via mutation state.
        // For simplicity in this refactor, I'll just trigger it and let onSuccess handle nav if I passed a callback,
        // but hooks are async.
        // I will just call mutate directly here if I want to redirect after.
        patchMemberMutation.mutate({ id, data: changes }, {
            onSuccess: () => {
                navigate(`/members/view/${memberIdToView}`, {
                    state: { success: successMessage },
                });
            }
        });
        return;
      }
    }

    navigate(`/members/view/${memberIdToView}`, {
      state: { success: successMessage },
    });
  };

  const handleLogCollectionClick = (assignment) => {
    setCollectionDefaults({
      assignmentId: assignment.id,
      chitId: assignment.chit.id,
      memberId: assignment.member.id,
    });
    setActiveTab("collections");
  };

  const handlePrint = async () => {
    const targetId = mode === "create" ? createdMemberId : id;
    if (!targetId) return;

    setIsPrinting(true);
    setError(null);

    try {
      const memberObj = {
        id: targetId,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
      };

      const [assignmentsData, collectionsData] = await Promise.all([
        getAssignmentsForMember(targetId),
        getCollectionsByMemberId(targetId),
      ]);

      const reportProps = {
        member: memberObj,
        assignments: assignmentsData,
        collections: collectionsData.collections,
      };

      const reportName = `${memberObj.full_name} Report`;
      const blob = await pdf(<MemberReportPDF {...reportProps} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print failed", err);
      setError({
        context: "page",
        message: "Failed to generate member report.",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleManageChits = () => {
    navigate(`/members/edit/${id}`, { state: { initialTab: "chits" } });
  };

  const handleManageCollections = () => {
    navigate(`/members/edit/${id}`, { state: { initialTab: "collections" } });
  };

  if (pageLoading && mode !== "create") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  const isPostCreation = !!(mode === "create" && createdMemberId);

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
                    {/* Edit Button */}
                    <button
                      onClick={() => navigate(`/members/edit/${id}`)}
                      className="p-2 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200"
                      title="Edit Member"
                    >
                      <SquarePen className="w-6 h-6" />
                    </button>
                    {/* Print Button */}
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
              {mode === "view" && originalData ? (
                <div className="max-w-7xl mx-auto">
                  <MemberViewDashboard
                    memberData={formData}
                    memberId={id}
                    onLogCollectionClick={handleLogCollectionClick}
                    collectionDefaults={collectionDefaults}
                    setCollectionDefaults={setCollectionDefaults}
                    // --- Pass Manage Handlers ---
                    onManageChits={handleManageChits}
                    onManageCollections={handleManageCollections}
                  />
                </div>
              ) : (
                /* --- EDIT / CREATE MODE --- */
                <>
                  <div className="md:hidden">
                    <MobileContent
                      TABS={TABS}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      mode={mode}
                      createdMemberId={createdMemberId || id}
                      formData={formData}
                      onFormChange={handleFormChange}
                      activeTabIndex={activeTabIndex}
                      isDetailsFormValid={isDetailsFormValid}
                      detailsLoading={detailsLoading}
                      handleNext={handleNext}
                      handleMiddle={handleMiddle}
                      handleMobileFormSubmit={handleMobileFormSubmit}
                      isPostCreation={isPostCreation}
                      onLogCollectionClick={handleLogCollectionClick}
                      collectionDefaults={collectionDefaults}
                      setCollectionDefaults={setCollectionDefaults}
                    />
                  </div>

                  <div className="hidden md:block">
                    <form
                      id="member-details-form-desktop"
                      onSubmit={handleDetailsSubmit}
                    >
                      <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-4xl mx-auto">
                        {activeTab === "details" && (
                          <div className="md:col-span-1">
                            <DetailsSection
                              mode={mode}
                              formData={formData}
                              onFormChange={handleFormChange}
                              onEnterKeyOnLastInput={handleDetailsSubmit}
                              isPostCreation={isPostCreation}
                            />
                          </div>
                        )}

                        {activeTab === "chits" && (
                          <div className="md:col-span-2 flex flex-col gap-8">
                            <MemberChitsManager
                              mode={mode}
                              memberId={createdMemberId || id}
                              onLogCollectionClick={handleLogCollectionClick}
                            />
                          </div>
                        )}

                        {activeTab === "collections" && (
                          <div className="md:col-span-2 flex flex-col gap-8">
                            <CollectionHistoryList
                              memberId={createdMemberId || id}
                              mode={mode}
                              collectionDefaults={collectionDefaults}
                              setCollectionDefaults={setCollectionDefaults}
                            />
                          </div>
                        )}

                        {activeTab === "details" && (
                          <div className="md:col-span-1 flex flex-col gap-8">
                            <MemberChitsManager
                              mode={mode}
                              memberId={createdMemberId || id}
                              onLogCollectionClick={handleLogCollectionClick}
                            />
                            <CollectionHistoryList
                              memberId={createdMemberId || id}
                              mode={mode}
                              collectionDefaults={collectionDefaults}
                              setCollectionDefaults={setCollectionDefaults}
                            />
                          </div>
                        )}

                        <div className="md:col-span-2 flex items-center border-b border-border -mt-8">
                          <TabButton
                            name="details"
                            icon={User}
                            label="Details"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                          />
                          <TabButton
                            name="chits"
                            icon={Layers}
                            label="Chits"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            disabled={mode === "create" && !createdMemberId}
                          />
                          <TabButton
                            name="collections"
                            icon={IndianRupee}
                            label="Collections"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            disabled={mode === "create" && !createdMemberId}
                          />
                        </div>

                        {mode !== "view" && activeTab === "details" && (
                          <div className="md:col-span-2">
                            <DesktopActionButton
                              mode={mode}
                              loading={detailsLoading}
                              isPostCreation={isPostCreation}
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
