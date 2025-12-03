// frontend/src/pages/PayoutDetailPage.jsx

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
import PayoutDetailsForm from "../components/forms/PayoutDetailsForm";
import PayoutViewDashboard from "./PayoutViewDashboard";
import Message from "../components/ui/Message";
import { Loader2, ArrowLeft, Plus, Save, Info, SquarePen } from "lucide-react";
import { getPayoutById, updatePayout } from "../services/payoutsService";

const PayoutDetailPage = () => {
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
    amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    method: "Cash",
    notes: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useScrollToTop(success || error);

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchPayout = async () => {
      setPageLoading(true);
      try {
        const payout = await getPayoutById(id, token);
        const fetchedData = {
          chit_assignment_id: payout.chit_assignment_id,
          amount: payout.amount ? payout.amount.toString() : "",
          paid_date: payout.paid_date || new Date().toISOString().split("T")[0],
          method: payout.method || "Cash",
          notes: payout.notes || "",
        };
        setFormData(fetchedData);
        setOriginalData(fetchedData);
        setPayoutDetails(payout);
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
      fetchPayout();
    } else {
      setMode("view");
      fetchPayout();
    }
  }, [id, location.pathname, token]);

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
        amount: parseFloat(formData.amount.replace(/,/g, "")),
        chit_assignment_id: parseInt(formData.chit_assignment_id),
      };

      if (mode === "create") {
        // Create logic if needed
      } else if (mode === "edit") {
        const changes = {};
        for (const key in dataToSend) {
          if (String(formData[key]) !== String(originalData[key])) {
            changes[key] = dataToSend[key];
          }
        }

        if (Object.keys(changes).length > 0) {
          const updatedPayout = await updatePayout(id, changes, token);
          setOriginalData(formData);
          setSuccess("Payout updated successfully!");
          setPayoutDetails(updatedPayout);
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
    if (mode === "create") return "Record New Payout";
    if (mode === "edit") return "Edit Payout";
    return "Payout Details";
  };

  const handleBackNavigation = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/payouts");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
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
          activeSection="payouts"
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="relative flex justify-center items-center mb-4">
                <button
                  onClick={handleBackNavigation}
                  className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1
                  ref={titleRef}
                  className="text-2xl md:text-3xl font-bold text-text-primary text-center"
                >
                  {getTitle()}
                </h1>
                {mode === "view" && (
                  <Link
                    to={`/payouts/edit/${id}`}
                    className="absolute right-0 p-2 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200 print:hidden"
                  >
                    <SquarePen className="w-6 h-6" />
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
              {mode === "view" && payoutDetails ? (
                <div className="max-w-4xl mx-auto">
                  <PayoutViewDashboard
                    payoutData={payoutDetails}
                    payoutId={id}
                  />
                </div>
              ) : (
                /* --- CREATE / EDIT MODE: Form --- */
                <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleSubmit}>
                    <Card>
                      <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                        <Info className="w-6 h-6" /> Details
                      </h2>
                      <hr className="border-border mb-4" />

                      <PayoutDetailsForm
                        mode={mode}
                        formData={formData}
                        onFormChange={handleFormChange}
                        defaultAssignmentId={
                          mode === "create" ? defaultAssignmentId : null
                        }
                        payoutData={payoutDetails}
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
                              <Loader2 className="animate-spin mx-auto w-5 h-5" />
                            ) : mode === "create" ? (
                              <>
                                <Plus className="inline-block mr-2 w-5 h-5" />
                                Record Payout
                              </>
                            ) : (
                              <>
                                <Save className="inline-block mr-2 w-5 h-5" />
                                Update Payout
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
        activeSection="payouts"
      />
      <BottomNav />
    </>
  );
};

export default PayoutDetailPage;
