// frontend/src/pages/MemberDetailPage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MemberDetailsForm from "../components/forms/MemberDetailsForm";
import MemberChitsManager from "../components/sections/MemberChitsManager";
import Message from "../components/ui/Message";
import StepperButtons from "../components/ui/StepperButtons";
import {
  getMemberById,
  createMember,
  patchMember,
} from "../services/membersService";
import { RupeeIcon } from "../components/ui/Icons";
import {
  FiLoader,
  FiUser,
  FiBox,
  FiArrowLeft,
  FiPlus,
  FiEdit,
} from "react-icons/fi";

// --- Helper Components (Extracted) ---
const DetailsSection = (
  { mode, formData, onFormChange, onEnterKeyOnLastInput, isPostCreation } // Added onEnterKeyOnLastInput
) => (
  <Card className="h-full">
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <FiUser /> Member Details
    </h2>
    <hr className="border-border mb-4" />
    <MemberDetailsForm
      mode={mode}
      formData={formData}
      onFormChange={onFormChange}
      onEnterKeyOnLastInput={onEnterKeyOnLastInput}
      isPostCreation={isPostCreation} // <-- PASS PROP
    />
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

// --- MODIFIED DesktopActionButton ---
const DesktopActionButton = ({ mode, loading, isPostCreation }) => {
  if (mode === "view") return null;

  let buttonText, Icon, buttonVariant;

  if (mode === "create") {
    if (isPostCreation) {
      buttonText = "Update Member";
      Icon = FiEdit;
      buttonVariant = "warning";
    } else {
      buttonText = "Create Member";
      Icon = FiPlus;
      buttonVariant = "success";
    }
  } else {
    buttonText = "Update Member";
    Icon = FiEdit;
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

// --- MODIFIED MobileContent Component ---
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
  handleMobileFormSubmit, // New prop
  isPostCreation, // New prop
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
          icon={<FiUser />}
          label="Details"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          ref={(el) => (tabRefs.current["chits"] = el)}
          name="chits"
          icon={<FiBox />}
          label="Chits"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabled={mode === "create" && !createdMemberId}
        />
        <TabButton
          ref={(el) => (tabRefs.current["payments"] = el)}
          name="payments"
          icon={<RupeeIcon className="w-4 h-4" />}
          label="Payments"
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
            onEnterKeyOnLastInput={handleNext} // Pass stepper's next
            isPostCreation={isPostCreation} // <-- ADD THIS LINE
          />
          {mode !== "view" && (
            <StepperButtons
              currentStep={activeTabIndex}
              totalSteps={TABS.length}
              onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
              onNext={handleNext}
              onMiddle={handleMiddle}
              isNextDisabled={activeTabIndex === 0 && !isDetailsFormValid}
              loading={detailsLoading} // Only details loading controls stepper
              mode={mode}
              isPostCreation={isPostCreation} // Pass prop
            />
          )}
        </form>
      )}

      {activeTab === "chits" && (
        <>
          <MemberChitsManager mode={mode} memberId={createdMemberId} />
          {mode !== "view" && (
            <StepperButtons
              currentStep={activeTabIndex}
              totalSteps={TABS.length}
              onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
              onNext={handleNext}
              onMiddle={handleMiddle}
              isNextDisabled={false} // Chits step doesn't disable 'next'
              loading={detailsLoading}
              mode={mode}
              isPostCreation={isPostCreation} // Pass prop
            />
          )}
        </>
      )}

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
              isNextDisabled={false} // Payments step doesn't disable 'next'
              loading={detailsLoading}
              mode={mode}
              isPostCreation={isPostCreation} // Pass prop
            />
          )}
        </>
      )}
    </div>
  );
};

// --- Main Page Component ---
const MemberDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
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

  useScrollToTop(success || error);

  const TABS = ["details", "chits", "payments"];
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
        const memberData = await getMemberById(id, token);
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
    } else {
      setMode("view");
      fetchMember();
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
        const newMember = await createMember(formData, token);
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
            changes,
            token
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
          await patchMember(id, changes, token);
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

  // --- THIS IS THE NEW "SMART BACK" HANDLER ---
  const handleBackNavigation = () => {
    if (activeTabIndex > 0) {
      // If on "Chits" (1) or "Payments" (2), go back one tab
      setActiveTab(TABS[activeTabIndex - 1]);
    } else {
      // If on "Details" (0), go back to the main members list
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

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
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
                {/* --- THIS BUTTON IS NOW "SMART" --- */}
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

              {/* --- Mobile View --- */}
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
                />
              </div>

              {/* --- MODIFIED DESKTOP VIEW --- */}
              <div className="hidden md:block">
                <form
                  id="member-details-form-desktop"
                  onSubmit={handleDetailsSubmit}
                >
                  <div className="grid md:grid-cols-2 md:gap-x-8 md:gap-y-8 max-w-4xl mx-auto">
                    {/* --- We now conditionally render sections based on activeTab --- */}
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
                        />
                      </div>
                    )}

                    {activeTab === "payments" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <PaymentsSection />
                      </div>
                    )}

                    {/* --- Render the other column ONLY if details is active --- */}
                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <MemberChitsManager
                          mode={mode}
                          memberId={createdMemberId || id}
                        />
                        <PaymentsSection />
                      </div>
                    )}

                    {/* --- Desktop Tab Buttons --- */}
                    <div className="md:col-span-2 flex items-center border-b border-border -mt-8">
                      <TabButton
                        name="details"
                        icon={<FiUser />}
                        label="Details"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                      />
                      <TabButton
                        name="chits"
                        icon={<FiBox />}
                        label="Chits"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdMemberId}
                      />
                      <TabButton
                        name="payments"
                        icon={<RupeeIcon className="w-4 h-4" />}
                        label="Payments"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        disabled={mode === "create" && !createdMemberId}
                      />
                    </div>

                    {/* --- Action button only shows on "Details" tab --- */}
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
