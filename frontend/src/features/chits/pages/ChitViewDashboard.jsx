// frontend/src/features/chits/pages/ChitViewDashboard.jsx

import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Info,
  Users,
  Clock,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  SquarePen,
} from "lucide-react";
import { IndianRupee } from "lucide-react";
import Card from "../../../components/ui/Card";
import PayoutsSection from "../components/sections/PayoutsSection";
import ChitMembersManager from "../components/sections/ChitMembersManager";
import CollectionHistoryList from "../../members/components/sections/CollectionHistoryList";

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

// eslint-disable-next-line no-unused-vars
const DetailRow = ({ icon: IconComponent, label, value, className = "" }) => (
  <div
    className={`flex items-center py-3 border-b border-border/50 last:border-0 ${className}`}
  >
    <div className="flex items-center gap-3 w-56 flex-shrink-0">
      <div className="p-2 bg-background-secondary rounded-full text-text-secondary">
        <IconComponent className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-text-primary">{label}</span>
    </div>
    <span className="text-sm font-medium text-text-secondary text-left">
      {value}
    </span>
  </div>
);

// eslint-disable-next-line no-unused-vars
const MetricCard = ({ label, value, icon: IconComponent }) => (
  <div className="bg-background-secondary/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
    <div className="flex items-center gap-1.5 mb-1 text-text-secondary">
      <IconComponent className="w-3.5 h-3.5" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex items-center text-text-primary font-bold text-lg">
      <IndianRupee className="w-4 h-4 mr-1" />
      {value}
    </div>
  </div>
);

const ChitViewDashboard = ({
  chitData,
  chitId,
  onLogCollectionClick,
  collectionDefaults,
  setCollectionDefaults,
}) => {
  const collectionsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogCollection = (assignment) => {
    onLogCollectionClick(assignment);
    if (collectionsRef.current) {
      collectionsRef.current.scrollIntoView({
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
      {/* Stacked Full-Width Sections Layout */}

      {/* Details Section */}
      <div className="grid grid-cols-1">
        <Card className="h-full">
          <div className="relative flex justify-center items-center mb-2">
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

          <div className="flex flex-col md:flex-row gap-6">
            {/* Grid Metrics */}
            <div className="grid grid-cols-2 gap-3 md:w-1/3">
              <MetricCard
                label="Chit Value"
                value={formatCurrency(chitData.chit_value)}
                icon={IndianRupee}
              />
              {chitData.chit_type === "variable" ? (
                <div className="bg-background-secondary/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1 text-text-secondary">
                    <PieChart className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Installment
                    </span>
                  </div>
                  <div className="flex items-center text-text-primary font-bold text-base">
                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                    {formatCurrency(chitData.installment_before_payout)}
                    <span className="mx-1 text-text-secondary">/</span>
                    {formatCurrency(chitData.installment_after_payout)}
                  </div>
                </div>
              ) : chitData.chit_type === "auction" ? (
                <div className="bg-background-secondary/50 p-3 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1 text-text-secondary">
                    <PieChart className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Installment
                    </span>
                  </div>
                  <div className="flex items-center text-text-secondary font-medium text-sm">
                    Auction pending
                  </div>
                </div>
              ) : (
                <MetricCard
                  label="Installment"
                  value={formatCurrency(chitData.monthly_installment)}
                  icon={PieChart}
                />
              )}
            </div>

            {/* List Details */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              <DetailRow
                icon={Users}
                label="Group Size"
                value={`${chitData.size} Members`}
              />
              <DetailRow
                icon={Clock}
                label="Duration"
                value={`${chitData.duration_months} Months`}
              />
              <DetailRow
                icon={Calendar}
                label="Start Date"
                value={formatDateShort(chitData.start_date)}
              />
              <DetailRow
                icon={Calendar}
                label="End Date"
                value={formatDateShort(chitData.end_date)}
              />
              <DetailRow
                icon={ArrowDownLeft}
                label="Collection Day"
                value={`Day ${chitData.collection_day}`}
              />
              <DetailRow
                icon={ArrowUpRight}
                label="Payout Day"
                value={`Day ${chitData.payout_day}`}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Payouts Section */}
      <div className="grid grid-cols-1">
        <Card>
          <PayoutsSection chitId={chitId} mode="view" showTitle={true} />
        </Card>
      </div>

      {/* Members Section */}
      <div className="grid grid-cols-1">
        <Card>
          <ChitMembersManager
            chitId={chitId}
            mode="view"
            onLogCollectionClick={handleLogCollection}
          />
        </Card>
      </div>

      {/* Collections Section */}
      <div ref={collectionsRef} className="grid grid-cols-1">
        <CollectionHistoryList
          chitId={chitId}
          mode="view"
          collectionDefaults={collectionDefaults}
          setCollectionDefaults={setCollectionDefaults}
        />
      </div>
    </div>
  );
};

export default ChitViewDashboard;
