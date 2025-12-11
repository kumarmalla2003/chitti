// frontend/src/components/ui/Table.jsx

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const Table = ({ columns, data, variant = "primary", onRowClick }) => {
  const headerClass =
    variant === "secondary"
      ? "bg-background-primary"
      : "bg-background-secondary";
  const rowClass =
    variant === "secondary"
      ? "even:bg-background-primary"
      : "even:bg-background-secondary";

  const rowHoverClass = onRowClick
    ? "hover:text-accent hover:shadow-[inset_0_0_0_1px_var(--color-accent)] cursor-pointer"
    : "";

  return (
    <div className="overflow-x-auto border border-border shadow-card rounded-lg">
      {/* UPDATED: text-small */}
      <table className="w-full text-small text-text-secondary">
        <thead
          className={`text-small text-text-primary uppercase font-heading ${headerClass}`}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor || col.header}
                scope="col"
                className={`px-control py-4 font-semibold border-b-2 border-border whitespace-nowrap ${
                  col.headerClassName || col.className || ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`group ${rowClass} transition-all duration-normal ease-smooth ${rowHoverClass}`}
            >
              {columns.map((col) => (
                <td
                  key={col.accessor || col.header}
                  className={`px-control py-4 font-medium whitespace-nowrap ${
                    col.cellClassName || col.className || ""
                  }`}
                >
                  {col.cell
                    ? col.cell(row, rowIndex)
                    : getNestedValue(row, col.accessor)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
