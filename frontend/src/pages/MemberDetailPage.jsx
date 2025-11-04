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
import PaymentHistoryList from "../components/sections/PaymentHistoryList";
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
const DetailsSection = ({
  mode,
  formData,
  onFormChange,
  onEnterKeyOnLastInput,
  isPostCreation,
}) => (
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
      isPostCreation={isPostCreation}
    />
  </Card>
);

// --- DesktopActionButton (unchanged) ---
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
  onLogPaymentClick, // <-- ADD THIS
  paymentDefaults, // <-- ADD THIS
  setPaymentDefaults, // <-- ADD THIS
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
            onLogPaymentClick={onLogPaymentClick} // <-- Pass prop
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

      {activeTab === "payments" && (
        <>
          <PaymentHistoryList
            memberId={createdMemberId}
            mode={mode}
            paymentDefaults={paymentDefaults} // <-- Pass prop
            setPaymentDefaults={setPaymentDefaults} // <-- Pass prop
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

  // --- ADD THIS STATE ---
  const [paymentDefaults, setPaymentDefaults] = useState(null);

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

  // --- ADD THIS HANDLER ---
  const handleLogPaymentClick = (assignment) => {
    setPaymentDefaults({
      assignmentId: assignment.id,
      groupId: assignment.chit_group.id,
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
                  onLogPaymentClick={handleLogPaymentClick} // <-- Pass prop
                  paymentDefaults={paymentDefaults} // <-- Pass prop
                  setPaymentDefaults={setPaymentDefaults} // <-- Pass prop
                />
              </div>

              {/* --- MODIFIED DESKTOP VIEW --- */}
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
                          onLogPaymentClick={handleLogPaymentClick} // <-- Pass prop
                        />
                      </div>
                    )}

                    {activeTab === "payments" && (
                      <div className="md:col-span-2 flex flex-col gap-8">
                        <PaymentHistoryList
                          memberId={createdMemberId || id}
                          mode={mode}
                          paymentDefaults={paymentDefaults} // <-- Pass prop
                          setPaymentDefaults={setPaymentDefaults} // <-- Pass prop
                        />
                      </div>
                    )}

                    {activeTab === "details" && (
                      <div className="md:col-span-1 flex flex-col gap-8">
                        <MemberChitsManager
                          mode={mode}
                          memberId={createdMemberId || id}
                          onLogPaymentClick={handleLogPaymentClick} // <-- Pass prop
                        />
                        <PaymentHistoryList
                          memberId={createdMemberId || id}
                          mode={mode}
                          paymentDefaults={paymentDefaults} // <-- Pass prop
                          setPaymentDefaults={setPaymentDefaults} // <-- Pass prop
                        />
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
