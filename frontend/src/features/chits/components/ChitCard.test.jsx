import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ChitCard from "./ChitCard";

describe("ChitCard", () => {
  const mockChit = {
    id: 1,
    name: "Test Chit",
    status: "Active",
    chit_value: 100000,
    monthly_installment: 5000,
    start_date: "2023-01-01",
    end_date: "2024-08-01",
    chit_cycle: 1,
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPrint: vi.fn(),
  };

  it("renders chit details correctly", () => {
    render(
      <BrowserRouter>
        <ChitCard chit={mockChit} {...mockHandlers} />
      </BrowserRouter>
    );

    expect(screen.getByText("Test Chit")).toBeInTheDocument();
    expect(screen.getByText("1,00,000")).toBeInTheDocument();
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
  });
});
