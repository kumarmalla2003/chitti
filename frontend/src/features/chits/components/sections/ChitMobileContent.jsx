// frontend/src/features/chits/components/sections/ChitMobileContent.jsx

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Info, ClipboardList, Receipt } from "lucide-react";
import Card from "../../../../components/ui/Card";
import Message from "../../../../components/ui/Message";
import TabButton from "../../../../components/ui/TabButton";
import StepperButtons from "../../../../components/ui/StepperButtons";
import ChitDetailsForm from "../forms/ChitDetailsForm";
import AssignmentsSection from "./AssignmentsSection";
import TransactionsSection from "./TransactionsSection";

/**
 * ChitMobileContent component - renders the mobile tab navigation and content for chit detail page.
 * New 3-tab structure: Details, Assignments, Transactions
 *
 * @param {object} props - Component props
 */
const ChitMobileContent = ({
    TABS,
    activeTab,
    setActiveTab,
    mode,
    chitId,
    activeTabIndex,
    loading,
    handleNext,
    handleMiddle,
    handleMobileFormSubmit,
    isPostCreation,
    hasActiveOperations,
    onLogCollectionClick,
    collectionDefaults,
    setCollectionDefaults,
    // Form Hook Props
    control,
    register,
    errors,
    isValid,
    setValue,
    setError,
    clearErrors,
    trigger,
    onNameValid,
    onNameInvalid,
    onSizeChange,
    onDurationChange,
    onStartDateChange,
    onEndDateChange,
    onShowLockedFieldWarning,
    lockedFieldWarning, // For displaying warning below Details header
    showEditWarning, // For auto-dismiss edit mode warning
    membersCount, // For singular/plural message
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
            {/* Only show tab bar after chit is created (or not in create mode) */}
            {(mode !== "create" || chitId) && (
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
                        ref={(el) => (tabRefs.current["assignments"] = el)}
                        name="assignments"
                        icon={ClipboardList}
                        label="Assignments"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        ref={(el) => (tabRefs.current["transactions"] = el)}
                        name="transactions"
                        icon={Receipt}
                        label="Transactions"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>
            )}

            {activeTab === "details" && (
                <form onSubmit={handleMobileFormSubmit}>
                    <Card className="h-full">
                        <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                            <Info className="w-6 h-6" /> Details
                        </h2>
                        <hr className="border-border mb-4" />
                        {showEditWarning && (
                            <Message type="warning" title="Limited Editing" className="mb-4">
                                Some fields are locked — this chit has {membersCount} {membersCount === 1 ? "member" : "members"} assigned.
                            </Message>
                        )}
                        {lockedFieldWarning && (
                            <Message type="warning" title="Field Locked" className="mb-4">
                                {lockedFieldWarning}
                            </Message>
                        )}
                        <ChitDetailsForm
                            mode={mode}
                            control={control}
                            register={register}
                            errors={errors}
                            isPostCreation={isPostCreation}
                            hasActiveOperations={hasActiveOperations}
                            setValue={setValue}
                            setError={setError}
                            clearErrors={clearErrors}
                            trigger={trigger}
                            onEnterKeyOnLastInput={handleNext}
                            onNameValid={onNameValid}
                            onNameInvalid={onNameInvalid}
                            onSizeChange={onSizeChange}
                            onDurationChange={onDurationChange}
                            onStartDateChange={onStartDateChange}
                            onEndDateChange={onEndDateChange}
                            onShowLockedFieldWarning={onShowLockedFieldWarning}
                        />
                    </Card>
                    {mode !== "view" && (
                        <StepperButtons
                            currentStep={activeTabIndex}
                            totalSteps={TABS.length}
                            onPrev={() => setActiveTab(TABS[activeTabIndex - 1])}
                            onNext={handleNext}
                            onMiddle={handleMiddle}
                            isNextDisabled={activeTabIndex === 0 && !isValid}
                            loading={loading}
                            mode={mode}
                            isPostCreation={isPostCreation}
                        />
                    )}
                </form>
            )}

            {activeTab === "assignments" && (
                <>
                    <Card className="flex-1 flex flex-col">
                        <AssignmentsSection
                            mode={mode}
                            chitId={chitId}
                            onLogCollectionClick={onLogCollectionClick}
                        />
                    </Card>
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

            {activeTab === "transactions" && (
                <>
                    <Card className="flex-1 flex flex-col">
                        <TransactionsSection
                            mode={mode}
                            chitId={chitId}
                        />
                    </Card>
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

ChitMobileContent.propTypes = {
    TABS: PropTypes.arrayOf(PropTypes.string).isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(["create", "edit", "view"]).isRequired,
    chitId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    activeTabIndex: PropTypes.number.isRequired,
    loading: PropTypes.bool.isRequired,
    handleNext: PropTypes.func.isRequired,
    handleMiddle: PropTypes.func.isRequired,
    handleMobileFormSubmit: PropTypes.func.isRequired,
    isPostCreation: PropTypes.bool.isRequired,
    hasActiveOperations: PropTypes.bool,
    onLogCollectionClick: PropTypes.func.isRequired,
    collectionDefaults: PropTypes.object,
    setCollectionDefaults: PropTypes.func.isRequired,
    // RHForm props
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isValid: PropTypes.bool.isRequired,
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    trigger: PropTypes.func,
    onNameValid: PropTypes.func,
    onNameInvalid: PropTypes.func,
    onSizeChange: PropTypes.func,
    onDurationChange: PropTypes.func,
    onStartDateChange: PropTypes.func,
    onEndDateChange: PropTypes.func,
    onShowLockedFieldWarning: PropTypes.func,
    lockedFieldWarning: PropTypes.string,
    showEditWarning: PropTypes.bool,
    membersCount: PropTypes.number,
};

export default ChitMobileContent;
