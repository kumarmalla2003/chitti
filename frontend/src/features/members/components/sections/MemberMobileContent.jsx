// frontend/src/features/members/components/sections/MemberMobileContent.jsx

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { User, ClipboardList, IndianRupee } from "lucide-react";
import Card from "../../../../components/ui/Card";
import TabButton from "../../../../components/ui/TabButton";
import StepperButtons from "../../../../components/ui/StepperButtons";
import MemberDetailsForm from "../forms/MemberDetailsForm";
import MemberChitsManager from "./MemberChitsManager";
import CollectionHistoryList from "./CollectionHistoryList";

/**
 * MemberMobileContent component - renders the mobile tab navigation and content for member detail page.
 *
 * @param {object} props - Component props
 */
const MemberMobileContent = ({
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
    isSubmitting,
    onLogCollectionClick,
    collectionDefaults,
    setCollectionDefaults,
    onCancel,
    success, // Success message from form submission
    // RHForm props
    control,
    register,
    errors,
    isValid,
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
        <div className="w-full max-w-2xl mx-auto">
            {/* Tab bar only visible after member is created (when more than 1 tab) */}
            {TABS.length > 1 && (
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
                        ref={(el) => (tabRefs.current["assignments"] = el)}
                        name="assignments"
                        icon={ClipboardList}
                        label="Assignments"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        ref={(el) => (tabRefs.current["collections"] = el)}
                        name="collections"
                        icon={IndianRupee}
                        label="Collections"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>
            )}

            {activeTab === "details" && (
                <form onSubmit={handleMobileFormSubmit}>
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
                            success={success}
                            isSubmitting={isSubmitting}
                            onEnterKeyOnLastInput={handleNext}
                            onCancel={onCancel}
                            isPostCreation={isPostCreation}
                        />
                    </Card>
                    {/* StepperButtons only shown when there are multiple tabs (edit mode) */}
                    {mode !== "view" && TABS.length > 1 && (
                        <StepperButtons
                            currentStep={activeTabIndex}
                            totalSteps={TABS.length}
                            onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
                            onNext={handleNext}
                            onMiddle={handleMiddle}
                            isNextDisabled={activeTabIndex === 0 && !isValid}
                            loading={detailsLoading}
                            mode={mode}
                            isPostCreation={isPostCreation}
                        />
                    )}
                </form>
            )}

            {activeTab === "assignments" && (
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

MemberMobileContent.propTypes = {
    TABS: PropTypes.arrayOf(PropTypes.string).isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(["create", "edit", "view"]).isRequired,
    createdMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    activeTabIndex: PropTypes.number.isRequired,
    detailsLoading: PropTypes.bool.isRequired,
    handleNext: PropTypes.func.isRequired,
    handleMiddle: PropTypes.func.isRequired,
    handleMobileFormSubmit: PropTypes.func.isRequired,
    isPostCreation: PropTypes.bool.isRequired,
    isSubmitting: PropTypes.bool,
    onLogCollectionClick: PropTypes.func.isRequired,
    collectionDefaults: PropTypes.object,
    setCollectionDefaults: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    success: PropTypes.string,
    // RHForm props
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isValid: PropTypes.bool.isRequired,
};

export default MemberMobileContent;
