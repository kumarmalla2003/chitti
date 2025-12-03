// frontend/src/pages/CollectionViewDashboard.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Info,
  User,
  Layers,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  IndianRupee,
} from "lucide-react";
import Card from "../components/ui/Card";

const formatCurrency = (val) => {
  if (val === undefined || val === null) return "0";
  return val.toLocaleString("en-IN");
};

const formatDateFull = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMonthYear = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// --- Left Aligned, Bold Headings, Medium Text ---
const DetailRow = ({ icon: Icon, label, value, className = "" }) => (
  <div
    className={`flex items-center py-3 border-b border-border/50 last:border-0 ${className}`}
  >
    <div className="flex items-center gap-3 w-48 flex-shrink-0">
      <div className="p-2 bg-background-secondary rounded-full text-text-secondary">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-text-primary">{label}</span>
    </div>
    <span className="text-sm font-medium text-text-secondary text-left break-words flex-1">
      {value || "-"}
    </span>
  </div>
);

const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="bg-background-secondary/50 p-4 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors h-full">
    <div className="flex items-center gap-1.5 mb-2 text-text-secondary">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex items-center text-text-primary font-bold text-2xl">
      <IndianRupee className="w-5 h-5 mr-1" />
      {value}
    </div>
  </div>
);

const CollectionViewDashboard = ({ collectionData, collectionId }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/collections/edit/${collectionId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1">
        <Card className="h-full">
          {/* --- HEADER --- */}
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Info className="w-6 h-6" />
              Details
            </h2>
          </div>

          <hr className="border-border mb-6" />

          <div className="flex flex-col gap-6">
            {/* --- Key Metric: Amount Paid --- */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <MetricCard
                  label="Amount Paid"
                  value={formatCurrency(collectionData.amount_paid)}
                  icon={IndianRupee}
                />
              </div>
            </div>

            {/* --- List View for Other Details --- */}
            <div className="flex-grow">
              <DetailRow
                icon={User}
                label="Member"
                value={collectionData.member?.full_name}
              />
              <DetailRow
                icon={Layers}
                label="Chit Group"
                value={collectionData.chit?.name}
              />
              <DetailRow
                icon={Clock}
                label="Assignment Month"
                value={formatMonthYear(collectionData.chit_month)}
              />
              <DetailRow
                icon={Calendar}
                label="Collection Date"
                value={formatDateFull(collectionData.collection_date)}
              />
              <DetailRow
                icon={CreditCard}
                label="Collection Method"
                value={collectionData.collection_method}
              />
              <DetailRow
                icon={FileText}
                label="Notes"
                value={collectionData.notes}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CollectionViewDashboard;
