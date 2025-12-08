// frontend/src/features/payouts/pages/PayoutDetailPage.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useScrollToTop from "../../../hooks/useScrollToTop";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import MobileNav from "../../../components/layout/MobileNav";
import BottomNav from "../../../components/layout/BottomNav";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PayoutDetailsForm from "../components/PayoutDetailsForm";
import PayoutViewDashboard from "./PayoutViewDashboard";
import Message from "../../../components/ui/Message";
import { Loader2, ArrowLeft, Plus, Save, Info, SquarePen } from "lucide-react";
import { usePayout, useUpdatePayout } from "../hooks/usePayout";
import { getPayoutsByChitId } from "../api/payoutsService";
import { getChitById } from "../../chits/api/chitsService";
import { getAssignmentsForChit } from "../../chits/api/assignmentsService";

const PayoutDetailPage = () => {
  const navigate = useNavigate();
  // token removed
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const defaultAssignmentId = queryParams.get("assignmentId");

  const [mode, setMode] = useState("view");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    chit_id: "",
    member_id: "",
    chit_assignment_id: defaultAssignmentId || "",
    amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    method: "Cash",
    notes: "",
  });
  const [originalData, setOriginalData] = useState(null);
  // const [payoutDetails, setPayoutDetails] = useState(null); // Managed by hook data

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- React Query ---
  const { data: payoutDetails, isLoading: pageLoading, error: queryError } = usePayout(id);
  const updatePayoutMutation = useUpdatePayout();
  const loading = updatePayoutMutation.isPending;

  useScrollToTop(success || error || queryError);

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    if (isCreate) {
      setMode("create");
    } else {
      setMode(isEdit ? "edit" : "view");
    }
  }, [location.pathname]);

  // Populate data
  useEffect(() => {
    if (payoutDetails && mode !== "create") {
      const fetchedData = {
        chit_id: payoutDetails.chit_id,
        member_id: payoutDetails.member_id,
        chit_assignment_id: payoutDetails.chit_assignment_id,
        amount: payoutDetails.amount ? payoutDetails.amount.toString() : "",
        paid_date: payoutDetails.paid_date || new Date().toISOString().split("T")[0],
        method: payoutDetails.method || "Cash",
        notes: payoutDetails.notes || "",
      };
      setFormData(fetchedData);
      setOriginalData(fetchedData);
    }
  }, [payoutDetails, mode]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
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
    setError(null);
    setSuccess(null);

    // Manual logic for create/update using mutation/service
    try {
      const dataToSend = {
        ...formData,
        amount: parseFloat(formData.amount.replace(/,/g, "")),
        chit_assignment_id: parseInt(formData.chit_assignment_id),
        member_id: formData.member_id ? parseInt(formData.member_id) : null,
        chit_id: formData.chit_id ? parseInt(formData.chit_id) : null,
      };

      if (mode === "create") {
        // ... (Same complex creation logic: find existing payout slot and update it) ...
        // Since this logic involves multiple fetches and specific business logic (finding month index),
        // I will keep it as manual async/await for now, calling services directly (no token).
        // React Query mutations are great but for sequential dependent logic, imperative style is clearer here unless I extract a thunk/hook.

        if (!formData.chit_id || !formData.chit_assignment_id) {
          throw new Error("Please select a Chit and a Winning Month.");
        }

        const assignmentsData = await getAssignmentsForChit(formData.chit_id);
        const assignment = assignmentsData.assignments.find(
          (a) => a.id === parseInt(formData.chit_assignment_id)
        );

        if (!assignment) {
          throw new Error("Selected assignment not found.");
        }

        const chit = await getChitById(formData.chit_id);

        const startDate = new Date(chit.start_date);
        const assignDate = new Date(assignment.chit_month);
        const monthIndex =
          (assignDate.getFullYear() - startDate.getFullYear()) * 12 +
          (assignDate.getMonth() - startDate.getMonth()) +
          1;

        const payoutsData = await getPayoutsByChitId(formData.chit_id);
        const targetPayout = payoutsData.payouts.find(
          (p) => p.month === monthIndex
        );

        if (!targetPayout) {
          throw new Error(
            `No scheduled payout found for Month ${monthIndex}. Check chit duration.`
          );
        }

        // Use mutation to update
        updatePayoutMutation.mutate({ id: targetPayout.id, data: dataToSend }, {
            onSuccess: () => {
                setSuccess("Payout recorded successfully!");
                navigate(`/payouts/view/${targetPayout.id}`, {
                    state: { success: "Payout recorded successfully!" },
                });
            },
            onError: (err) => setError(err.message),
        });

      } else if (mode === "edit") {
        const changes = {};
        for (const key in dataToSend) {
          if (String(formData[key]) !== String(originalData[key])) {
            changes[key] = dataToSend[key];
          }
        }

        if (Object.keys(changes).length > 0) {
            updatePayoutMutation.mutate({ id, data: changes }, {
                onSuccess: () => {
                    setOriginalData(formData);
                    setSuccess("Payout updated successfully!");
                },
                onError: (err) => setError(err.message),
            });
        } else {
          setSuccess("No changes to save.");
        }
      }
    } catch (err) {
      setError(err.message);
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

  if (pageLoading && mode !== "create") {
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
