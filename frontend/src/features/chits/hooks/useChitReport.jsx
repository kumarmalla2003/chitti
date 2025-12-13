// frontend/src/features/chits/hooks/useChitReport.js

import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { getPayoutsByChitId } from "../../../services/payoutsService";
import { getAssignmentsForChit } from "../../../services/assignmentsService";
import { getCollectionsByChitId } from "../../../services/collectionsService";

/**
 * Custom hook for generating chit PDF reports.
 * Encapsulates data fetching, PDF generation, and download logic.
 *
 * @param {Object} options - Hook options
 * @param {string|number} options.chitId - The ID of the chit
 * @param {Object} options.chitData - The chit data from form or API
 * @param {Object} options.originalData - Original chit data from API
 * @returns {Object} Report generation state and handlers
 */
export const useChitReport = ({ chitId, chitData, originalData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate and download the PDF report.
   * Dynamically imports the PDF component to enable lazy loading.
   */
  const generateReport = useCallback(async () => {
    if (!chitId) {
      setError("No chit ID provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all required data in parallel
      const [payoutsData, assignmentsData, collectionsData] = await Promise.all([
        getPayoutsByChitId(chitId),
        getAssignmentsForChit(chitId),
        getCollectionsByChitId(chitId),
      ]);

      // Dynamically import the PDF component for lazy loading
      const { default: ChitReportPDF } = await import(
        "../components/reports/ChitReportPDF"
      );

      // Prepare report props
      const reportProps = {
        chit: {
          ...originalData,
          ...chitData,
          id: chitId,
        },
        payouts: payoutsData.payouts,
        assignments: assignmentsData.assignments,
        collections: collectionsData.collections,
      };

      // Generate report name
      let reportName = chitData?.name || "Chit";
      if (!reportName.toLowerCase().endsWith("chit")) {
        reportName += " Chit";
      }
      reportName += " Report";

      // Generate PDF blob
      const blob = await pdf(<ChitReportPDF {...reportProps} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [chitId, chitData, originalData]);

  return {
    isLoading,
    error,
    generateReport,
    clearError: () => setError(null),
  };
};

export default useChitReport;
