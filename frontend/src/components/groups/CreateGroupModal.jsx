// frontend/src/components/groups/CreateGroupModal.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiX, FiLoader, FiArrowRight, FiUsers, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import GroupDetailsForm from "../forms/GroupDetailsForm";
import Button from "../ui/Button";
import Message from "../ui/Message";
import Stepper from "../ui/Stepper";
import { RupeeIcon } from "../ui/Icons";
import { createChitGroup } from "../../services/chitsService";
import {
  calculateEndDate,
  calculateStartDate,
  calculateDuration,
  getFirstDayOfMonth,
} from "../../utils/dateUtils";

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

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { token } = useSelector((state) => state.auth);
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const steps = [
    { name: "Details", icon: <FiInfo size={20} /> },
    { name: "Members", icon: <FiUsers size={20} /> },
    { name: "Payments", icon: <RupeeIcon className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        name: "",
        chit_value: "",
        group_size: "",
        monthly_installment: "",
        duration_months: "",
        start_date: "",
        end_date: "",
      });
      setError(null);
      setSuccess(null);
      setIsLoading(false);
    }
  }, [isOpen]);

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
    setIsLoading(true);
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
      const newGroup = await createChitGroup(dataToSend, token);
      setSuccess(`Group "${newGroup.name}" created successfully!`);
      setTimeout(() => {
        onGroupCreated();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-30 flex justify-center items-start overflow-y-auto p-4 pt-8 sm:pt-16 transition-opacity duration-300 ease-in-out bg-black/50 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-background-primary rounded-lg shadow-lg w-full max-w-4xl transition-all duration-300 ease-in-out mb-8 ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-white/80 transition-transform duration-300 hover:rotate-90 cursor-pointer z-20 md:text-text-secondary md:hover:text-text-primary"
          aria-label="Close modal"
        >
          <FiX className="w-6 h-6" />
        </button>

        <div className="grid md:grid-cols-3">
          <div className="relative hidden md:flex flex-col p-8 rounded-l-lg bg-accent text-white">
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-center">
                <h2 className="text-3xl font-bold font-heading mb-2">
                  Setup Group
                </h2>
                <p className="text-blue-200">
                  Follow the steps to get your new group up and running.
                </p>
              </div>

              <hr className="my-8 border-white/20" />

              <div className="flex-grow">
                <Stepper steps={steps} currentStep={step} variant="on-dark" />
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="md:col-span-2 p-8">
            <div className="text-center md:hidden mb-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Create New Group
              </h2>
              <div className="my-6 flex justify-center">
                <Stepper steps={steps} currentStep={step} />
              </div>
              <hr className="border-border" />
            </div>

            <div className="overflow-hidden min-h-[420px]">
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
                    <GroupDetailsForm
                      mode="create"
                      formData={formData}
                      onFormChange={handleFormChange}
                      onFormSubmit={handleSubmit}
                      error={error}
                      success={success}
                    />
                  )}
                  {step === 2 && (
                    <div className="text-center p-8 flex flex-col justify-center items-center min-h-[420px]">
                      <FiUsers className="w-20 h-20 text-accent/50 mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-text-primary">
                        Add Members
                      </h3>
                      <p className="text-text-secondary max-w-sm">
                        This feature is coming soon. You'll be able to add and
                        assign members to the group right from here.
                      </p>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="text-center p-8 flex flex-col justify-center items-center min-h-[420px]">
                      <RupeeIcon className="w-20 h-20 text-accent/50 mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-text-primary">
                        Setup Payments
                      </h3>
                      <p className="text-text-secondary max-w-sm">
                        Payment tracking and management will be available in a
                        future update.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
              <Button
                onClick={handlePrevStep}
                disabled={step === 1 || isLoading}
                variant="secondary"
              >
                Previous
              </Button>
              {step < 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={isLoading || !formData.name}
                  variant="primary"
                >
                  Next <FiArrowRight className="inline ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(formData)}
                  disabled={isLoading || !formData.name}
                  variant="success"
                  type="submit"
                  form="group-details-form"
                >
                  {isLoading ? (
                    <FiLoader className="animate-spin mx-auto" />
                  ) : (
                    "Create Group"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
