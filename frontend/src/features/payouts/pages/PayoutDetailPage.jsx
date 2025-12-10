// frontend/src/features/payouts/pages/PayoutDetailPage.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useScrollToTop from "../../../hooks/useScrollToTop";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PayoutDetailsForm from "../components/forms/PayoutDetailsForm";
import PayoutViewDashboard from "./PayoutViewDashboard";
import Message from "../../../components/ui/Message";
import { Loader2, ArrowLeft, Plus, Save, Info, SquarePen } from "lucide-react";
import {
  getPayoutById,
  updatePayout,
  getPayoutsByChitId,
} from "../../../services/payoutsService";
import { getChitById } from "../../../services/chitsService";
import { getAssignmentsForChit } from "../../../services/assignmentsService";
import { payoutSchema } from "../schemas/payoutSchema";

const PayoutDetailPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { id } = useParams();
  const location = useLocation();
  const titleRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const defaultAssignmentId = queryParams.get("assignmentId");

  const [mode, setMode] = useState("view");
  const [payoutDetails, setPayoutDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Keep success state for messages

  useScrollToTop(success || error);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      chit_id: "",
      member_id: "",
      chit_assignment_id: defaultAssignmentId || "",
      amount: "",
      paid_date: new Date().toISOString().split("T")[0],
      method: "Cash",
      notes: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    const path = location.pathname;
    const isCreate = path.includes("create");
    const isEdit = path.includes("edit");

    const fetchPayout = async () => {
      setPageLoading(true);
      try {
        const payout = await getPayoutById(id);
        const fetchedData = {
          chit_id: payout.chit_id ? String(payout.chit_id) : "",
          member_id: payout.member_id ? String(payout.member_id) : "",
          chit_assignment_id: payout.chit_assignment_id ? String(payout.chit_assignment_id) : "",
          amount: payout.amount ? Number(payout.amount) : "",
          paid_date: payout.paid_date || new Date().toISOString().split("T")[0],
          method: payout.method || "Cash",
          notes: payout.notes || "",
        };
        reset(fetchedData);
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
      // Reset to defaults for create mode
      reset({
        chit_id: "",
        member_id: "",
        chit_assignment_id: defaultAssignmentId || "",
        amount: "",
        paid_date: new Date().toISOString().split("T")[0],
        method: "Cash",
        notes: "",
      });
    } else if (isEdit) {
      setMode("edit");
      fetchPayout();
    } else {
      setMode("view");
      fetchPayout();
    }
  }, [id, location.pathname, isLoggedIn, reset, defaultAssignmentId]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Ensure numeric fields are correctly parsed (although zod handles types, we might need adjustments)
      const dataToSend = {
        ...data,
        amount: Number(data.amount),
        chit_assignment_id: parseInt(data.chit_assignment_id),
        member_id: data.member_id ? parseInt(data.member_id) : null,
        chit_id: data.chit_id ? parseInt(data.chit_id) : null,
      };

      if (mode === "create") {
        if (!dataToSend.chit_id || !dataToSend.chit_assignment_id) {
          throw new Error("Please select a Chit and a Winning Month.");
        }

        // 1. Fetch Chit Assignment to get the Winning Month Date
        const assignmentsData = await getAssignmentsForChit(
          dataToSend.chit_id
        );
        const assignment = assignmentsData.assignments.find(
          (a) => a.id === dataToSend.chit_assignment_id
        );

        if (!assignment) {
          throw new Error("Selected assignment not found.");
        }

        // 2. Fetch Chit details to get Start Date
        const chit = await getChitById(dataToSend.chit_id);

        // 3. Calculate Month Index (1-based) to identify the correct schedule row
        const startDate = new Date(chit.start_date);
        const assignDate = new Date(assignment.chit_month);
        const monthIndex =
          (assignDate.getFullYear() - startDate.getFullYear()) * 12 +
          (assignDate.getMonth() - startDate.getMonth()) +
          1;

        // 4. Find the corresponding pre-created Payout row
        const payoutsData = await getPayoutsByChitId(dataToSend.chit_id);
        const targetPayout = payoutsData.payouts.find(
          (p) => p.month === monthIndex
        );

        if (!targetPayout) {
          throw new Error(
            `No scheduled payout found for Month ${monthIndex}. Check chit duration.`
          );
        }

        // 5. Update the existing schedule row with transaction details
        await updatePayout(targetPayout.id, dataToSend);

        setSuccess("Payout recorded successfully!");
        // Navigate to view mode for the updated payout
        navigate(`/payouts/view/${targetPayout.id}`, {
          state: { success: "Payout recorded successfully!" },
        });
      } else if (mode === "edit") {
        const changes = {};
        // Use dirtyFields to find what changed
        Object.keys(dirtyFields).forEach((key) => {
          // We need to map field name to backend expectation if needed
          // For now assume names match
          // But we need to use the transformed values from dataToSend
          // or the raw values from data?
          // Since updatePayout expects snake_case and we have snake_case in dataToSend
          changes[key] = dataToSend[key];
        });

        if (Object.keys(changes).length > 0) {
          const updatedPayout = await updatePayout(id, changes);

          // Reset internal state to new values so dirtyFields clears?
          // Actually if we navigate or stay, we update existing state.
          // If we stay, allow further edits.
          reset(updatedPayout); // Resetting with new values clears dirtyFields
          setSuccess("Payout updated successfully!");
          setPayoutDetails(updatedPayout);
        } else {
          setSuccess("No changes to save.");
        }
      }
    } catch (err) {
      console.error(err);
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
            <form onSubmit={handleSubmit(onSubmit)}>
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
    </>
  );
};

export default PayoutDetailPage;
