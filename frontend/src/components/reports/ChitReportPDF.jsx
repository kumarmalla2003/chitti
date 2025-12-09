// frontend/src/components/reports/ChitReportPDF.jsx

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AtomicTable from "./components/Table";
import { REPORT_THEME as theme } from "../../constants/colors";
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  formatFullDate,
} from "../../utils/formatters";
import { calculatePayoutDate } from "../../utils/calculations";

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
  chitNameHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.accent,
    textTransform: "uppercase",
    textAlign: "center",
    letterSpacing: 1.2,
  },
  // --- DIVIDER ---
  divider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginTop: 0,
    marginBottom: 24,
    width: "100%",
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
  highlightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
  // --- DETAILS TABLE ---
  detailsTable: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
    minHeight: 26,
    alignItems: "center",
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: {
    width: "20%",
    backgroundColor: theme.accentVeryLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 9,
    fontWeight: "bold",
    color: theme.textSecondary,
    borderRightWidth: 1,
    borderRightColor: theme.borderLight,
    textAlign: "center",
  },
  detailValue: {
    width: "30%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: "bold",
    color: theme.accent,
    borderRightWidth: 1,
    borderRightColor: theme.borderLight,
    textAlign: "center",
  },
  detailValueLast: {
    width: "30%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: "bold",
    color: theme.accent,
    borderRightWidth: 0,
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
  // --- UTILS ---
  textWarning: { color: theme.warning, fontWeight: "bold" },
});

const ChitReportPDF = ({ chit, payouts, assignments, collections }) => {
  // 1. Prepare Payout Data
  const payoutData = [];
  if (payouts) {
    const sortedPayouts = [...payouts].sort((a, b) => a.month - b.month);
    for (let i = 0; i < sortedPayouts.length; i += 2) {
      const left = sortedPayouts[i];
      const right = sortedPayouts[i + 1];
      payoutData.push({
        left_s_no: left.month,
        left_month: left.month,
        // <-- UPDATED: planned_amount
        left_amount: left.planned_amount,
        right_s_no: right ? right.month : null,
        right_month: right ? right.month : null,
        // <-- UPDATED: planned_amount
        right_amount: right ? right.planned_amount : null,
      });
    }
  }

  const hideRightBorderIfEmpty = (row) => {
    if (row.right_s_no === null) {
      return { borderRightWidth: 0 };
    }
    return {};
  };

  const payoutColumns = [
    {
      header: "S.No",
      accessor: "left_s_no",
      style: { width: "10%", textAlign: "center" },
    },
    {
      header: "Month",
      style: { width: "15%", textAlign: "center" },
      cell: (row) => calculatePayoutDate(chit.start_date, row.left_month),
    },
    {
      header: "Payout Amount",
      style: { width: "25%", textAlign: "center" },
      cell: (row) => formatCurrency(row.left_amount),
    },
    {
      header: "S.No",
      accessor: "right_s_no",
      style: { width: "10%", textAlign: "center" },
      conditionalStyle: hideRightBorderIfEmpty,
    },
    {
      header: "Month",
      style: { width: "15%", textAlign: "center" },
      conditionalStyle: hideRightBorderIfEmpty,
      cell: (row) =>
        row.right_month
          ? calculatePayoutDate(chit.start_date, row.right_month)
          : "",
    },
    {
      header: "Payout Amount",
      style: { width: "25%", textAlign: "center" },
      cell: (row) =>
        row.right_amount !== null ? formatCurrency(row.right_amount) : "",
    },
  ];

  // 3. Process Assignments
  const processedAssignments = assignments
    ? assignments.map((item, index) => ({
      ...item,
      s_no: index + 1,
    }))
    : [];

  const memberColumns = [
    {
      header: "S.No",
      accessor: "s_no",
      style: { width: "10%", textAlign: "center" },
    },
    {
      header: "Member",
      accessor: "member.full_name",
      style: { width: "30%", textAlign: "center" },
      cell: (row) => row.member.full_name,
    },
    {
      header: "Assignment",
      accessor: "chit_month",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => formatMonthYear(row.chit_month),
    },
    {
      header: "Due",
      accessor: "due_amount",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => (
        <Text style={row.due_amount > 0 ? styles.textError : {}}>
          {formatCurrency(row.due_amount)}
        </Text>
      ),
    },
    {
      header: "Status",
      accessor: "collection_status",
      style: { width: "20%", textAlign: "center" },
      cell: (row) => (
        <Text
          style={
            row.collection_status === "Paid"
              ? styles.textSuccess
              : row.collection_status === "Unpaid"
                ? styles.textError
                : styles.textWarning
          }
        >
          {row.collection_status}
        </Text>
      ),
    },
  ];

  // 4. Process Collections
  const collectionColumns = [
    {
      header: "Date",
      accessor: "collection_date",
      style: { width: "15%", textAlign: "center" },
      cell: (row) => formatFullDate(row.collection_date),
    },
    {
      header: "Member",
      accessor: "member.full_name",
      style: { width: "25%", textAlign: "center" },
      cell: (row) => row.member.full_name,
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
      style: { width: "15%", textAlign: "center" },
    },
    {
      header: "Notes",
      accessor: "notes",
      style: { width: "25%", textAlign: "center" },
      cell: (row) => row.notes || "-",
    },
  ];

  // --- UPDATED HEADER LOGIC ---
  // Append "Chit" if missing, then "Report", preserving case.
  let headerText = chit.name;
  if (!headerText.toLowerCase().endsWith("chit")) {
    headerText += " Chit";
  }
  headerText += " Report";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}></View>
          <View style={styles.headerCenter}>
            <Text style={styles.chitNameHeader}>{headerText}</Text>
          </View>
          <View style={styles.headerRight}></View>
        </View>

        {/* --- OVERVIEW --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.highlightContainer}>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Chit Value</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(chit.chit_value)}
                </Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>Monthly Installment</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(chit.monthly_installment)}
                </Text>
              </View>
            </View>

            <View style={styles.detailsTable}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    chit.status === "Active"
                      ? styles.textSuccess
                      : styles.textError,
                  ]}
                >
                  {chit.status}
                </Text>
                <Text style={styles.detailLabel}>Cycle</Text>
                <Text style={styles.detailValueLast}>{chit.chit_cycle}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(chit.start_date)}
                </Text>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValueLast}>
                  {formatDate(chit.end_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {chit.duration_months} Months
                </Text>
                <Text style={styles.detailLabel}>Members</Text>
                <Text style={styles.detailValueLast}>{chit.size}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Collection Day</Text>
                <Text style={styles.detailValue}>
                  Day {chit.collection_day}
                </Text>
                <Text style={styles.detailLabel}>Payout Day</Text>
                <Text style={styles.detailValueLast}>
                  Day {chit.payout_day}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Symmetric Divider */}
        <View style={styles.divider} />

        {/* --- PAYOUT SCHEDULE --- */}
        <AtomicTable
          title="Payout Schedule"
          columns={payoutColumns}
          data={payoutData}
        />

        <View style={styles.divider} />

        {/* --- MEMBERS --- */}
        <AtomicTable
          title="Members List"
          columns={memberColumns}
          data={processedAssignments}
        />

        <View style={styles.divider} />

        {/* --- COLLECTIONS --- */}
        <AtomicTable
          title="Collection History"
          columns={collectionColumns}
          data={collections}
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

export default ChitReportPDF;
