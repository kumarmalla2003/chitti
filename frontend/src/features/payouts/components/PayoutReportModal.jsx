// frontend/src/components/reports/PayoutReportModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Layers, User, ChevronDown, Loader2, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import { getAllChits } from "../../features/chits/api/chitsService";
import { getAllMembers } from "../../services/membersService";
import CustomDateInput from "../ui/CustomDateInput";
import { useSelector } from "react-redux";

// --- TabButton Component ---
const TabButton = React.forwardRef(
  ({ name, icon: Icon, label, activeTab, setActiveTab }, ref) => {
    const isActive = activeTab === name;
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setActiveTab(name)}
        className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none rounded-t-md border-b-2 ${
          isActive
            ? "bg-background-secondary/50 text-accent border-accent"
            : "text-text-secondary border-transparent hover:bg-background-secondary/30 hover:text-text-primary"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }
);

// Helper for default dates
const getDates = (type) => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  let start, end;

  if (type === "thisMonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (type === "lastMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (type === "thisYear") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  }

  return {
    start: new Date(start - offset).toISOString().split("T")[0],
    end: new Date(end - offset).toISOString().split("T")[0],
  };
};

const PayoutReportModal = ({ isOpen, onClose, onGenerate, loading }) => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("date");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedChit, setSelectedChit] = useState("");
  const [selectedMember, setSelectedMember] = useState("");

  const [chits, setChits] = useState([]);
  const [members, setMembers] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      const fetchData = async () => {
        setDataLoading(true);
        try {
          const [chitsData, membersData] = await Promise.all([
            getAllChits(), // No token
            getAllMembers(), // No token
          ]);
          setChits(chitsData.chits || []);
          setMembers(membersData.members || []);
        } catch (error) {
          console.error("Failed to fetch filter options", error);
        } finally {
          setDataLoading(false);
        }
      };
      fetchData();

      const dates = getDates("thisMonth");
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  }, [isOpen, isLoggedIn]);

  const handleQuickDateSelect = (type) => {
    const dates = getDates(type);
    setStartDate(dates.start);
    setEndDate(dates.end);
  };

  const isRangeActive = (type) => {
    const dates = getDates(type);
    return startDate === dates.start && endDate === dates.end;
  };

  const handleSubmit = () => {
    const filters = {};
    if (activeTab === "date") {
      filters.startDate = startDate;
      filters.endDate = endDate;
      filters.reportType = "Date Range";
    } else if (activeTab === "chit") {
      filters.chitId = selectedChit;
      filters.chitName = chits.find(
        (c) => c.id.toString() === selectedChit
      )?.name;
      filters.reportType = "Chit History";
    } else if (activeTab === "member") {
      filters.memberId = selectedMember;
      filters.memberName = members.find(
        (m) => m.id.toString() === selectedMember
      )?.full_name;
      filters.reportType = "Member History";
    }
    onGenerate(filters);
  };

  const isValid = () => {
    if (activeTab === "date") return startDate && endDate;
    if (activeTab === "chit") return selectedChit;
    if (activeTab === "member") return selectedMember;
    return false;
  };

  const getInfoMessage = () => {
    if (activeTab === "date") {
      return "Generates a report of all payouts within the selected date range.";
    } else if (activeTab === "chit") {
      const name =
        chits.find((c) => c.id.toString() === selectedChit)?.name ||
        "the selected chit";
      return selectedChit
        ? `Generates the complete payout history for "${name}".`
        : "Select a chit group to view its payouts.";
    } else if (activeTab === "member") {
      const name =
        members.find((m) => m.id.toString() === selectedMember)?.full_name ||
        "the selected member";
      return selectedMember
        ? `Generates the complete payout history for "${name}".`
        : "Select a member to view their payouts.";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-background-primary rounded-md shadow-lg p-8 w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-transform duration-300 hover:rotate-90 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary">
          Generate Payout Report
        </h2>
        <hr className="my-4 border-border" />

        <div className="min-h-[3rem] flex items-center justify-center mb-4 px-2">
          <p className="text-sm text-center text-text-secondary">
            {getInfoMessage()}
          </p>
        </div>

        <div className="flex items-center border-b border-border mb-6 w-full overflow-x-auto whitespace-nowrap no-scrollbar">
          <TabButton
            ref={(el) => (tabRefs.current["date"] = el)}
            name="date"
            icon={Calendar}
            label="Date"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            ref={(el) => (tabRefs.current["chit"] = el)}
            name="chit"
            icon={Layers}
            label="Chit"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            ref={(el) => (tabRefs.current["member"] = el)}
            name="member"
            icon={User}
            label="Member"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <div className="flex-grow mb-8">
          <AnimatePresence mode="wait">
            {activeTab === "date" && (
              <motion.div
                key="date"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex justify-center gap-3">
                  {["thisMonth", "lastMonth", "thisYear"].map((range) => {
                    const isActive = isRangeActive(range);
                    return (
                      <button
                        key={range}
                        onClick={() => handleQuickDateSelect(range)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors border ${
                          isActive
                            ? "bg-accent text-white border-accent"
                            : "bg-background-secondary text-text-secondary border-border hover:bg-accent hover:text-white"
                        }`}
                      >
                        {range
                          .replace(/([A-Z])/g, " $1")
                          .trim()
                          .replace(/^./, (str) => str.toUpperCase())}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">
                      From
                    </label>
                    <CustomDateInput
                      name="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">
                      To
                    </label>
                    <CustomDateInput
                      name="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chit" && (
              <motion.div
                key="chit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="py-2"
              >
                <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">
                  Select Chit Group
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Box className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>
                  <select
                    value={selectedChit}
                    onChange={(e) => setSelectedChit(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary appearance-none cursor-pointer"
                    disabled={dataLoading}
                  >
                    <option value="">-- Select a Chit --</option>
                    {chits.map((chit) => (
                      <option key={chit.id} value={chit.id}>
                        {chit.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </div>
              </motion.div>
            )}

            {activeTab === "member" && (
              <motion.div
                key="member"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="py-2"
              >
                <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">
                  Select Member
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary appearance-none cursor-pointer"
                    disabled={dataLoading}
                  >
                    <option value="">-- Select a Member --</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || dataLoading || !isValid()}
          className="w-full shadow-lg"
        >
          {loading ? (
            <Loader2 className="animate-spin mx-auto w-5 h-5" />
          ) : (
            "Download Report"
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default PayoutReportModal;
