// frontend/src/components/reports/ChitsListReportPDF.jsx

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AtomicTable from "./components/Table";

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

const ChitsListReportPDF = ({ chits }) => {
  const data = chits.map((chit, index) => ({
    ...chit,
    s_no: index + 1,
  }));

  // --- Metrics ---
  // Replaced "Total Chits" with "Active Chits"
  const activeChits = chits.filter((c) => c.status === "Active").length;
  const totalValue = chits.reduce(
    (sum, chit) => sum + (Number(chit.chit_value) || 0),
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
      style: { width: "25%", textAlign: "center" },
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
      style: { width: "13%", textAlign: "center" },
      // CONDITIONAL: Applies Green/Red color based on status
      conditionalStyle: (row) => {
        if (row.status === "Active") {
          return { color: theme.success, fontWeight: "bold" };
        } else {
          return { color: theme.error, fontWeight: "bold" };
        }
      },
      cell: (row) => row.status,
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
              {/* Box 1: Active Chits (Focus on what matters) */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Active Chits</Text>
                <Text style={styles.highlightValue}>{activeChits}</Text>
              </View>
              {/* Box 2: Total Valuation */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Total Valuation</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(totalValue)}
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
