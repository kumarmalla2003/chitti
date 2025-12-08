// frontend/src/features/chits/components/ChitDetailsForm.jsx

import { useEffect } from "react";
import Message from "../../../components/ui/Message";
import CustomMonthInput from "../../../components/ui/CustomMonthInput";
import {
  Layers,
  Users,
  Clock,
  WalletMinimal,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const chitSchema = z.object({
  name: z.string().min(1, "Chit Name is required").max(50, "Name too long"),
  chit_value: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))) && Number(val.replace(/,/g, "")) > 0, "Must be a positive number"),
  size: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  monthly_installment: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))) && Number(val.replace(/,/g, "")) > 0, "Must be a positive number"),
  duration_months: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  start_date: z.string().min(1, "Start Date is required"),
  end_date: z.string().optional(),
  collection_day: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 31, "Must be between 1-31"),
  payout_day: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 31, "Must be between 1-31"),
});

const ChitDetailsForm = ({
  mode,
  formData,
  onFormChange,
  error,
  success,
  isPostCreation = false,
  onEnterKeyOnLastInput,
}) => {
  const isFormDisabled = mode === "view";

  const {
    control,
    register,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(chitSchema),
    defaultValues: formData,
    mode: "onChange"
  });

  // Sync parent changes to RHF (e.g. calculated fields)
  useEffect(() => {
    reset(formData);
  }, [formData, reset]);

  return (
    <>
      {success && (
        <Message type="success" title="Success">
          {success}
        </Message>
      )}
      {error && (
        <Message type="error" title="Error" onClose={() => {}}>
          {typeof error === "string"
            ? error
            : error.message || "An error occurred."}
        </Message>
      )}
      <fieldset
        disabled={isFormDisabled}
        className="space-y-6"
      >
        {/* Name */}
        <div>
          <label className="block text-lg font-medium text-text-secondary mb-1">
            Chit Name {mode === "edit" && <span className="text-xs text-text-secondary">(Cannot be changed)</span>}
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Layers className="w-5 h-5 text-text-secondary" /></span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              type="text"
              {...register("name", {
                  onChange: onFormChange
              })}
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.name ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
              placeholder="Kasi Malla Family Chit"
              disabled={isFormDisabled || mode === "edit"}
            />
          </div>
          {errors.name && <p className="text-error-accent text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Value & Size */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Chit Value</label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><IndianRupee className="w-5 h-5 text-text-secondary" /></span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                {...register("chit_value", { onChange: onFormChange })}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.chit_value ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="1,00,000"
              />
            </div>
            {errors.chit_value && <p className="text-error-accent text-sm mt-1">{errors.chit_value.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Size</label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Users className="w-5 h-5 text-text-secondary" /></span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                {...register("size", { onChange: onFormChange })}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.size ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="20"
              />
            </div>
            {errors.size && <p className="text-error-accent text-sm mt-1">{errors.size.message}</p>}
          </div>
        </div>

        {/* Installment & Duration */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Monthly Installment</label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><IndianRupee className="w-5 h-5 text-text-secondary" /></span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                {...register("monthly_installment", { onChange: onFormChange })}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.monthly_installment ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="5,000"
              />
            </div>
            {errors.monthly_installment && <p className="text-error-accent text-sm mt-1">{errors.monthly_installment.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Duration (months)</label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Clock className="w-5 h-5 text-text-secondary" /></span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                {...register("duration_months", { onChange: onFormChange })}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.duration_months ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="20"
              />
            </div>
            {errors.duration_months && <p className="text-error-accent text-sm mt-1">{errors.duration_months.message}</p>}
          </div>
        </div>

        {/* Dates */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Start Date</label>
            {/* CustomMonthInput needs to be handled via Controller or passing props manually if it's not registered directly */}
            {/* Assuming CustomMonthInput takes value/onChange */}
            <CustomMonthInput
              name="start_date"
              value={formData.start_date}
              onChange={(e) => {
                  onFormChange(e);
                  // RHF sync handled by useEffect via formData prop
              }}
              required
              disabled={isFormDisabled}
            />
            {errors.start_date && <p className="text-error-accent text-sm mt-1">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">End Date</label>
            <CustomMonthInput
              name="end_date"
              value={formData.end_date}
              onChange={onFormChange}
              disabled={isFormDisabled}
            />
          </div>
        </div>

        {/* Days */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Collection Day</label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><WalletMinimal className="w-5 h-5 text-text-secondary" /></span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                {...register("collection_day", { onChange: onFormChange })}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.collection_day ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="5"
                min="1" max="28"
              />
            </div>
            {errors.collection_day && <p className="text-error-accent text-sm mt-1">{errors.collection_day.message}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-1">Payout Day</label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><TrendingUp className="w-5 h-5 text-text-secondary" /></span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                {...register("payout_day", { onChange: onFormChange })}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border ${errors.payout_day ? 'border-error-accent' : 'border-border'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent`}
                placeholder="10"
                min="1" max="28"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && onEnterKeyOnLastInput) {
                        e.preventDefault();
                        onEnterKeyOnLastInput();
                    }
                }}
              />
            </div>
            {errors.payout_day && <p className="text-error-accent text-sm mt-1">{errors.payout_day.message}</p>}
          </div>
        </div>
      </fieldset>
    </>
  );
};

export default ChitDetailsForm;
