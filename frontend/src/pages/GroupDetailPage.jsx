// frontend/src/pages/GroupDetailPage.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import GroupDetailsForm from "../components/forms/GroupDetailsForm";
import Stepper from "../components/ui/Stepper";
import { RupeeIcon } from "../components/ui/Icons";
import {
  FiInfo,
  FiUsers,
  FiLoader,
  FiArrowLeft,
  FiEdit,
  FiArrowRight,
} from "react-icons/fi";
import {
  createChitGroup,
  getChitGroupById,
  updateChitGroup,
} from "../services/chitsService";
import {
  calculateEndDate,
  calculateStartDate,
  calculateDuration,
  getFirstDayOfMonth,
  toYearMonth,
} from "../utils/dateUtils";
import useScreenSize from "../hooks/useScreenSize";

const stepVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 30 : -30,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction < 0 ? 30 : -30,
    transition: { duration: 0.4, ease: "easeInOut" },
  }),
};

const DetailsSection = ({
  mode,
  formData,
  onFormChange,
  onFormSubmit,
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
      onFormChange={onFormChange}
      onFormSubmit={onFormSubmit}
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

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();
  const isDesktop = useScreenSize();

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
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

  const steps = [
    { name: "Details", icon: <FiInfo size={20} /> },
    { name: "Members", icon: <FiUsers size={20} /> },
    { name: "Payments", icon: <RupeeIcon className="w-5 h-5" /> },
  ];

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

  useEffect(() => {
    if (mode === "create" && isDesktop) {
      navigate("/groups", { replace: true });
    }
  }, [mode, isDesktop, navigate]);

  const handleNextStep = () => {
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

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
      chit_value: Number(currentFormData.chit_value) || 0,
      group_size: Number(currentFormData.group_size) || 0,
      monthly_installment: Number(currentFormData.monthly_installment) || 0,
      duration_months: Number(currentFormData.duration_months) || 0,
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
    if (mode === "edit") return "Edit Chit Group";
    if (mode === "view") return formData.name || "Group Details";
    return "Create New Group";
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background-primary">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  const renderCreateSteps = () => (
    <>
      <div className="my-6 flex justify-center">
        <Stepper steps={steps} currentStep={step} direction="horizontal" />
      </div>
      <hr className="border-border mb-8" />
      <div className="overflow-hidden min-h-[450px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {step === 1 && (
              <DetailsSection
                mode="create"
                formData={formData}
                onFormChange={handleFormChange}
                onFormSubmit={handleSubmit}
                error={error}
                success={success}
              />
            )}
            {step === 2 && (
              <Card>
                <div className="text-center p-8 flex flex-col justify-center items-center min-h-[350px]">
                  <FiUsers className="w-20 h-20 text-accent/50 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Add Members</h3>
                  <p className="text-text-secondary max-w-sm">
                    This feature is coming soon.
                  </p>
                </div>
              </Card>
            )}
            {step === 3 && (
              <Card>
                <div className="text-center p-8 flex flex-col justify-center items-center min-h-[350px]">
                  <RupeeIcon className="w-20 h-20 text-accent/50 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Setup Payments</h3>
                  <p className="text-text-secondary max-w-sm">
                    This feature is coming soon.
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
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

  const renderViewEditMode = () => (
    <>
      <div className="w-full mx-auto md:hidden">
        <div className="flex items-center border-b border-border mb-6">
          <TabButton name="details" icon={<FiInfo />} label="Details" />
          <TabButton name="members" icon={<FiUsers />} label="Members" />
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
            onFormChange={handleFormChange}
            onFormSubmit={handleSubmit}
            error={error}
            success={success}
          />
        )}
        {activeTab === "members" && <MembersSection />}
        {activeTab === "payments" && <PaymentsSection />}
      </div>
      <div className="hidden md:block">
        <div className="space-y-8">
          <DetailsSection
            mode={mode}
            formData={formData}
            onFormChange={handleFormChange}
            onFormSubmit={handleSubmit}
            error={error}
            success={success}
          />
          <MembersSection />
          <PaymentsSection />
        </div>
      </div>
      {mode === "edit" && (
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            form="group-details-form"
            variant="warning"
            disabled={loading}
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
        </div>
      )}
    </>
  );

  if (mode === "create" && isDesktop) {
    return null;
  }

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

              {mode === "create" ? renderCreateSteps() : renderViewEditMode()}

              {mode === "create" && (
                <div className="mt-8 flex justify-between">
                  <Button
                    onClick={handlePrevStep}
                    disabled={step === 1 || loading}
                    variant="secondary"
                  >
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={loading || !formData.name}
                    >
                      Next <FiArrowRight className="inline ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubmit(formData)}
                      variant="success"
                      disabled={loading || !formData.name}
                      type="submit"
                      form="group-details-form"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin mx-auto" />
                      ) : (
                        "Create Group"
                      )}
                    </Button>
                  )}
                </div>
              )}
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
