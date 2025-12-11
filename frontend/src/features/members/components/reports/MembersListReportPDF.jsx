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

const MembersListReportPDF = ({ members }) => {
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
              {/* Box 1: Total Members */}
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Total Members</Text>
                <Text style={styles.highlightValue}>{totalMembers}</Text>
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
