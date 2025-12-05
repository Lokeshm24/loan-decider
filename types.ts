
export interface LoanInput {
  principal: number;
  interestRate: number;
  tenureYears: number;
  sipReturnRate: number;
  extraEmiPerYear: number; // Number of extra EMIs per year (e.g., 1)
  stepUpPercentage: number; // Annual percentage increase in EMI (e.g., 5%)
}

export interface MonthlyData {
  month: number;
  year: number;
  loanBalanceRegular: number;
  loanBalanceAggressive: number;
  sipValueRegular: number; // Wealth in Strategy A (Invest Surplus)
  sipValueAggressive: number; // Wealth in Strategy B (Prepay then Invest)
  cumulativeInterestRegular: number;
  cumulativeInterestAggressive: number;
  totalInvestedRegular: number;
  totalInvestedAggressive: number;
}

export interface SimulationResult {
  monthlyData: MonthlyData[];
  summary: {
    regularTotalInterest: number;
    aggressiveTotalInterest: number;
    regularTenureMonths: number;
    aggressiveTenureMonths: number;
    interestSaved: number;
    
    // New Wealth Metrics
    finalWealthRegular: number;
    finalWealthAggressive: number;
    totalAmountInvestedRegular: number;
    totalAmountInvestedAggressive: number;
    
    // Decision Metrics
    winningStrategy: 'Prepay' | 'Invest';
    netWealthDifference: number; // Absolute difference
  };
}
