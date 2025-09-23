// frontend/src/pages/GroupDetailPage.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Message from "../components/ui/Message";
import CustomMonthInput from "../components/ui/CustomMonthInput";
import {
  FiPlus,
  FiLoader,
  FiTag,
  FiUsers,
  FiClock,
  FiArrowLeft,
  FiEdit,
  FiInfo,
} from "react-icons/fi";
import { RupeeIcon } from "../components/ui/Icons";
import {
  createChitGroup,
  getChitGroupById,
  updateChitGroup,
} from "../services/chitsService";

// --- HELPER FUNCTIONS ---
const getFirstDayOfMonth = (yearMonth) => {
  if (!yearMonth) return "";
  return `${yearMonth}-01`;
};

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

  if (endYear < startYear || (endYear === startYear && endMonth < startMonth)) {
    return "";
  }

  const yearDiff = endYear - startYear;
  const monthDiff = endMonth - startMonth;
  const totalMonths = yearDiff * 12 + monthDiff + 1;

  return totalMonths > 0 ? totalMonths.toString() : "";
};

// --- COMPONENT START ---

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();

  const [mode, setMode] = useState("create"); // create, view, edit
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const nameInputRef = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("view")) {
      setMode("view");
    } else if (path.includes("edit")) {
      setMode("edit");
    } else {
      setMode("create");
    }

    if (id) {
      const fetchGroup = async () => {
        setLoading(true);
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
          setLoading(false);
        }
      };
      fetchGroup();
    }

    if (mode !== "view") {
      nameInputRef.current?.focus();
    }
  }, [id, location.pathname, token, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // --- SYNC & CALCULATION LOGIC ---
    if (name === "chit_value" || name === "monthly_installment") {
      newFormData[name] = value.replace(/[^0-9]/g, "");
    } else if (name === "group_size") {
      newFormData.duration_months = value;
      if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
        newFormData.end_date = calculateEndDate(newFormData.start_date, value);
      }
    } else if (name === "duration_months") {
      newFormData.group_size = value;
      if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
        newFormData.end_date = calculateEndDate(newFormData.start_date, value);
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

    setFormData(newFormData);
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim() === "") {
      return "Chit Group Name cannot be empty.";
    }
    if (formData.name.length > 50) {
      return "Chit Group Name cannot exceed 50 characters.";
    }
    if (
      formData.chit_value <= 0 ||
      !Number.isInteger(Number(formData.chit_value))
    ) {
      return "Chit Value must be a positive whole number.";
    }
    if (
      formData.group_size <= 0 ||
      !Number.isInteger(Number(formData.group_size))
    ) {
      return "Group Size must be a positive whole number.";
    }
    if (
      formData.monthly_installment <= 0 ||
      !Number.isInteger(Number(formData.monthly_installment))
    ) {
      return "Monthly Installment must be a positive whole number.";
    }
    if (
      formData.duration_months <= 0 ||
      !Number.isInteger(Number(formData.duration_months))
    ) {
      return "Duration must be a positive whole number.";
    }
    if (formData.group_size !== formData.duration_months) {
      return "Group Size and Duration must be the same.";
    }
    if (!formData.start_date) {
      return "Start Date cannot be empty.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const startDate = getFirstDayOfMonth(formData.start_date);

    const dataToSend = {
      ...formData,
      start_date: startDate,
      chit_value: Number(formData.chit_value),
      group_size: Number(formData.group_size),
      monthly_installment: Number(formData.monthly_installment),
      duration_months: Number(formData.duration_months),
    };
    delete dataToSend.end_date;

    try {
      if (mode === "create") {
        await createChitGroup(dataToSend, token);
        setSuccess("Chit group created successfully!");
      } else if (mode === "edit") {
        await updateChitGroup(id, dataToSend, token);
        setSuccess("Chit group updated successfully!");
      }
      setTimeout(() => {
        navigate("/groups");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "view") return "View Chit Group";
    if (mode === "edit") return "Edit Chit Group";
    return "Create New Chit Group";
  };

  const getButton = () => {
    if (mode === "view") return null;
    if (mode === "edit") {
      return (
        <Button
          type="submit"
          className="w-full mt-8"
          disabled={loading}
          variant="warning"
        >
          {loading ? (
            <FiLoader className="animate-spin mx-auto" />
          ) : (
            <>
              <FiEdit className="inline-block mr-2" />
              Update Chit Group
            </>
          )}
        </Button>
      );
    }
    return (
      <Button
        type="submit"
        className="w-full mt-8"
        disabled={loading}
        variant="success"
      >
        {loading ? (
          <FiLoader className="animate-spin mx-auto" />
        ) : (
          <>
            <FiPlus className="inline-block mr-2" />
            Create Chit Group
          </>
        )}
      </Button>
    );
  };

  const dummyNavLinkClick = () => {};
  const dummyActiveSection = "groups";
  const dummyLoginClick = () => {};

  if (loading && !formData.name && id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  // --- Reusable Section Components ---
  const DetailsSection = () => (
    <Card>
      <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
        <FiInfo /> Details
      </h2>
      <hr className="border-border mb-4" />
      <form onSubmit={handleSubmit}>
        {success && (
          <Message type="success" title="Success">
            {success}
          </Message>
        )}
        {error && (
          <Message type="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Message>
        )}
        <fieldset disabled={mode === "view"} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Group Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiTag className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                ref={nameInputRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                maxLength={50}
                placeholder="Kasi Malla Family Chit"
                required
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="chit_value"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Chit Value
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <RupeeIcon className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="text"
                  id="chit_value"
                  name="chit_value"
                  value={
                    formData.chit_value
                      ? parseInt(formData.chit_value).toLocaleString("en-IN")
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                  placeholder="1,00,000"
                  required
                  inputMode="numeric"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="group_size"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Group Size
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiUsers className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="number"
                  id="group_size"
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                  min="1"
                  placeholder="20"
                  required
                />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="monthly_installment"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Monthly Installment
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <RupeeIcon className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="text"
                  id="monthly_installment"
                  name="monthly_installment"
                  value={
                    formData.monthly_installment
                      ? parseInt(formData.monthly_installment).toLocaleString(
                          "en-IN"
                        )
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                  placeholder="5,000"
                  required
                  inputMode="numeric"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="duration_months"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Duration (months)
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiClock className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  type="number"
                  id="duration_months"
                  name="duration_months"
                  value={formData.duration_months}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                  min="1"
                  placeholder="20"
                  required
                />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="start_date"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Start Date
              </label>
              <CustomMonthInput
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="end_date"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                End Date
              </label>
              <CustomMonthInput
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>
        {getButton()}
      </form>
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
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection={dummyActiveSection}
          onNavLinkClick={dummyNavLinkClick}
          onLoginClick={dummyLoginClick}
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="relative flex justify-center items-center mb-4">
                <Link
                  to="/groups"
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                  aria-label="Go back to groups"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  {getTitle()}
                </h1>
              </div>
              <hr className="my-4 border-border" />

              {/* --- MOBILE/TABLET VIEW (TABS) --- */}
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
                {activeTab === "details" && <DetailsSection />}
                {activeTab === "members" && <MembersSection />}
                {activeTab === "payments" && <PaymentsSection />}
              </div>

              {/* --- DESKTOP VIEW (GRID) --- */}
              <div className="hidden md:grid md:grid-cols-2 md:gap-8">
                {/* --- Left Column --- */}
                <div className="md:col-span-1">
                  <DetailsSection />
                </div>
                {/* --- Right Column --- */}
                <div className="space-y-8">
                  <MembersSection />
                  <PaymentsSection />
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={dummyActiveSection}
        onNavLinkClick={dummyNavLinkClick}
        onLoginClick={dummyLoginClick}
      />
      <BottomNav />
    </>
  );
};

export default GroupDetailPage;
