// frontend/src/components/reports/ChitsListReportPDF.jsx

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AtomicTable from "../../../../components/reports/components/Table";

const theme = {
  textPrimary: "#111827",
  textSecondary: "#374151",
  textLight: "#6B7280",
  bgHeader: "#3B82F6",
  bgZebra: "#EFF6FF",
  white: "#FFFFFF",
  borderLight: "#E5E7EB",
  accent: "#3B82F6",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  bgSecondary: "#F9FAFB",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: "#F9FAFB",
    fontFamily: "Helvetica",
    color: theme.textPrimary,
    fontSize: 10,
  },
  // --- HEADER ---
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.accent,
    textTransform: "uppercase", // Uppercase as requested
    letterSpacing: 1.2,
  },
  // --- SECTIONS ---
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: theme.textPrimary,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderLeftWidth: 4,
    borderLeftColor: theme.accent,
    paddingLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginBottom: 24,
    width: "100%",
  },
  // --- OVERVIEW CARD ---
  overviewCard: {
    backgroundColor: theme.white,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  highlightContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  highlightBox: {
    width: "48%",
    backgroundColor: theme.accent,
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  highlightLabel: {
    fontSize: 8,
    color: theme.white,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.white,
    textAlign: "center",
  },
  highlightSubtext: {
    fontSize: 7,
    color: theme.white,
    marginTop: 3,
    textAlign: "center",
    opacity: 0.9,
  },
  // --- FOOTER ---
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 40,
    right: 40,
    paddingBottom: 30,
    alignItems: "center",
  },
  footerDivider: {
    height: 0.5,
    backgroundColor: theme.accent,
    marginBottom: 10,
    width: "100%",
  },
  brandingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: theme.accent,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 4,
  },
  generatedDateFooter: {
    fontSize: 9,
    color: theme.textLight,
    textAlign: "center",
  },
});

const formatCurrency = (val) => {
  if (val === undefined || val === null) return "";
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? "Rs. 0" : `Rs. ${num.toLocaleString("en-IN")}`;
};

const ChitsListReportPDF = ({ chits, collections = [], payouts = [] }) => {
  const data = chits.map((chit, index) => ({
    ...chit,
    s_no: index + 1,
  }));

  // --- Metrics (Matching Live UI) ---
  const activeChits = chits.filter(
    (c) => (c.calculatedStatus || c.status) === "Active"
  );

  const monthlyCollectionTarget = activeChits.reduce(
    (sum, c) => sum + (c.monthly_installment || 0) * (c.size || 0),
    0
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Optimized payout calculation - single pass
  const payoutMetrics = payouts.reduce(
    (metrics, p) => {
      if (!p.chit || !p.chit.start_date) return metrics;
      
      const chitStartDate = new Date(p.chit.start_date);
      const scheduledDate = new Date(chitStartDate);
      scheduledDate.setMonth(chitStartDate.getMonth() + (p.month - 1));
      
      const isThisMonth =
        scheduledDate.getMonth() === currentMonth &&
        scheduledDate.getFullYear() === currentYear;
      
      if (!isThisMonth) return metrics;
      
      return {
        paidAmount: metrics.paidAmount + (p.paid_date ? (p.amount || 0) : 0),
        targetAmount: metrics.targetAmount + (p.planned_amount || 0),
        paidCount: metrics.paidCount + (p.paid_date ? 1 : 0),
        totalCount: metrics.totalCount + 1,
      };
    },
    { paidAmount: 0, targetAmount: 0, paidCount: 0, totalCount: 0 }
  );

  const paidThisMonth = payoutMetrics.paidAmount;
  const monthlyPayoutTarget = payoutMetrics.targetAmount;
  const paidCount = payoutMetrics.paidCount;
  const totalScheduledCount = payoutMetrics.totalCount;


  const collectedThisMonth = collections.reduce((sum, p) => {
    if (!p.collection_date) return sum;
    const [pYear, pMonth] = p.collection_date.split("-").map(Number);
    if (pYear === currentYear && pMonth - 1 === currentMonth) {
      return sum + (p.amount_paid || 0);
    }
    return sum;
  }, 0);

  const totalActiveMembers = activeChits.reduce(
    (sum, c) => sum + (c.size || 0),
    0
  );

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      style: { width: "10%", textAlign: "center" },
    },
    {
      header: "Chit Name",
      accessor: "name",
      style: { width: "24%", textAlign: "center" },
    },
    {
      header: "Value",
      accessor: "chit_value",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => formatCurrency(row.chit_value),
    },
    {
      header: "Installment",
      accessor: "monthly_installment",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => formatCurrency(row.monthly_installment),
    },
    {
      header: "Cycle",
      accessor: "chit_cycle",
      style: { width: "12%", textAlign: "center" },
    },
    {
      header: "Status",
      accessor: "status",
      // STYLE: Centers the text
      style: { width: "14%", textAlign: "center" },
      // CONDITIONAL: Applies colors based on status
      conditionalStyle: (row) => {
        const status = row.calculatedStatus || row.status;
        switch (status) {
          case "Active":
            return { color: theme.success, fontWeight: "bold" };
          case "Upcoming":
            return { color: theme.warning, fontWeight: "bold" };
          case "Completed":
            return { color: theme.textLight, fontWeight: "bold" };
          default:
            return { color: theme.textSecondary, fontWeight: "bold" };
        }
      },
      cell: (row) => row.calculatedStatus || row.status,
    },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.reportTitle}>All Chits Report</Text>
        </View>

        {/* --- OVERVIEW --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.highlightContainer}>
              {/* Box 1: Monthly Payouts (was Box 2) */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Monthly Payouts</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(paidThisMonth)}
                </Text>
                <Text style={styles.highlightSubtext}>
                  Target: {formatCurrency(monthlyPayoutTarget)}
                </Text>
              </View>
              {/* Box 2: Monthly Collection (was Box 1) */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Monthly Collection</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(collectedThisMonth)}
                </Text>
                <Text style={styles.highlightSubtext}>
                  Target: {formatCurrency(monthlyCollectionTarget)}
                </Text>
              </View>
              {/* Box 3: Active Chits (unchanged) */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Active Chits</Text>
                <Text style={styles.highlightValue}>{activeChits.length}</Text>
                <Text style={styles.highlightSubtext}>
                  Total Chits: {chits.length}
                </Text>
              </View>
              {/* Box 4: Payout Count (from PayoutsPage Card 3) */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Payout Count</Text>
                <Text style={styles.highlightValue}>{paidCount}</Text>
                <Text style={styles.highlightSubtext}>
                  Total Scheduled: {totalScheduledCount}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- TABLE --- */}
        <AtomicTable title="Chits Directory" columns={columns} data={data} />

        <View
          fixed
          style={styles.footerContainer}
          render={({ pageNumber, totalPages }) =>
            pageNumber === totalPages ? (
              <View style={{ width: "100%", alignItems: "center" }}>
                <View style={styles.footerDivider} />
                <Text style={styles.brandingText}>
                  CHITTI - Smart Chit Fund Manager
                </Text>
                <Text style={styles.generatedDateFooter}>
                  Generated On {new Date().toLocaleDateString("en-IN")}
                </Text>
              </View>
            ) : null
          }
        />
      </Page>
    </Document>
  );
};

export default ChitsListReportPDF;
