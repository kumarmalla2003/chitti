// frontend/src/features/collections/pages/CollectionDetailPage.jsx

import { useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import useScrollToTop from "../../../hooks/useScrollToTop";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import CollectionDetailsForm from "../components/forms/CollectionDetailsForm";
import CollectionViewDashboard from "./CollectionViewDashboard";
import Message from "../../../components/ui/Message";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Save,
  Info,
  SquarePen,
} from "lucide-react";
import { useCollectionForm } from "../hooks/useCollectionForm";

const CollectionDetailPage = () => {
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
    collectionDetails,
    pageLoading,
    isSubmitting,
    error,
    success,
    setError,
    setSuccess,
    onSubmit,
  } = useCollectionForm(id, mode, defaultAssignmentId);

  // --- Scroll to Top on Messages ---
  useScrollToTop(success || error);

  // --- Handle Success Message from Navigation State ---
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setSuccess]);

  // --- Form Submission Wrapper ---
  const handleFormSubmit = useCallback(
    async (data) => {
      await onSubmit(data, { navigate });
    },
    [onSubmit, navigate]
  );

  // --- Page Title ---
  const getTitle = useCallback(() => {
    if (mode === "create") return "Log New Collection";
    if (mode === "edit") return "Edit Collection";
    return "Collection Details";
  }, [mode]);

  // --- Back Navigation ---
  const handleBackNavigation = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/collections");
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
        {/* --- Header Row --- */}
        <div className="relative flex justify-center items-center mb-4">
          <button
            onClick={handleBackNavigation}
            className="absolute left-0 text-text-primary hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
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
              to={`/collections/edit/${id}`}
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

        {mode === "view" && collectionDetails ? (
          <div>
            <CollectionViewDashboard
              collectionData={collectionDetails}
              collectionId={id}
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

                <CollectionDetailsForm
                  mode={mode}
                  control={control}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  defaultAssignmentId={
                    mode === "create" ? defaultAssignmentId : null
                  }
                  paymentData={collectionDetails}
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
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : mode === "create" ? (
                        <>
                          <Plus className="w-5 h-5 inline-block mr-2" />
                          Log Collection
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 inline-block mr-2" />
                          Update Collection
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

export default CollectionDetailPage;
