import { LoanInput, MonthlyData, SimulationResult } from '../types';

export const calculateScenario = (input: LoanInput): SimulationResult => {
  const { principal, interestRate, tenureYears, sipReturnRate, extraEmiPerYear, stepUpPercentage } = input;
  
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const sipMonthlyRate = sipReturnRate / 12 / 100;
  
  // Base EMI (Fixed obligation)
  const baseEmi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

  // State Variables
  let balanceRegular = principal;
  let balanceAggressive = principal;
  
  let sipValueRegular = 0;
  let sipValueAggressive = 0;
  
  let totalInvestedRegular = 0;
  let totalInvestedAggressive = 0;
  
  let totalInterestRegular = 0;
  let totalInterestAggressive = 0;
  
  let aggressiveClosedMonth = totalMonths;
  let regularClosedMonth = totalMonths;
  let isAggressiveClosed = false;
  let isRegularClosed = false;

  const data: MonthlyData[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const year = Math.ceil(month / 12);
    
    // --- 1. Determine Total Monthly Budget ---
    // The user's capacity to pay is defined by the Aggressive Strategy inputs.
    // Budget = Base EMI * StepUpFactor + Extra Payments (if applicable month)
    
    // Step Up Logic: Increase EMI capacity by X% every year
    let currentMonthlyBudget = baseEmi;
    if (year > 1) {
       const increaseFactor = 1 + (stepUpPercentage / 100);
       currentMonthlyBudget = baseEmi * Math.pow(increaseFactor, year - 1);
    }
    
    // Extra EMI Logic (Lump sum capability)
    let extraPaymentBudget = 0;
    if (extraEmiPerYear > 0 && month % 12 === 0) {
        extraPaymentBudget = baseEmi * extraEmiPerYear;
    }
    
    const totalBudgetThisMonth = currentMonthlyBudget + extraPaymentBudget;

    // --- 2. Strategy A: Regular Loan + Invest Surplus ---
    // Rule: Pay Base EMI to Loan. Invest (TotalBudget - BaseEMI) to SIP.
    
    // A. Loan Part
    if (!isRegularClosed) {
      const interest = balanceRegular * monthlyRate;
      let principalComp = baseEmi - interest;
      
      if (balanceRegular - principalComp < 0) {
        principalComp = balanceRegular;
        isRegularClosed = true;
        regularClosedMonth = month;
      }
      
      totalInterestRegular += interest;
      balanceRegular -= principalComp;
    }

    // B. Investment Part (Surplus)
    // Surplus is whatever budget is left after paying the Base EMI.
    // If loan is closed, NO EMI is paid, so entire budget is surplus.
    let surplusRegular = totalBudgetThisMonth - (isRegularClosed ? 0 : baseEmi);
    
    // If loan just closed this month, we might have paid a partial EMI. 
    // For simplicity, we assume standard EMI or 0. Precision loss is minimal.
    
    if (surplusRegular > 0) {
        sipValueRegular = (sipValueRegular + surplusRegular) * (1 + sipMonthlyRate);
        totalInvestedRegular += surplusRegular;
    } else {
        sipValueRegular = sipValueRegular * (1 + sipMonthlyRate);
    }


    // --- 3. Strategy B: Aggressive Payoff + Post-Loan SIP ---
    // Rule: Pay TotalBudget to Loan. If Loan is 0, Invest TotalBudget to SIP.

    let amountForLoanAggressive = 0;
    let amountForSipAggressive = 0;

    if (!isAggressiveClosed) {
        // All money goes to loan
        amountForLoanAggressive = totalBudgetThisMonth;
        
        const interest = balanceAggressive * monthlyRate;
        let principalComp = amountForLoanAggressive - interest;
        
        if (balanceAggressive - principalComp < 0) {
            // Loan closes this month!
            // Pay only what is needed
            const actualNeeded = balanceAggressive + interest;
            principalComp = balanceAggressive;
            
            // The remainder of the budget goes to SIP *immediately* this month? 
            // Or next month? Let's put remainder into SIP this month.
            amountForSipAggressive = totalBudgetThisMonth - actualNeeded;
            
            isAggressiveClosed = true;
            aggressiveClosedMonth = month;
        }
        
        totalInterestAggressive += interest;
        balanceAggressive -= principalComp;
    } else {
        // Loan is closed. Entire budget goes to SIP.
        amountForSipAggressive = totalBudgetThisMonth;
    }

    // Apply SIP growth
    if (amountForSipAggressive > 0) {
        sipValueAggressive = (sipValueAggressive + amountForSipAggressive) * (1 + sipMonthlyRate);
        totalInvestedAggressive += amountForSipAggressive;
    } else {
        sipValueAggressive = sipValueAggressive * (1 + sipMonthlyRate);
    }

    data.push({
      month,
      year: Math.ceil(month / 12),
      loanBalanceRegular: Math.max(0, balanceRegular),
      loanBalanceAggressive: Math.max(0, balanceAggressive),
      sipValueRegular,
      sipValueAggressive,
      cumulativeInterestRegular: totalInterestRegular,
      cumulativeInterestAggressive: totalInterestAggressive,
      totalInvestedRegular,
      totalInvestedAggressive
    });
  }

  // --- 4. Summary & Verdict ---
  
  // Note: Final Wealth = Investment Value - Outstanding Loan (if any)
  // At end of tenure, loan should be 0 in both cases usually, but regular might have small variations if tenure wasn't exact.
  // We assume comparison at end of input Tenure.
  
  const finalWealthRegular = sipValueRegular - Math.max(0, balanceRegular);
  const finalWealthAggressive = sipValueAggressive - Math.max(0, balanceAggressive);
  
  const netWealthDifference = Math.abs(finalWealthAggressive - finalWealthRegular);
  const winningStrategy = finalWealthAggressive > finalWealthRegular ? 'Prepay' : 'Invest';

  return {
    monthlyData: data,
    summary: {
      regularTotalInterest: totalInterestRegular,
      aggressiveTotalInterest: totalInterestAggressive,
      regularTenureMonths: regularClosedMonth,
      aggressiveTenureMonths: aggressiveClosedMonth,
      interestSaved: totalInterestRegular - totalInterestAggressive,
      
      finalWealthRegular,
      finalWealthAggressive,
      totalAmountInvestedRegular: totalInvestedRegular,
      totalAmountInvestedAggressive: totalInvestedAggressive,
      
      winningStrategy,
      netWealthDifference
    }
  };
};