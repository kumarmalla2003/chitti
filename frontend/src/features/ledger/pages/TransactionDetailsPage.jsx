// frontend/src/features/ledger/pages/TransactionDetailsPage.jsx

import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import TransactionForm from "../components/forms/TransactionForm";
import Card from "../../../components/ui/Card";
import { ArrowLeft, WalletMinimal, TrendingUp } from "lucide-react";

const TransactionDetailsPage = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const [currentType, setCurrentType] = useState(state?.type || "collection");

    const handleBack = () => {
        navigate(-1);
    };

    const typeLabel = currentType === "collection" ? "Collection" : "Payout";
    const TypeIcon = currentType === "collection" ? WalletMinimal : TrendingUp;
    const typeColor = currentType === "collection" ? "text-success-accent" : "text-error-accent";

    return (
        <div className="w-full">
            {/* Page Header - matches ChitDetailPage structure */}
            <div className="relative flex justify-center items-center mb-4">
                <button
                    onClick={handleBack}
                    className="absolute left-0 text-text-primary hover:text-accent transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
                    {id ? `Edit ${typeLabel}` : `Log New ${typeLabel}`}
                </h1>
            </div>

            <hr className="my-4 border-border" />

            {/* Form Card - matches ChitDetailPage DetailsSectionComponent */}
            <Card>
                <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                    <TypeIcon className={`w-6 h-6 ${typeColor}`} /> {typeLabel} Details
                </h2>
                <hr className="border-border mb-4" />
                <TransactionForm
                    transactionId={id}
                    initialType={state?.type || "collection"}
                    initialChitId={state?.chitId}
                    initialMemberId={state?.memberId}
                    onTypeChange={setCurrentType}
                />
            </Card>
        </div>
    );
};

export default TransactionDetailsPage;
