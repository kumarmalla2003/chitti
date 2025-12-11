// frontend/src/features/payouts/components/reports/PayoutReportPDF.jsx

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AtomicTable from "../../../../components/reports/components/Table";

const theme = {
  textPrimary: "#111827",
  textSecondary: "#374151",
  textLight: "#6B7280",
  bgHeader: "#EF4444", // Red header for Payouts
  bgZebra: "#FEF2F2",
  white: "#FFFFFF",
  borderLight: "#E5E7EB",
  accent: "#EF4444", // Red accent
  success: "#10B981", // Green for paid status
  warning: "#F59E0B", // Yellow for pending
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
  headerContainer: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.accent,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  reportSubtitle: {
    fontSize: 10,
    color: theme.textLight,
    textTransform: "uppercase",
  },
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
  overviewCard: {
    backgroundColor: theme.white,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  highlightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "bold",
    color: theme.white,
  },
  divider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginBottom: 24,
    width: "100%",
  },
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
    marginBottom: 4,
  },
  generatedDate: {
    fontSize: 9,
    color: theme.textLight,
  },
});

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN");
};

const PayoutReportPDF = ({ payouts, filters }) => {
  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalCount = payouts.length;

  const data = payouts.map((p, i) => ({
    s_no: i + 1,
    date: formatDate(p.payout_date),
    member: p.member?.full_name || "Unknown",
    chit: p.chit?.name || "Unknown",
    method: p.method,
    amount: formatCurrency(p.amount),
    status: p.status || "Pending",
  }));

  const columns = [
    {
      header: "Date",
      accessor: "date",
      style: { width: "15%", textAlign: "center" },
    },
    {
      header: "Member",
      accessor: "member",
      style: { width: "25%", textAlign: "center" },
    },
    {
      header: "Chit Group",
      accessor: "chit",
      style: { width: "25%", textAlign: "center" },
    },
    {
      header: "Method",
      accessor: "method",
      style: { width: "15%", textAlign: "center" },
    },
    {
      header: "Amount",
      accessor: "amount",
      style: { width: "20%", textAlign: "center" },
    },
    {
      header: "Status",
      accessor: "status",
      style: { width: "15%", textAlign: "center" },
      conditionalStyle: (row) => {
        const status = row.status || "Pending";
        return status === "Paid"
          ? { color: theme.success, fontWeight: "bold" } // Use success green for paid even in red theme
          : { color: theme.warning, fontWeight: "bold" };
      },
      cell: (row) => row.status,
    },
  ];

  let title = "PAYOUTS REPORT";
  let subtitle = "";

  if (filters.chitId) {
    let chitName = filters.chitName || "";
    if (!chitName.toLowerCase().endsWith("chit")) {
      chitName += " Chit";
    }
    subtitle = chitName;
  } else if (filters.memberId) {
    subtitle = filters.memberName || "";
  } else if (filters.startDate) {
    subtitle = `Period: ${formatDate(filters.startDate)} to ${formatDate(
      filters.endDate
    )}`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.reportTitle}>{title}</Text>
          <Text style={styles.reportSubtitle}>{subtitle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.highlightContainer}>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Total Payouts</Text>
                <Text style={styles.highlightValue}>{totalCount}</Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Total Disbursed</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <AtomicTable title="Payout Details" columns={columns} data={data} />

        <View fixed style={styles.footerContainer}>
          <View style={styles.footerDivider} />
          <Text style={styles.brandingText}>
            CHITTI - Smart Chit Fund Manager
          </Text>
          <Text style={styles.generatedDate}>
            Generated On {new Date().toLocaleDateString("en-IN")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PayoutReportPDF;
