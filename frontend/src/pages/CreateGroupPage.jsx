// frontend/src/pages/CreateGroupPage.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Message from "../components/ui/Message";
import { FiArrowLeft, FiPlus, FiLoader } from "react-icons/fi";
import { createChitGroup } from "../services/chitsService";

const calculateEndDate = (startDate, durationMonths) => {
  if (!startDate || durationMonths <= 0) {
    return "";
  }
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + durationMonths);
  return start.toISOString().split("T")[0];
};

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const formRef = useRef(null);

  useEffect(() => {
    const { start_date, duration_months } = formData;
    if (start_date && duration_months > 0) {
      setFormData((prev) => ({
        ...prev,
        end_date: calculateEndDate(start_date, duration_months),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        end_date: "",
      }));
    }
  }, [formData.start_date, formData.duration_months]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? value : value,
    }));
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

    const dataToSend = {
      ...formData,
      chit_value: Number(formData.chit_value),
      group_size: Number(formData.group_size),
      monthly_installment: Number(formData.monthly_installment),
      duration_months: Number(formData.duration_months),
    };
    delete dataToSend.end_date;

    try {
      await createChitGroup(dataToSend, token);
      setSuccess("Chit group created successfully!");
      setTimeout(() => {
        navigate("/groups");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dummyNavLinkClick = () => {};
  const dummyActiveSection = "groups";
  const dummyLoginClick = () => {};

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
              {/* Centralized Heading and HR */}
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  Create New Chit Group
                </h1>
                <hr className="my-4 border-border" />
              </div>

              <div className="w-full max-w-2xl mx-auto">
                <Card>
                  <form ref={formRef} onSubmit={handleSubmit}>
                    {success && (
                      <Message type="success" title="Success">
                        {success}
                      </Message>
                    )}
                    {error && (
                      <Message
                        type="error"
                        title="Validation Error"
                        onClose={() => setError(null)}
                      >
                        {error}
                      </Message>
                    )}
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-text-secondary mb-1"
                        >
                          Group Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                          disabled={loading}
                          maxLength={50}
                          placeholder="e.g., Kasi Malla Family Chit"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="chit_value"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Chit Value (₹)
                          </label>
                          <input
                            type="number"
                            id="chit_value"
                            name="chit_value"
                            value={formData.chit_value}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            disabled={loading}
                            min="1"
                            placeholder="e.g., 100000"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="group_size"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Group Size
                          </label>
                          <input
                            type="number"
                            id="group_size"
                            name="group_size"
                            value={formData.group_size}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            disabled={loading}
                            min="1"
                            placeholder="e.g., 20"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="monthly_installment"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Monthly Installment (₹)
                          </label>
                          <input
                            type="number"
                            id="monthly_installment"
                            name="monthly_installment"
                            value={formData.monthly_installment}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            disabled={loading}
                            min="1"
                            placeholder="e.g., 5000"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="duration_months"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Duration (in months)
                          </label>
                          <input
                            type="number"
                            id="duration_months"
                            name="duration_months"
                            value={formData.duration_months}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            disabled={loading}
                            min="1"
                            placeholder="e.g., 20"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="start_date"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="end_date"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            End Date
                          </label>
                          <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-md focus:outline-none"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
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
                  </form>
                </Card>
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

export default CreateGroupPage;
