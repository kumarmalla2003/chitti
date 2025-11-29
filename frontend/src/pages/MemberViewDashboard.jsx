// frontend/src/pages/MemberViewDashboard.jsx

import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiInfo, FiPhone, FiEdit } from "react-icons/fi";
import Card from "../components/ui/Card";
import MemberChitsManager from "../components/sections/MemberChitsManager";
import PaymentHistoryList from "../components/sections/PaymentHistoryList";

// --- MODIFIED: Horizontal Layout for MetricCard (Reduced Size) ---
// --- FINAL MODIFIED: Horizontal Layout for MetricCard ---
const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="bg-background-secondary/50 p-3 rounded-xl border border-border/50 flex flex-row items-center justify-between gap-4 hover:border-accent/30 transition-colors h-full">
    <div className="flex items-center gap-2 text-text-secondary">
      {/* Icon size remains w-4 h-4 */}
      <Icon className="w-4 h-4" />
      {/* Label uses text-sm */}
      <span className="text-sm font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>

    {/* Separator height adjusted for aesthetic alignment */}
    <div className="h-5 w-px bg-border mx-2"></div>

    {/* Value uses text-lg */}
    <div className="text-text-primary font-bold text-lg">{value}</div>
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
  const paymentsRef = useRef(null);

  const handleEditDetails = () => {
    navigate(`/members/edit/${memberId}`);
  };

  const handleLogPayment = (assignment) => {
    onLogPaymentClick(assignment);
    if (paymentsRef.current) {
      paymentsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- Row 1: Details (Horizontal Phone Number Box) --- */}
      <div className="grid grid-cols-1">
        <Card>
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FiInfo /> Details
            </h2>
            <button
              onClick={handleEditDetails}
              className="absolute right-0 p-1 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200 print:hidden"
              title="Edit Details"
            >
              <FiEdit className="w-5 h-5" />
            </button>
          </div>

          <hr className="border-border mb-4" />

          {/* Centered Box with reduced max-w-xs width */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <MetricCard
                label="Phone Number"
                value={memberData.phone_number}
                icon={FiPhone}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* --- Row 2: Chits (Component renders its own Card) --- */}
      <div className="grid grid-cols-1">
        <MemberChitsManager
          memberId={memberId}
          mode="view"
          onLogPaymentClick={handleLogPayment}
          forceTable={true}
          onManage={onManageChits}
        />
      </div>

      {/* --- Row 3: Payments (Component renders its own Card) --- */}
      <div ref={paymentsRef} className="grid grid-cols-1">
        <PaymentHistoryList
          memberId={memberId}
          mode="view"
          paymentDefaults={paymentDefaults}
          setPaymentDefaults={setPaymentDefaults}
          forceTable={true}
          onManage={onManagePayments}
        />
      </div>
    </div>
  );
};

export default MemberViewDashboard;
