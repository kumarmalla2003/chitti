// frontend/src/features/members/hooks/useMemberReport.jsx

import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { getAssignmentsForMember } from "../../../services/assignmentsService";
import { getCollectionsByMemberId } from "../../../services/collectionsService";

/**
 * Custom hook for generating member PDF reports.
 * Encapsulates data fetching, PDF generation, and download logic.
 *
 * @param {Object} options - Hook options
 * @param {string|number} options.memberId - The ID of the member
 * @param {Object} options.memberData - The member data from form
 * @returns {Object} Report generation state and handlers
 */
export const useMemberReport = ({ memberId, memberData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate and download the PDF report.
   * Dynamically imports the PDF component to enable lazy loading.
   */
  const generateReport = useCallback(async () => {
    if (!memberId) {
      setError("No member ID provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all required data in parallel
      const [assignmentsData, collectionsData] = await Promise.all([
        getAssignmentsForMember(memberId),
        getCollectionsByMemberId(memberId),
      ]);

      // Dynamically import the PDF component for lazy loading
      const { default: MemberReportPDF } = await import(
        "../components/reports/MemberReportPDF"
      );

      // Prepare report props
      const memberObj = {
        id: memberId,
        full_name: memberData?.full_name || "Member",
        phone_number: memberData?.phone_number || "",
      };

      const reportProps = {
        member: memberObj,
        assignments: assignmentsData,
        collections: collectionsData.collections,
      };

      // Generate report name
      const reportName = `${memberObj.full_name} Report`;

      // Generate PDF blob
      const blob = await pdf(<MemberReportPDF {...reportProps} />).toBlob();

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
      setError("Failed to generate member report.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId, memberData]);

  return {
    isLoading,
    error,
    generateReport,
    clearError: () => setError(null),
  };
};

export default useMemberReport;
