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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({ full_name: "", phone_number: "" });
  const [originalData, setOriginalData] = useState(null);

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

    const fetchMember = async () => {
      setPageLoading(true);
      try {
        const memberData = await getMemberById(id);
        const fetchedData = {
          full_name: memberData.full_name,
          phone_number: memberData.phone_number,
        };
        setFormData(fetchedData);
        setOriginalData(fetchedData);
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
  }, [id, location.pathname, isLoggedIn, location.state]);

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
    setDetailsLoading(true);
    try {
      if (mode === "create" && !createdMemberId) {
        const newMember = await createMember(formData);
        setCreatedMemberId(newMember.id);
        setCreatedMemberName(newMember.full_name);
        setOriginalData(formData);
        setActiveTab("chits");
        setSuccess("Member details saved. You can now assign them to a chit.");
      } else if (mode === "create" && createdMemberId) {
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }
        if (Object.keys(changes).length > 0) {
          const updatedMember = await patchMember(
            createdMemberId,
            changes
          );
          setCreatedMemberName(updatedMember.full_name);
          setOriginalData(formData);
          setSuccess("Member details updated.");
        }
        setActiveTab("chits");
      } else if (mode === "edit") {
        const changes = {};
        for (const key in formData) {
          if (formData[key] !== originalData[key]) {
            changes[key] = formData[key];
          }
        }
        if (Object.keys(changes).length > 0) {
          await patchMember(id, changes);
          setOriginalData(formData);
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
        handleDetailsSubmit();
        navigate(`/members/view/${memberIdToView}`, {
          state: { success: successMessage },
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

  if (pageLoading) {
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
              {mode === "view" ? (
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
                    <MemberMobileContent
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
