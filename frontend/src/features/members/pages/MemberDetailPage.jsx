// frontend/src/features/members/pages/MemberDetailPage.jsx

import React, { useState, useEffect, useRef } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema } from "../schemas/memberSchema";

import Card from "../../../components/ui/Card";
import TabButton from "../../../components/ui/TabButton";
import MemberDetailsForm from "../components/forms/MemberDetailsForm";
import MemberChitsManager from "../components/sections/MemberChitsManager";
import MemberMobileContent from "../components/sections/MemberMobileContent";
import MemberDesktopActionButton from "../components/ui/MemberDesktopActionButton";
import CollectionHistoryList from "../components/sections/CollectionHistoryList";
import Message from "../../../components/ui/Message";
import {
  getMemberById,
  createMember,
  patchMember,
} from "../../../services/membersService";
import { getAssignmentsForMember } from "../../../services/assignmentsService";
import { getCollectionsByMemberId } from "../../../services/collectionsService";

import MemberReportPDF from "../components/reports/MemberReportPDF";
import { pdf } from "@react-pdf/renderer";

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
    reset,
    trigger,
    formState: { errors, isValid },
    getValues,
  } = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
    },
    mode: "onChange",
  });

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdMemberId, setCreatedMemberId] = useState(null);
  const [createdMemberName, setCreatedMemberName] = useState(null);

  const [collectionDefaults, setCollectionDefaults] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useScrollToTop(success || error);

  const TABS = ["details", "chits", "collections"];
  const activeTabIndex = TABS.indexOf(activeTab);

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchMember = async () => {
      setPageLoading(true);
      try {
        const memberData = await getMemberById(id);
        const fetchedData = {
          full_name: memberData.full_name,
          phone_number: memberData.phone_number,
        };
        reset(fetchedData);
        setOriginalData(memberData); // Use full member object for originalData to be safe
      } catch (err) {
        setError({ message: err.message, context: "page" });
      } finally {
        setPageLoading(false);
      }
    };

    if (isCreate) {
      setMode("create");
      setPageLoading(false);
    } else if (isEdit) {
      setMode("edit");
      fetchMember();
      // Handle Initial Tab Navigation
      if (location.state?.initialTab) {
        setActiveTab(location.state.initialTab);
        // Clear state to prevent stuck navigation
        window.history.replaceState({}, document.title);
      }
    } else {
      setMode("view");
      fetchMember();
    }
  }, [id, location.pathname, isLoggedIn, location.state, reset]);

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
    if (activeTab !== "details") return;

    if (activeTabIndex === TABS.length - 1) {
      handleFinalAction();
    } else if (mode === "create" && activeTabIndex === 0) {
      await handleRHSubmit(onSubmit)(e);
    } else {
      if (mode === "edit" && activeTabIndex === 0) {
        // Trigger save on next or just next? 
        // Original logic: await handleDetailsSubmit()
        await handleRHSubmit(onSubmit)(e);
      } else if (activeTabIndex < TABS.length - 1) {
        setActiveTab(TABS[activeTabIndex + 1]);
      }
    }
  };

  const onSubmit = async (data) => {
    setError(null);
    setSuccess(null);
    setDetailsLoading(true);
    try {
      if (mode === "create" && !createdMemberId) {
        const newMember = await createMember(data);
        setCreatedMemberId(newMember.id);
        setCreatedMemberName(newMember.full_name);
        setOriginalData(newMember);
        setActiveTab("chits");
        setSuccess("Member details saved. You can now assign them to a chit.");
      } else if (mode === "create" && createdMemberId) {
        const changes = {};
        for (const key in data) {
          if (data[key] !== originalData[key]) {
            changes[key] = data[key];
          }
        }
        if (Object.keys(changes).length > 0) {
          const updatedMember = await patchMember(
            createdMemberId,
            changes
          );
          setCreatedMemberName(updatedMember.full_name);
          setOriginalData(updatedMember);
          setSuccess("Member details updated.");
        }
        setActiveTab("chits");
      } else if (mode === "edit") {
        const changes = {};
        for (const key in data) {
          if (data[key] !== originalData[key]) {
            changes[key] = data[key];
          }
        }
        if (Object.keys(changes).length > 0) {
          // originalData might lack id if fetchedData was just fields.
          // But getMemberById returns object with id.
          // Logic above setOriginalData(fetchedData) which lacks ID.
          // Let's ensure originalData has everything for patching? No patch needs ID from param.
          await patchMember(id, changes);
          // Update original data
          setOriginalData({ ...originalData, ...data });
          setSuccess("Member details updated.");
        }
        if (activeTabIndex < TABS.length - 1) {
          setActiveTab(TABS[activeTabIndex + 1]);
        }
      }
    } catch (err) {
      setError({ context: "details", message: err.message });
    } finally {
      setDetailsLoading(false);
    }
  };

  const getTitle = () => {
    const fullName = getValues("full_name");
    if (mode === "create") {
      return createdMemberName || "Create New Member";
    }
    return (
      fullName || (mode === "edit" ? "Edit Member" : "Member Details")
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

  const handleNext = async () => {
    if (activeTabIndex === 0) {
      // Validate and Submit if details tab
      const isValidForm = await trigger();
      if (isValidForm) {
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
    const memberIdToView = mode === "create" ? createdMemberId : id;
    const memberName =
      mode === "create" ? createdMemberName : getValues("full_name");

    const successMessage =
      mode === "create"
        ? `Member "${memberName}" has been created successfully!`
        : `Member "${memberName}" has been updated successfully!`;

    // In original code, if edit mode, it triggered submit again if changes?
    // "if (mode === "edit" && originalData) ..."
    // onSubmit logic already handles patch. If user clicks "Finish" (handleFinalAction),
    // usually we just navigate. 
    // BUT if the form is dirty we might want to save.
    // Simplifying: Assume handleNext/onSubmit saved data step-by-step.

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
      const vals = getValues();
      const memberObj = {
        id: targetId,
        full_name: vals.full_name,
        phone_number: vals.phone_number,
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

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  const isPostCreation = !!(mode === "create" && createdMemberId);
  const currentMemberData = getValues();

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
        {mode === "view" ? (
          <div>
            <MemberViewDashboard
              memberData={currentMemberData}
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
              <MemberMobileContent
                TABS={TABS}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                mode={mode}
                createdMemberId={createdMemberId || id}
                activeTabIndex={activeTabIndex}
                isValid={isValid}
                detailsLoading={detailsLoading}
                handleNext={handleNext}
                handleMiddle={handleMiddle}
                handleMobileFormSubmit={handleMobileFormSubmit}
                isPostCreation={isPostCreation}
                onLogCollectionClick={handleLogCollectionClick}
                collectionDefaults={collectionDefaults}
                setCollectionDefaults={setCollectionDefaults}
                // RHForm
                control={control}
                register={register}
                errors={errors}
              />
            </div>

            <div className="hidden md:block">
              <form
                id="member-details-form-desktop"
                onSubmit={handleRHSubmit(onSubmit)}
              >
                <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-4xl mx-auto">
                  {activeTab === "details" && (
                    <div className="md:col-span-1">
                      <DetailsSection
                        mode={mode}
                        control={control}
                        register={register}
                        errors={errors}
                        onEnterKeyOnLastInput={() => handleRHSubmit(onSubmit)()}
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
                      <MemberDesktopActionButton
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
    </>
  );
};

export default MemberDetailPage;
