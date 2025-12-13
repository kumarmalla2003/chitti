// frontend/src/features/payouts/pages/PayoutDetailPage.jsx

import { useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import useScrollToTop from "../../../hooks/useScrollToTop";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PayoutDetailsForm from "../components/forms/PayoutDetailsForm";
import PayoutViewDashboard from "./PayoutViewDashboard";
import Message from "../../../components/ui/Message";
import { Loader2, ArrowLeft, Plus, Save, Info, SquarePen } from "lucide-react";
import { usePayoutForm } from "../hooks/usePayoutForm";

const PayoutDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  // --- URL Query Params ---
  const queryParams = new URLSearchParams(location.search);
  const defaultAssignmentId = queryParams.get("assignmentId");

  // --- Mode Detection ---
  const mode = useMemo(() => {
    const path = location.pathname;
    if (path.includes("create")) return "create";
    if (path.includes("edit")) return "edit";
    return "view";
  }, [location.pathname]);

  // --- Custom Form Hook ---
  const {
    register,
    control,
    errors,
    handleSubmit,
    setValue,
    payoutDetails,
    pageLoading,
    isSubmitting,
    error,
    success,
    setError,
    onSubmit,
  } = usePayoutForm(id, mode, defaultAssignmentId);

  // --- Scroll to Top on Messages ---
  useScrollToTop(success || error);

  // --- Form Submission Wrapper ---
  const handleFormSubmit = useCallback(
    async (data) => {
      await onSubmit(data, { navigate });
    },
    [onSubmit, navigate]
  );

  // --- Page Title ---
  const getTitle = useCallback(() => {
    if (mode === "create") return "Record New Payout";
    if (mode === "edit") return "Edit Payout";
    return "Payout Details";
  }, [mode]);

  // --- Back Navigation ---
  const handleBackNavigation = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/payouts");
    }
  }, [location.key, navigate]);

  // --- Loading State ---
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
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

        {mode === "view" && payoutDetails ? (
          <div>
            <PayoutViewDashboard
              payoutData={payoutDetails}
              payoutId={id}
            />
          </div>
        ) : (
          /* --- CREATE / EDIT MODE: Form --- */
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <Card>
                <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                  <Info className="w-6 h-6" /> Details
                </h2>
                <hr className="border-border mb-4" />

                <PayoutDetailsForm
                  mode={mode}
                  control={control}
                  register={register}
                  setValue={setValue}
                  errors={errors}
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
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
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
    </>
  );
};

export default PayoutDetailPage;
