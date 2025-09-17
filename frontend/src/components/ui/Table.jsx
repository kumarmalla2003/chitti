// frontend/src/components/ui/Table.jsx

const Table = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto border border-border shadow-md rounded-lg">
      <table className="w-full text-sm text-text-secondary">
        <thead className="text-sm text-text-primary uppercase bg-background-secondary font-heading">
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor}
                scope="col"
                className={`px-6 py-4 font-semibold border-b-2 border-border ${
                  col.className || ""
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
              className="group even:bg-background-secondary hover:text-accent hover:shadow-[inset_0_0_0_1px_var(--color-accent)] transition-all duration-200 ease-in-out cursor-pointer"
            >
              {columns.map((col) => (
                <td
                  key={col.accessor}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    col.className || ""
                  }`}
                >
                  {col.cell ? col.cell(row, rowIndex) : row[col.accessor]}
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
