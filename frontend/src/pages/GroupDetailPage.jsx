// frontend/src/pages/GroupDetailPage.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import GroupDetailsForm from "../components/forms/GroupDetailsForm";
import { RupeeIcon } from "../components/ui/Icons";
import { FiInfo, FiUsers, FiLoader, FiArrowLeft } from "react-icons/fi";
import {
  createChitGroup,
  getChitGroupById,
  updateChitGroup,
} from "../services/chitsService";

// --- Helper Functions ---

const getFirstDayOfMonth = (yearMonth) => (yearMonth ? `${yearMonth}-01` : "");

const toYearMonth = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

const calculateEndDate = (startYearMonth, durationMonths) => {
  if (!startYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = startYearMonth.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  startDate.setMonth(startDate.getMonth() + parseInt(durationMonths) - 1);
  return toYearMonth(startDate.toISOString());
};

const calculateStartDate = (endYearMonth, durationMonths) => {
  if (!endYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = endYearMonth.split("-").map(Number);
  const endDate = new Date(year, month, 0);
  endDate.setMonth(endDate.getMonth() - parseInt(durationMonths) + 1);
  return toYearMonth(endDate.toISOString());
};

const calculateDuration = (startYearMonth, endYearMonth) => {
  if (!startYearMonth || !endYearMonth) return "";
  const [startYear, startMonth] = startYearMonth.split("-").map(Number);
  const [endYear, endMonth] = endYearMonth.split("-").map(Number);
  if (endYear < startYear || (endYear === startYear && endMonth < startMonth))
    return "";
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  return totalMonths > 0 ? totalMonths.toString() : "";
};

// --- Helper Components (Extracted) ---

const DetailsSection = ({
  mode,
  formData,
  handleFormChange,
  handleSubmit,
  loading,
  error,
  success,
}) => (
  <Card>
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <FiInfo /> Details
    </h2>
    <hr className="border-border mb-4" />
    <GroupDetailsForm
      mode={mode}
      formData={formData}
      onFormChange={handleFormChange}
      onFormSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
    />
  </Card>
);

const MembersSection = () => (
  <Card>
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <FiUsers /> Members
    </h2>
    <hr className="border-border mb-4" />
    <div className="text-center text-text-secondary py-8">
      This feature is coming soon!
    </div>
  </Card>
);

const PaymentsSection = () => (
  <Card>
    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
      <RupeeIcon className="w-5 h-5" /> Payments
    </h2>
    <hr className="border-border mb-4" />
    <div className="text-center text-text-secondary py-8">
      This feature is coming soon!
    </div>
  </Card>
);

// --- Main Page Component ---

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    chit_value: "",
    group_size: "",
    monthly_installment: "",
    duration_months: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchGroup = async () => {
      setPageLoading(true);
      try {
        const group = await getChitGroupById(id, token);
        setFormData({
          name: group.name,
          chit_value: group.chit_value.toString(),
          group_size: group.group_size.toString(),
          monthly_installment: group.monthly_installment.toString(),
          duration_months: group.duration_months.toString(),
          start_date: toYearMonth(group.start_date),
          end_date: toYearMonth(group.end_date),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    if (isCreate) {
      setMode("create");
      setPageLoading(false);
    } else if (isEdit) {
      setMode("edit");
      fetchGroup();
    } else {
      setMode("view");
      fetchGroup();
    }
  }, [id, location.pathname, token]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => {
      let newFormData = { ...prevFormData, [name]: value };

      if (name === "chit_value" || name === "monthly_installment") {
        newFormData[name] = value.replace(/[^0-9]/g, "");
      } else if (name === "group_size") {
        newFormData.duration_months = value;
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.end_date = calculateEndDate(
            newFormData.start_date,
            value
          );
        }
      } else if (name === "duration_months") {
        newFormData.group_size = value;
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.end_date = calculateEndDate(
            newFormData.start_date,
            value
          );
        } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
          newFormData.start_date = calculateStartDate(
            newFormData.end_date,
            value
          );
        }
      } else if (name === "start_date" && value.match(/^\d{4}-\d{2}$/)) {
        if (newFormData.duration_months) {
          newFormData.end_date = calculateEndDate(
            value,
            newFormData.duration_months
          );
        } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
          const newDuration = calculateDuration(value, newFormData.end_date);
          newFormData.duration_months = newDuration;
          newFormData.group_size = newDuration;
        }
      } else if (name === "end_date" && value.match(/^\d{4}-\d{2}$/)) {
        if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
          const newDuration = calculateDuration(newFormData.start_date, value);
          newFormData.duration_months = newDuration;
          newFormData.group_size = newDuration;
        } else if (newFormData.duration_months) {
          newFormData.start_date = calculateStartDate(
            value,
            newFormData.duration_months
          );
        }
      }
      return newFormData;
    });
  };

  const handleSubmit = async (currentFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const dataToSend = {
      ...currentFormData,
      start_date: getFirstDayOfMonth(currentFormData.start_date),
      chit_value: Number(currentFormData.chit_value),
      group_size: Number(currentFormData.group_size),
      monthly_installment: Number(currentFormData.monthly_installment),
      duration_months: Number(currentFormData.duration_months),
    };
    delete dataToSend.end_date;

    try {
      if (mode === "create") {
        await createChitGroup(dataToSend, token);
        setSuccess("Chit group created successfully!");
      } else if (mode === "edit") {
        const updatedGroup = await updateChitGroup(id, dataToSend, token);
        setFormData({
          name: updatedGroup.name,
          chit_value: updatedGroup.chit_value.toString(),
          group_size: updatedGroup.group_size.toString(),
          monthly_installment: updatedGroup.monthly_installment.toString(),
          duration_months: updatedGroup.duration_months.toString(),
          start_date: toYearMonth(updatedGroup.start_date),
          end_date: toYearMonth(updatedGroup.end_date),
        });
        setSuccess("Chit group updated successfully!");
      }
      setTimeout(() => navigate("/groups"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "create") return "Create New Chit Group";
    if (mode === "edit") return "Edit Chit Group";
    return formData.name || "Group Details";
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  const TabButton = ({ name, icon, label }) => {
    const isActive = activeTab === name;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(name)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${
          isActive
            ? "bg-background-secondary text-accent border-b-2 border-accent"
            : "text-text-secondary hover:bg-background-tertiary"
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header onMenuOpen={() => setIsMenuOpen(true)} activeSection="groups" />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="relative flex justify-center items-center mb-4">
                <Link
                  to="/groups"
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
                  {getTitle()}
                </h1>
              </div>
              <hr className="my-4 border-border" />
              <div className="w-full max-w-2xl mx-auto md:hidden">
                <div className="flex items-center border-b border-border mb-6">
                  <TabButton name="details" icon={<FiInfo />} label="Details" />
                  <TabButton
                    name="members"
                    icon={<FiUsers />}
                    label="Members"
                  />
                  <TabButton
                    name="payments"
                    icon={<RupeeIcon className="w-4 h-4" />}
                    label="Payments"
                  />
                </div>
                {activeTab === "details" && (
                  <DetailsSection
                    mode={mode}
                    formData={formData}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                    success={success}
                  />
                )}
                {activeTab === "members" && <MembersSection />}
                {activeTab === "payments" && <PaymentsSection />}
              </div>
              <div className="hidden md:block md:space-y-8">
                <DetailsSection
                  mode={mode}
                  formData={formData}
                  handleFormChange={handleFormChange}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  error={error}
                  success={success}
                />
                <MembersSection />
                <PaymentsSection />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection="groups"
      />
      <BottomNav />
    </>
  );
};

export default GroupDetailPage;
