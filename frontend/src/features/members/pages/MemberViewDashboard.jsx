// frontend/src/features/members/pages/MemberViewDashboard.jsx

import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Phone, SquarePen } from "lucide-react";
import Card from "../../../components/ui/Card";
import MemberChitsManager from "../components/sections/MemberChitsManager";
import CollectionHistoryList from "../components/sections/CollectionHistoryList";
import PayoutHistoryList from "../../chits/components/sections/PayoutHistoryList";

const MetricCard = ({ label, value, icon: IconComponent }) => (
  <div className="bg-background-secondary/50 p-4 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors h-full">
    <div className="flex items-center gap-1.5 mb-2 text-text-secondary">
      <IconComponent className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="text-text-primary font-bold text-2xl">{value}</div>
  </div>
);

const MemberViewDashboard = ({
  memberData,
  memberId,
  onLogPaymentClick,
  paymentDefaults,
  setPaymentDefaults,
  onManageChits,
  onManagePayments,
}) => {
  const navigate = useNavigate();
  const collectionsRef = useRef(null);

  const handleEditDetails = () => {
    navigate(`/members/edit/${memberId}`);
  };

  const handleLogCollection = (assignment) => {
    onLogPaymentClick(assignment);
    if (collectionsRef.current) {
      collectionsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stacked Full-Width Sections Layout */}

      {/* Details Section */}
      <div className="grid grid-cols-1">
        <Card>
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Info className="w-6 h-6" /> Details
            </h2>
            <button
              onClick={handleEditDetails}
              className="absolute right-0 p-1 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200 print:hidden"
              title="Edit Details"
            >
              <SquarePen className="w-5 h-5" />
            </button>
          </div>

          <hr className="border-border mb-4" />

          {/* Centered Box with reduced max-w-xs width */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <MetricCard
                label="Phone Number"
                value={memberData.phone_number}
                icon={Phone}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Chits Section */}
      <div className="grid grid-cols-1">
        <MemberChitsManager
          memberId={memberId}
          mode="view"
          onLogPaymentClick={handleLogCollection}
          forceTable={true}
          onManage={onManageChits}
        />
      </div>

      {/* Collections Section */}
      <div ref={collectionsRef} className="grid grid-cols-1">
        <CollectionHistoryList
          memberId={memberId}
          mode="view"
          collectionDefaults={paymentDefaults}
          setCollectionDefaults={setPaymentDefaults}
          forceTable={true}
          onManage={onManagePayments}
        />
      </div>

      {/* Payouts Section */}
      <div className="grid grid-cols-1">
        <PayoutHistoryList memberId={memberId} mode="view" forceTable={true} />
      </div>
    </div>
  );
};

export default MemberViewDashboard;
