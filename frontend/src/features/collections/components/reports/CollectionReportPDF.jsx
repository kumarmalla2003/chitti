// frontend/src/components/reports/CollectionReportPDF.jsx

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
  // --- OVERVIEW CARD ---
  overviewCard: {
    backgroundColor: theme.white,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  // Inner Cards (Highlight Boxes)
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
  // --- DIVIDER ---
  divider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginBottom: 24,
    width: "100%",
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

const CollectionReportPDF = ({ collections, filters }) => {
  const totalAmount = collections.reduce((sum, p) => sum + p.amount_paid, 0);
  const totalCount = collections.length;

  const data = collections.map((p, i) => ({
    s_no: i + 1,
    date: formatDate(p.collection_date),
    member: p.member?.full_name || "Unknown",
    chit: p.chit?.name || "Unknown",
    method: p.collection_method,
    amount: formatCurrency(p.amount_paid),
    status: p.collection_status || "Unpaid",
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
        // Access raw object via row._original if supported by atomic table,
        // or we need to ensure 'status' is mapped in data.
        // Looking at data mapping above: data doesn't have status yet.
        const status = row.status || "Unpaid";
        switch (status) {
          case "Paid":
            return { color: theme.success, fontWeight: "bold" };
          case "Partial":
            return { color: theme.warning, fontWeight: "bold" };
          default:
            return { color: theme.error, fontWeight: "bold" };
        }
      },
      cell: (row) => row.status,
    },
  ];

  // --- Dynamic Title & Subtitle Logic ---
  let title = "COLLECTIONS REPORT";
  let subtitle = "";

  if (filters.chitId) {
    title = "COLLECTIONS REPORT";
    let chitName = filters.chitName || "";
    // Append 'Chit' if not present
    if (!chitName.toLowerCase().endsWith("chit")) {
      chitName += " Chit";
    }
    subtitle = chitName;
  } else if (filters.memberId) {
    title = "COLLECTIONS REPORT";
    subtitle = filters.memberName || "";
  } else if (filters.startDate) {
    title = "COLLECTIONS REPORT";
    subtitle = `Period: ${formatDate(filters.startDate)} to ${formatDate(
      filters.endDate
    )}`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.reportTitle}>{title}</Text>
          <Text style={styles.reportSubtitle}>{subtitle}</Text>
        </View>

        {/* Overview with Inner Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.highlightContainer}>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Total Transactions</Text>
                <Text style={styles.highlightValue}>{totalCount}</Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Total Collected</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* HR Divider */}
        <View style={styles.divider} />

        {/* Table */}
        <AtomicTable
          title="Transaction Details"
          columns={columns}
          data={data}
        />

        {/* Footer */}
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

export default CollectionReportPDF;
