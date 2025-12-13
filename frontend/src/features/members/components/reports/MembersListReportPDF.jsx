// frontend/src/components/reports/MembersListReportPDF.jsx

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
    textTransform: "uppercase",
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
    gap: 12,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "45%",
  },
  highlightLabel: {
    fontSize: 9,
    color: theme.white,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.white,
    marginBottom: 4,
  },
  highlightSubtext: {
    fontSize: 7.5,
    color: theme.white,
    textAlign: "center",
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

const MembersListReportPDF = ({ members, collections = [], payouts = [], chits = [] }) => {
  // Helper to calculate active chits for a member
  const getActiveCount = (member) => {
    if (!member.assignments || member.assignments.length === 0) return 0;
    const today = new Date().toISOString().split("T")[0];
    return member.assignments.filter((a) => {
      if (!a.chit || !a.chit.start_date || !a.chit.end_date) return false;
      return today >= a.chit.start_date && today <= a.chit.end_date;
    }).length;
  };

  const data = members.map((member, index) => ({
    ...member,
    s_no: index + 1,
    active_chits: getActiveCount(member),
  }));

  const totalMembers = members.length;
  const activeMembers = data.filter((m) => m.active_chits > 0);

  // --- Metrics Calculations ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const activeChitsData = chits.filter((c) => c.status === "Active");

  // Monthly Collection
  const collectedThisMonth = collections.reduce((sum, c) => {
    if (!c.collection_date) return sum;
    const [cYear, cMonth] = c.collection_date.split("-").map(Number);
    if (cYear === currentYear && cMonth - 1 === currentMonth) {
      return sum + (c.amount_paid || 0);
    }
    return sum;
  }, 0);

  // Calculate monthly collection target (handle different chit types)
  const monthlyCollectionTarget = activeChitsData.reduce((sum, c) => {
    let chitTotal = 0;
    if (c.chit_type === "fixed" || !c.chit_type) {
      chitTotal = (c.monthly_installment || 0) * (c.size || 0);
    } else if (c.chit_type === "variable") {
      // Calculate current cycle from chit start date
      const startDate = new Date(c.start_date);
      const today = new Date();
      const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                        (today.getMonth() - startDate.getMonth()) + 1;
      const currentCycle = Math.max(1, Math.min(monthsDiff, c.duration_months || 1));
      const totalCycle = c.duration_months || 1;
      
      // Formula: (total - current + 1) × before + (current - 1) × after
      const membersBefore = totalCycle - currentCycle + 1;
      const membersAfter = currentCycle - 1;
      chitTotal = membersBefore * (c.installment_before_payout || 0) + 
                 membersAfter * (c.installment_after_payout || 0);
    }
    return sum + chitTotal;
  }, 0);

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
      };
    },
    { paidAmount: 0, targetAmount: 0 }
  );

  const paidThisMonth = payoutMetrics.paidAmount;
  const monthlyPayoutTarget = payoutMetrics.targetAmount;

  // Pending This Month
  const membersWithPending = new Set();
  collections.forEach((c) => {
    if (!c.collection_date) return;
    const [cYear, cMonth] = c.collection_date.split("-").map(Number);
    if (cYear === currentYear && cMonth - 1 === currentMonth) {
      if (c.collection_status === "Unpaid" || c.collection_status === "Partial") {
        if (c.member?.id) {
          membersWithPending.add(c.member.id);
        }
      }
    }
  });

  // Collection Count - for Box 4
  const collectionsThisMonth = collections.filter((c) => {
    if (!c.collection_date) return false;
    const [cYear, cMonth] = c.collection_date.split("-").map(Number);
    return cYear === currentYear && cMonth - 1 === currentMonth;
  });

  const collectedCount = collectionsThisMonth.filter(
    (c) => c.collection_status === "Paid"
  ).length;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "";
    const num = Number(val.toString().replace(/,/g, ""));
    return isNaN(num) ? "Rs. 0" : `Rs. ${num.toLocaleString("en-IN")}`;
  };

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      style: { width: "10%", textAlign: "center" },
    },
    {
      header: "Full Name",
      accessor: "full_name",
      style: { width: "40%", textAlign: "center", paddingLeft: 15 },
    },
    {
      header: "Phone Number",
      accessor: "phone_number",
      style: { width: "30%", textAlign: "center" },
    },
    {
      header: "Active Chits",
      accessor: "active_chits",
      style: { width: "15%", textAlign: "center" },
      cell: (row) => row.active_chits,
    },
    {
      header: "Status",
      accessor: "status",
      style: { width: "15%", textAlign: "center" },
      conditionalStyle: (row) => {
        // Active if active_chits > 0, else Inactive
        const status = row.active_chits > 0 ? "Active" : "Inactive";
        return status === "Active"
          ? { color: theme.success, fontWeight: "bold" }
          : { color: theme.textLight, fontWeight: "bold" };
      },
      cell: (row) => (row.active_chits > 0 ? "Active" : "Inactive"),
    },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.reportTitle}>All Members Report</Text>
        </View>

        {/* --- OVERVIEW --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.highlightContainer}>
              {/* Box 1: Monthly Collection */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Monthly Collection</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(collectedThisMonth)}
                </Text>
                <Text style={styles.highlightSubtext}>
                  Target: {formatCurrency(monthlyCollectionTarget)}
                </Text>
              </View>
              {/* Box 2: Monthly Payouts */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Monthly Payouts</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(paidThisMonth)}
                </Text>
                <Text style={styles.highlightSubtext}>
                  Target: {formatCurrency(monthlyPayoutTarget)}
                </Text>
              </View>
              {/* Box 3: Active Members */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Active Members</Text>
                <Text style={styles.highlightValue}>{activeMembers.length}</Text>
                <Text style={styles.highlightSubtext}>
                  Total Members: {totalMembers}
                </Text>
              </View>
              {/* Box 4: Collection Count (from CollectionsPage Card 3) */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Collection Count</Text>
                <Text style={styles.highlightValue}>{collectedCount}</Text>
                <Text style={styles.highlightSubtext}>
                  Total: {collectionsThisMonth.length} this month
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- TABLE --- */}
        <AtomicTable title="Members Directory" columns={columns} data={data} />

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

export default MembersListReportPDF;
