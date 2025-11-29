// frontend/src/components/reports/components/Table.jsx

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const theme = {
  textPrimary: "#111827",
  textSecondary: "#374151",
  bgHeader: "#3B82F6",
  bgZebra: "#EFF6FF",
  borderLight: "#E5E7EB",
  white: "#FFFFFF",
};

// Radius for the table corners
const BORDER_RADIUS = 8;

const styles = StyleSheet.create({
  tableWrapper: {
    marginBottom: 24,
    width: "100%",
  },
  tableContainer: {
    width: "100%",
  },

  // --- Section Title ---
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: theme.textPrimary,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderLeftWidth: 4,
    borderLeftColor: theme.bgHeader,
    paddingLeft: 10,
    backgroundColor: "#F9FAFB",
  },

  // --- Header ---
  headerRow: {
    flexDirection: "row",
    backgroundColor: theme.bgHeader,
    minHeight: 28,
    alignItems: "center",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.bgHeader,
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
  },
  headerCell: {
    padding: 8,
    fontSize: 10,
    fontWeight: "bold",
    color: theme.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: theme.white,
  },
  headerCellLast: {
    borderRightWidth: 0,
  },

  // --- Rows ---
  row: {
    flexDirection: "row",
    minHeight: 24,
    alignItems: "center",
    backgroundColor: theme.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.borderLight,
  },
  rowEven: {
    backgroundColor: theme.bgZebra,
  },
  rowLast: {
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
  },

  cell: {
    padding: 8,
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: theme.borderLight,
  },
  cellLast: {
    borderRightWidth: 0,
  },

  // --- Empty State ---
  emptyState: {
    textAlign: "center",
    padding: 16,
    color: theme.textSecondary,
    backgroundColor: theme.white,
    fontSize: 10,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderTopWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
  },
});

export const TableHeader = ({ columns }) => (
  <View style={styles.headerRow}>
    {columns.map((col, index) => (
      <Text
        key={`h-${index}`}
        style={[
          styles.headerCell,
          col.style, // Now safely applies static style (width)
          index === columns.length - 1 ? styles.headerCellLast : {},
        ]}
      >
        {col.header}
      </Text>
    ))}
  </View>
);

export const TableRow = ({ columns, row, rowIndex, isLast }) => (
  <View
    style={[
      styles.row,
      rowIndex % 2 !== 0 ? styles.rowEven : {},
      isLast ? styles.rowLast : {},
    ]}
    wrap={false}
  >
    {columns.map((col, colIndex) => {
      // MODIFICATION: Separate static style from dynamic conditional style
      // 'col.style' is for layout (width)
      // 'col.conditionalStyle' is for logic (hiding borders, colors based on values)
      const dynamicStyle = col.conditionalStyle
        ? col.conditionalStyle(row)
        : {};

      return (
        <Text
          key={`c-${colIndex}`}
          wrap={false}
          style={[
            styles.cell,
            col.style, // Apply static layout
            dynamicStyle, // Apply dynamic overrides
            colIndex === columns.length - 1 ? styles.cellLast : {},
          ]}
        >
          {col.cell
            ? col.cell(row)
            : row[col.accessor] !== undefined && row[col.accessor] !== null
            ? row[col.accessor].toString()
            : ""}
        </Text>
      );
    })}
  </View>
);

export const AtomicTable = ({ columns, data, style, title }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.tableWrapper, style]} wrap={false}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.tableContainer}>
          <TableHeader columns={columns} />
          <Text style={styles.emptyState}>No records found.</Text>
        </View>
      </View>
    );
  }

  const firstRow = data[0];
  const restRows = data.slice(1);
  const layoutState = { anchorPage: -1 };

  return (
    <View style={[styles.tableWrapper, style]}>
      <View wrap={false}>
        <View
          style={{ height: 0, width: 0 }}
          render={({ pageNumber }) => {
            layoutState.anchorPage = pageNumber;
            return null;
          }}
        />
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View>
          <TableHeader columns={columns} />
          <TableRow
            columns={columns}
            row={firstRow}
            rowIndex={0}
            isLast={restRows.length === 0}
          />
        </View>
      </View>

      {restRows.length > 0 && (
        <View>
          <View
            fixed
            render={({ pageNumber }) => {
              if (layoutState.anchorPage === -1) return null;
              if (pageNumber > layoutState.anchorPage) {
                return <TableHeader columns={columns} />;
              }
              return null;
            }}
          />
          {restRows.map((row, index) => (
            <TableRow
              key={`r-${index + 1}`}
              columns={columns}
              row={row}
              rowIndex={index + 1}
              isLast={index === restRows.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default AtomicTable;
