// frontend/src/components/reports/MemberReportPDF.jsx

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AtomicTable from "../../../../components/reports/components/Table";

const theme = {
  textPrimary: "#111827",
  textSecondary: "#374151",
  textLight: "#6B7280",
  bgSecondary: "#F9FAFB",
  bgCard: "#FFFFFF",
  bgHighlight: "#EFF6FF",
  borderHighlight: "#BFDBFE",
  accent: "#3B82F6",
  accentDark: "#1E40AF",
  accentLight: "#DBEAFE",
  accentVeryLight: "#EFF6FF",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  white: "#FFFFFF",
  borderLight: "#E5E7EB",
  border: "#D1D5DB",
  bgHeader: "#3B82F6",
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
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
  },
  headerLeft: { flex: 1 },
  headerCenter: { flex: 4, alignItems: "center", justifyContent: "center" },
  headerRight: { flex: 1 },
  memberNameHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.accent,
    textTransform: "uppercase",
    textAlign: "center",
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
    marginTop: 0,
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
    marginBottom: 0,
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
  textSuccess: { color: theme.success, fontWeight: "bold" },
  textError: { color: theme.error, fontWeight: "bold" },
});

const formatCurrency = (val) => {
  if (val === undefined || val === null) return "";
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? "Rs. 0" : `Rs. ${num.toLocaleString("en-IN")}`;
};

const formatFullDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MemberReportPDF = ({ member, assignments, collections }) => {
  // --- FIX 1: Corrected Logic for Participating Chits ---
  const uniqueChitsMap = new Map();

  const validAssignments = Array.isArray(assignments) ? assignments : [];

  validAssignments.forEach((assign) => {
    // Ensure the assignment object, its nested chit property, and the chit ID exist
    if (assign && assign.chit && assign.chit.id) {
      if (!uniqueChitsMap.has(assign.chit.id)) {
        // Store the chit object itself, ensuring it's a unique chit
        uniqueChitsMap.set(assign.chit.id, assign.chit);
      }
    }
  });

  const participatingChits = Array.from(uniqueChitsMap.values()).map(
    (chit, index) => ({
      ...chit,
      s_no: index + 1,
    })
  );

  const activeChitsCount = participatingChits.filter(
    (c) => c.status === "Active"
  ).length;
  // --- END FIX 1 ---

  const chitColumns = [
    {
      header: "S.No",
      accessor: "s_no",
      style: { width: "10%", textAlign: "center" },
    },
    {
      header: "Chit Name",
      accessor: "name",
      style: { width: "35%", textAlign: "center" },
    },
    {
      header: "Value",
      accessor: "chit_value",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => formatCurrency(row.chit_value),
    },
    {
      header: "Cycle",
      accessor: "chit_cycle",
      style: { width: "15%", textAlign: "center" },
    },
    {
      header: "Status",
      accessor: "status",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => (
        <Text
          style={
            row.status === "Active" ? styles.textSuccess : styles.textError
          }
        >
          {row.status}
        </Text>
      ),
    },
  ];

  const sortedCollections = collections
    ? [...collections].sort(
      (a, b) => new Date(a.collection_date) - new Date(b.collection_date)
    )
    : [];

  const collectionColumns = [
    {
      header: "Date",
      accessor: "collection_date",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => formatFullDate(row.collection_date),
    },
    {
      header: "Chit Name",
      accessor: "chit.name",
      style: { width: "35%", textAlign: "center" },
      cell: (row) => row.chit?.name || "-",
    },
    {
      header: "Amount",
      accessor: "amount_paid",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => formatCurrency(row.amount_paid),
    },
    {
      header: "Method",
      accessor: "collection_method",
      style: { width: "25%", textAlign: "center" },
    },
  ];

  // --- FIX 2: Set the correct header text format ---
  const headerText = `${member.full_name.toUpperCase()} REPORT`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}></View>
          <View style={styles.headerCenter}>
            <Text style={styles.memberNameHeader}>{headerText}</Text>
          </View>
          <View style={styles.headerRight}></View>
        </View>

        {/* --- OVERVIEW --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.highlightContainer}>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Phone Number</Text>
                <Text style={styles.highlightValue}>{member.phone_number}</Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Active Chits</Text>
                <Text style={styles.highlightValue}>{activeChitsCount}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- PARTICIPATING CHITS --- */}
        <AtomicTable
          title="Participating Chits"
          columns={chitColumns}
          data={participatingChits}
        />

        <View style={styles.divider} />

        {/* --- COLLECTION HISTORY --- */}
        <AtomicTable
          title="Collection History"
          columns={collectionColumns}
          data={sortedCollections}
        />

        {/* --- FOOTER --- */}
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
                  Generated On {formatFullDate(new Date())}
                </Text>
              </View>
            ) : null
          }
        />
      </Page>
    </Document>
  );
};

export default MemberReportPDF;
