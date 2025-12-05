
import { GoogleGenAI } from "@google/genai";
import { SimulationResult, LoanInput } from "../types";

export const getAIAdvice = async (input: LoanInput, result: SimulationResult) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as a senior financial planner. Analyze this "Loan Prepayment vs Investment" comparison.

    **Scenario:**
    - Loan: ${input.principal.toLocaleString()} @ ${input.interestRate}% for ${input.tenureYears} Years.
    - Investment Potential: ${input.sipReturnRate}% return.
    - Aggressive Strategy: Pay ${input.extraEmiPerYear} extra EMI/year + ${input.stepUpPercentage}% annual step-up.
    - *Comparison Rule:* In the Aggressive strategy, once the loan is closed, the entire monthly budget is diverted to SIP until year ${input.tenureYears}.

    **Results:**
    1. **Strategy A (Don't Prepay, Invest Surplus):**
       - Final Net Wealth: ${Math.round(result.summary.finalWealthRegular).toLocaleString()}
       - Loan Interest Paid: ${Math.round(result.summary.regularTotalInterest).toLocaleString()}
    
    2. **Strategy B (Prepay Aggressively, Then Invest):**
       - Final Net Wealth: ${Math.round(result.summary.finalWealthAggressive).toLocaleString()}
       - Loan Interest Paid: ${Math.round(result.summary.aggressiveTotalInterest).toLocaleString()}
       - Loan Free in: ${(result.summary.aggressiveTenureMonths/12).toFixed(1)} Years.

    **Verdict:**
    - Winner: **${result.summary.winningStrategy === 'Prepay' ? "Aggressive Prepayment" : "Regular Payment + SIP"}**
    - Wealth Gap: ${Math.round(result.summary.netWealthDifference).toLocaleString()}

    **Task:**
    Provide a recommendation (under 150 words).
    1. Acknowledge the winner mathematically.
    2. Mention the intangible value of being debt-free early (Strategy B clears loan in ${(result.summary.aggressiveTenureMonths/12).toFixed(1)} years).
    3. Advise based on risk (Market returns are variable, loan interest is fixed saved cost).
    
    Format with markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI advice at this moment.";
  }
};
