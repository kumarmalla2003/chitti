// frontend/src/pages/PaymentDetailPage.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useScrollToTop from "../hooks/useScrollToTop";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PaymentDetailsForm from "../components/forms/PaymentDetailsForm";
import PaymentViewDashboard from "./PaymentViewDashboard"; // <-- IMPORTED
import Message from "../components/ui/Message";
import {
  FiLoader,
  FiArrowLeft,
  FiPlus,
  FiSave,
  FiInfo,
  FiEdit, // Import FiEdit if it wasn't there (though used in conditional Link previously)
} from "react-icons/fi";
import {
  getPaymentById,
  createPayment,
  patchPayment,
} from "../services/paymentsService";

const PaymentDetailPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const defaultAssignmentId = queryParams.get("assignmentId");

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    chit_assignment_id: defaultAssignmentId || "",
    amount_paid: "",
    payment_date: new Date().toISOString().split("T")[0], // Default to today
    payment_method: "Cash",
    notes: "",
  });
  const [originalData, setOriginalData] = useState(null);

  // State to hold full payment object for 'view' mode
  const [paymentDetails, setPaymentDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useScrollToTop(success || error);

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchPayment = async () => {
      setPageLoading(true);
      try {
        const payment = await getPaymentById(id, token);
        const fetchedData = {
          chit_assignment_id: payment.chit_assignment_id,
          amount_paid: payment.amount_paid.toString(),
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          notes: payment.notes || "",
        };
        setFormData(fetchedData);
        setOriginalData(fetchedData);
        setPaymentDetails(payment); // Store full object for view mode
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
      fetchPayment();
    } else {
      setMode("view");
      fetchPayment();
    }
  }, [id, location.pathname, token]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setError(null);
    setSuccess(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSend = {
        ...formData,
        amount_paid: parseFloat(formData.amount_paid.replace(/,/g, "")),
        chit_assignment_id: parseInt(formData.chit_assignment_id),
      };

      if (mode === "create") {
        const newPayment = await createPayment(dataToSend, token);
        navigate(`/payments/view/${newPayment.id}`, {
          state: { success: "Payment logged successfully!" },
        });
      } else if (mode === "edit") {
        const changes = {};
        for (const key in dataToSend) {
          if (String(formData[key]) !== String(originalData[key])) {
            changes[key] = dataToSend[key];
          }
        }

        if (Object.keys(changes).length > 0) {
          const updatedPayment = await patchPayment(id, changes, token);
          setOriginalData(formData);
          setSuccess("Payment updated successfully!");
          setPaymentDetails(updatedPayment);
        } else {
          setSuccess("No changes to save.");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "create") return "Log New Payment";
    if (mode === "edit") return "Edit Payment";
    // For view mode, the Dashboard has its own header title, so we can return null or keep "Payment Details"
    // Keep it empty or generic here if the dashboard handles it,
    // but the page header needs *something* or we hide it.
    // The DetailPage header contains the back button and the title.
    return "Payment Details";
  };

  const handleBackNavigation = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/payments");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection="payments"
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              {/* --- Header Row --- */}
              <div className="relative flex justify-center items-center mb-4">
                <button
                  onClick={handleBackNavigation}
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
                <h1
                  ref={titleRef}
                  tabIndex="-1"
                  className="text-2xl md:text-3xl font-bold text-text-primary text-center outline-none"
                >
                  {getTitle()}
                </h1>
                {mode === "view" && (
                  <Link
                    to={`/payments/edit/${id}`}
                    className="absolute right-0 p-2 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200 print:hidden"
                  >
                    <FiEdit className="w-6 h-6" />
                  </Link>
                )}
              </div>
              <hr className="my-4 border-border" />

              <div className="w-full max-w-2xl mx-auto">
                {success && (
                  <Message type="success" title="Success">
                    {success}
                  </Message>
                )}
                {error && (
                  <Message
                    type="error"
                    title="Error"
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Message>
                )}
              </div>

              {/* --- VIEW MODE: Dashboard --- */}
              {mode === "view" && paymentDetails ? (
                <div className="max-w-4xl mx-auto">
                  <PaymentViewDashboard
                    paymentData={paymentDetails}
                    paymentId={id}
                  />
                </div>
              ) : (
                /* --- CREATE / EDIT MODE: Form --- */
                <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleSubmit}>
                    <Card>
                      {/* Only show "Details" icon header if in Create/Edit mode context */}
                      <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                        <FiInfo /> Details
                      </h2>
                      <hr className="border-border mb-4" />

                      <PaymentDetailsForm
                        mode={mode}
                        formData={formData}
                        onFormChange={handleFormChange}
                        defaultAssignmentId={
                          mode === "create" ? defaultAssignmentId : null
                        }
                        paymentData={paymentDetails}
                        // Passing defaults if needed for pre-fill logic inside form
                      />
                      {mode !== "view" && (
                        <div className="flex justify-end mt-6">
                          <Button
                            type="submit"
                            variant={mode === "create" ? "success" : "warning"}
                            disabled={loading}
                            className="w-full"
                          >
                            {loading ? (
                              <FiLoader className="animate-spin mx-auto" />
                            ) : mode === "create" ? (
                              <>
                                <FiPlus className="inline-block mr-2" />
                                Log Payment
                              </>
                            ) : (
                              <>
                                <FiSave className="inline-block mr-2" />
                                Update Payment
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </Card>
                  </form>
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
        activeSection="payments"
      />
      <BottomNav />
    </>
  );
};

export default PaymentDetailPage;
