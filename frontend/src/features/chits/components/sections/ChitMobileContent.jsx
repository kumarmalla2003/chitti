// frontend/src/features/chits/components/sections/ChitMobileContent.jsx

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Info, TrendingUp, Users, WalletMinimal, Gavel } from "lucide-react";
import Card from "../../../../components/ui/Card";
import TabButton from "../../../../components/ui/TabButton";
import StepperButtons from "../../../../components/ui/StepperButtons";
import ChitDetailsForm from "../forms/ChitDetailsForm";
import PayoutsSection from "./PayoutsSection";
import AuctionsSection from "./AuctionsSection";
import ChitMembersManager from "./ChitMembersManager";
import CollectionHistoryList from "../../../members/components/sections/CollectionHistoryList";

/**
 * ChitMobileContent component - renders the mobile tab navigation and content for chit detail page.
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
    onLogCollectionClick,
    collectionDefaults,
    setCollectionDefaults,
    // Form Hook Props
    control,
    register,
    errors,
    isValid,
    onNameBlur,
    onSizeChange,
    onDurationChange,
    onStartDateChange,
    onEndDateChange,
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
                    {TABS.includes("auctions") && (
                        <TabButton
                            ref={(el) => (tabRefs.current["auctions"] = el)}
                            name="auctions"
                            icon={Gavel}
                            label="Auctions"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    <TabButton
                        ref={(el) => (tabRefs.current["payouts"] = el)}
                        name="payouts"
                        icon={TrendingUp}
                        label="Payouts"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        ref={(el) => (tabRefs.current["members"] = el)}
                        name="members"
                        icon={Users}
                        label="Members"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                    <TabButton
                        ref={(el) => (tabRefs.current["collections"] = el)}
                        name="collections"
                        icon={WalletMinimal}
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
                            <Info className="w-6 h-6" /> Details
                        </h2>
                        <hr className="border-border mb-4" />
                        <ChitDetailsForm
                            mode={mode}
                            control={control}
                            register={register}
                            errors={errors}
                            isPostCreation={isPostCreation}
                            onEnterKeyOnLastInput={handleNext}
                            onNameBlur={onNameBlur}
                            onSizeChange={onSizeChange}
                            onDurationChange={onDurationChange}
                            onStartDateChange={onStartDateChange}
                            onEndDateChange={onEndDateChange}
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

            {activeTab === "auctions" && (
                <>
                    <Card className="flex-1 flex flex-col">
                        <AuctionsSection mode={mode} chitId={chitId} />
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

            {activeTab === "payouts" && (
                <>
                    <Card className="flex-1 flex flex-col">
                        <PayoutsSection mode={mode} chitId={chitId} />
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

            {activeTab === "members" && (
                <>
                    <Card className="flex-1 flex flex-col">
                        <ChitMembersManager
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

            {activeTab === "collections" && (
                <>
                    <CollectionHistoryList
                        chitId={chitId}
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
    onLogCollectionClick: PropTypes.func.isRequired,
    collectionDefaults: PropTypes.object,
    setCollectionDefaults: PropTypes.func.isRequired,
    // RHForm props
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isValid: PropTypes.bool.isRequired,
    onNameBlur: PropTypes.func,
    onSizeChange: PropTypes.func,
    onDurationChange: PropTypes.func,
    onStartDateChange: PropTypes.func,
    onEndDateChange: PropTypes.func,
};

export default ChitMobileContent;
