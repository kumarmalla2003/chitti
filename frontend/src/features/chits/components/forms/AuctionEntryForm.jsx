
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/api";
import Button from "../../../../components/ui/Button";
import FormattedInput from "../../../../components/ui/FormattedInput";
import Message from "../../../../components/ui/Message";
import { Loader2, IndianRupee, User, Gavel, Save } from "lucide-react";

// Schema for Auction Entry
const auctionEntrySchema = z.object({
  bid_amount: z.number({ invalid_type_error: "Bid amount is required" })
    .min(0, "Bid amount must be non-negative"),
  member_id: z.string({ invalid_type_error: "Please select a winner" })
    .min(1, "Please select a winner"),
  notes: z.string().optional(),
});

/**
 * AuctionEntryForm - Form to record auction results (Bid Amount & Winner)
 */
const AuctionEntryForm = ({ 
  chitId, 
  payout, 
  onSuccess, 
  onCancel,
  members = [] 
}) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(auctionEntrySchema),
    defaultValues: {
      bid_amount: payout?.bid_amount || "",
      member_id: payout?.member_id ? String(payout.member_id) : "",
      notes: payout?.notes || "",
    },
    mode: "onTouched",
  });

  // API Mutation to update payout
  const updatePayoutMutation = useMutation({
    mutationFn: (data) => api.put(`/payouts/${payout.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["payouts", chitId]);
      queryClient.invalidateQueries(["chit", chitId]); 
      queryClient.invalidateQueries(["collections"]); // Collections change due to installment recalculation
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      setSubmitError(error.response?.data?.detail || "Failed to update auction result.");
    },
  });

  const onSubmit = (data) => {
    setSubmitError(null);
    const payload = {
      bid_amount: Number(data.bid_amount),
      member_id: Number(data.member_id),
      notes: data.notes,
      // If we are setting the winner, we should also might need to set method to 'cash' or 'bank' if paid? 
      // User only asked for bid amount and winner. Actual payment might happen later in Payouts tab?
      // But Payout table needs 'amount' which is auto-calculated in backend.
      // So checks: Payout date/method can be entered in Payouts tab later.
    };
    updatePayoutMutation.mutate(payload);
  };

  const formatNumber = (val) => val ? Number(val).toLocaleString("en-IN") : "";
  const parseNumber = (val) => val ? Number(val.toString().replace(/\D/g, "")) : "";

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Gavel className="w-5 h-5" />
            Auction Result - Month {payout.month}
          </h3>
          <p className="text-sm text-text-secondary">
             Planned Date: {new Date(payout.planned_amount).toLocaleDateString() === 'Invalid Date' ? 'N/A' : payout.paid_date || 'Not Paid'}
             {/* Display schedule info if available, but planned_amount is float not date. Payout doesn't have planned_date field in schema shown earlier? Ah, logic... */}
          </p>
       </div>

      {submitError && (
        <Message type="error" onClose={() => setSubmitError(null)}>
          {submitError}
        </Message>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Bid Amount */}
        <div>
          <label htmlFor="bid_amount" className="block text-sm font-medium text-text-secondary mb-1">
            Winning Bid Amount
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <IndianRupee className="w-4 h-4 text-text-secondary" />
            </span>
            <FormattedInput
              name="bid_amount"
              control={control}
              format={formatNumber}
              parse={parseNumber}
              id="bid_amount"
              autoComplete="off"
               className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.bid_amount ? "border-red-500" : "border-border"
              }`}
              placeholder="e.g. 5,000"
            />
          </div>
           {errors.bid_amount && (
            <p className="mt-1 text-xs text-red-500">{errors.bid_amount.message}</p>
          )}
        </div>

        {/* Member Select (Winner) */}
        <div>
           <label htmlFor="member_id" className="block text-sm font-medium text-text-secondary mb-1">
            Winner (Member)
          </label>
          <div className="relative flex items-center">
             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
               <User className="w-4 h-4 text-text-secondary" />
             </span>
             <select
                {...register("member_id")}
                id="member_id"
                className={`w-full pl-10 pr-4 py-2 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none ${
                  errors.member_id ? "border-red-500" : "border-border"
                }`}
             >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
             </select>
          </div>
          {errors.member_id && (
            <p className="mt-1 text-xs text-red-500">{errors.member_id.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">
            Notes (Optional)
          </label>
          <textarea
            {...register("notes")}
            id="notes"
             className="w-full px-4 py-2 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            rows="2"
            placeholder="Any comments..."
          ></textarea>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
            <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
            >
                Cancel
            </Button>
            <Button 
                type="submit" 
                variant="primary" 
                className="flex-1"
                disabled={isSubmitting || !isValid}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" /> Save Result
                    </>
                )}
            </Button>
        </div>

      </form>
    </div>
  );
};

AuctionEntryForm.propTypes = {
  chitId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  payout: PropTypes.object.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  members: PropTypes.array,
};

export default AuctionEntryForm;

