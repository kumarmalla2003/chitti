// frontend/src/features/chits/components/sections/TransactionsSection.jsx

import { AlertCircle } from "lucide-react";

/**
 * TransactionsSection component - placeholder for future ledger view.
 * Will show all money in/out for the chit.
 */
const TransactionsSection = ({ chitId, mode }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-text-secondary opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Transactions
                </h3>
                <p className="text-sm text-text-secondary max-w-sm">
                    Transaction ledger coming soon. This will show a complete record of all
                    money in (collections) and money out (payouts) for this chit.
                </p>
            </div>
        </div>
    );
};

export default TransactionsSection;
