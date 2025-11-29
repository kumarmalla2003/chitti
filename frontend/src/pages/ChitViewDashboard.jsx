// frontend/src/pages/ChitViewDashboard.jsx

import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiInfo,
  FiUsers,
  FiClock,
  FiCalendar,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiPieChart,
  FiEdit,
} from "react-icons/fi";
import { RupeeIcon } from "../components/ui/Icons";
import Card from "../components/ui/Card";
import PayoutsSection from "../components/sections/PayoutsSection";
import ChitMembersManager from "../components/sections/ChitMembersManager";
import PaymentHistoryList from "../components/sections/PaymentHistoryList";

const formatCurrency = (val) => {
  if (!val) return "0";
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const formatDateShort = (dateString) => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length === 2) {
    const [year, month] = parts;
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const str = date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    return str.replace(" ", "/");
  }
  return dateString;
};

// --- Left Aligned, Bold Headings, Medium Text ---
const DetailRow = ({ icon: Icon, label, value, className = "" }) => (
  <div
    className={`flex items-center py-3 border-b border-border/50 last:border-0 ${className}`}
  >
    <div className="flex items-center gap-3 w-56 flex-shrink-0">
      <div className="p-2 bg-background-secondary rounded-full text-text-secondary">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-text-primary">{label}</span>
    </div>
    <span className="text-sm font-medium text-text-secondary text-left">
      {value}
    </span>
  </div>
);

const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="bg-background-secondary/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
    <div className="flex items-center gap-1.5 mb-1 text-text-secondary">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex items-center text-text-primary font-bold text-lg">
      <RupeeIcon className="w-4 h-4 mr-1" />
      {value}
    </div>
  </div>
);

const ChitViewDashboard = ({
  chitData,
  chitId,
  onLogPaymentClick,
  paymentDefaults,
  setPaymentDefaults,
}) => {
  const paymentsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogPayment = (assignment) => {
    onLogPaymentClick(assignment);
    if (paymentsRef.current) {
      paymentsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleEditDetails = () => {
    navigate(`/chits/edit/${chitId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- Row 1: Details & Payouts Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="h-full">
            {/* --- HEADER: Centered Title, Right-Aligned Icon --- */}
            <div className="relative flex justify-center items-center mb-2">
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

            <div className="flex flex-col h-full gap-4">
              {/* --- Grid View for Key Metrics --- */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Chit Value"
                  value={formatCurrency(chitData.chit_value)}
                  icon={RupeeIcon}
                />
                <MetricCard
                  label="Installment"
                  value={formatCurrency(chitData.monthly_installment)}
                  icon={FiPieChart}
                />
              </div>

              {/* --- REMOVED: Horizontal Line Here (per request) --- */}

              {/* --- List View for Other Details --- */}
              <div className="flex-grow">
                <DetailRow
                  icon={FiUsers}
                  label="Group Size"
                  value={`${chitData.size} Members`}
                />
                <DetailRow
                  icon={FiClock}
                  label="Duration"
                  value={`${chitData.duration_months} Months`}
                />
                <DetailRow
                  icon={FiCalendar}
                  label="Start Date"
                  value={formatDateShort(chitData.start_date)}
                />
                <DetailRow
                  icon={FiCalendar}
                  label="End Date"
                  value={formatDateShort(chitData.end_date)}
                />
                <DetailRow
                  icon={FiArrowDownLeft}
                  label="Collection Day"
                  value={`Day ${chitData.collection_day}`}
                />
                <DetailRow
                  icon={FiArrowUpRight}
                  label="Payout Day"
                  value={`Day ${chitData.payout_day}`}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Payouts */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <PayoutsSection chitId={chitId} mode="view" showTitle={true} />
          </Card>
        </div>
      </div>

      {/* --- Row 2: Members (Forced Table) --- */}
      <div className="grid grid-cols-1">
        <Card>
          <ChitMembersManager
            chitId={chitId}
            mode="view"
            onLogPaymentClick={handleLogPayment}
            forceTable={true}
          />
        </Card>
      </div>

      {/* --- Row 3: Payments (Forced Table) --- */}
      <div ref={paymentsRef} className="grid grid-cols-1">
        <PaymentHistoryList
          chitId={chitId}
          mode="view"
          paymentDefaults={paymentDefaults}
          setPaymentDefaults={setPaymentDefaults}
          forceTable={true}
        />
      </div>
    </div>
  );
};

export default ChitViewDashboard;
