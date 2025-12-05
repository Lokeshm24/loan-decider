import React, { useState, useEffect, useMemo, useRef } from 'react';
import { calculateScenario } from './services/calculator';
import { LoanInput, SimulationResult, MonthlyData } from './types';
import { Calculator, TrendingUp, PiggyBank } from './components/Icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- UI Components ---

const Card = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>{children}</div>
);

// Improved Input Field with visual clearing capability
const InputField = ({ label, value, onChange, suffix, min = 0 }: { 
  label: string, 
  value: number, 
  onChange: (val: number) => void, 
  suffix?: string, 
  min?: number 
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    // Only sync from parent if the number value is different from what we have parsed locally
    // This prevents cursor jumping or fighting user input like "0."
    if (Number(displayValue) !== value && displayValue !== '' && displayValue !== '.') {
       setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Allow empty string to clear input visually
    if (rawVal === '') {
      setDisplayValue('');
      onChange(0); // Treat empty as 0 for calculation
      return;
    }

    // Regex to allow positive decimal numbers only
    if (!/^\d*\.?\d*$/.test(rawVal)) {
      return;
    }

    setDisplayValue(rawVal);
    
    const numVal = parseFloat(rawVal);
    if (!isNaN(numVal) && numVal >= min) {
      onChange(numVal);
    }
  };

  const handleBlur = () => {
    if (displayValue === '' || displayValue === '.') {
        setDisplayValue(value.toString());
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
        />
        {suffix && <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
};

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString()}`;
};

const ToggleSwitch = ({ active, onChange }: { active: 'yearly' | 'monthly', onChange: (val: 'yearly' | 'monthly') => void }) => (
  <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
    <button
      onClick={() => onChange('yearly')}
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
        active === 'yearly' 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-white'
      }`}
    >
      Yearly
    </button>
    <button
      onClick={() => onChange('monthly')}
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
        active === 'monthly' 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-white'
      }`}
    >
      Monthly
    </button>
  </div>
);

const App = () => {
  // State
  const [input, setInput] = useState<LoanInput>({
    principal: 5000000,
    interestRate: 8.5,
    tenureYears: 20,
    sipReturnRate: 12,
    extraEmiPerYear: 1,
    stepUpPercentage: 5
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [tableView, setTableView] = useState<'yearly' | 'monthly'>('yearly');

  // Recalculate on input change
  useEffect(() => {
    const data = calculateScenario(input);
    setResult(data);
  }, [input]);

  const yearlyBreakdown = useMemo(() => {
    if (!result) return [];
    const grouped = result.monthlyData.reduce((acc, curr) => {
      acc[curr.year] = curr;
      return acc;
    }, {} as Record<number, MonthlyData>);
    return Object.values(grouped).sort((a: MonthlyData, b: MonthlyData) => a.year - b.year);
  }, [result]);

  const tableData = tableView === 'yearly' ? yearlyBreakdown : result?.monthlyData || [];

  if (!result) return <div>Loading...</div>;

  const emi = (input.principal * (input.interestRate/1200) * Math.pow(1 + input.interestRate/1200, input.tenureYears*12)) / (Math.pow(1 + input.interestRate/1200, input.tenureYears*12) - 1);

  // Pie Chart Data Logic
  const calculatePieData = (invested: number, finalValue: number, themeColor: string) => {
    const gained = Math.max(0, finalValue - invested);
    const roi = invested > 0 ? ((gained / invested) * 100).toFixed(0) : "0";
    
    return {
      data: [
        { name: 'Principal Invested', value: invested, color: '#475569' }, // slate-600 for base
        { name: 'Wealth Gained', value: gained, color: themeColor }
      ],
      roi
    };
  };

  const chartA = calculatePieData(result.summary.totalAmountInvestedRegular, result.summary.finalWealthRegular, '#3b82f6'); // Blue
  const chartB = calculatePieData(result.summary.totalAmountInvestedAggressive, result.summary.finalWealthAggressive, '#10b981'); // Emerald

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
              <Calculator className="h-8 w-8 text-blue-500" />
              Loan vs SIP Strategizer
            </h1>
            <p className="text-muted-foreground mt-2">
              Compare "Invest Surplus" vs "Prepay Loan then Invest" strategies.
            </p>
          </div>
          <div className="bg-secondary/50 px-4 py-2 rounded-lg border border-border">
             <span className="text-sm text-muted-foreground">Base EMI: </span>
             <span className="text-lg font-bold text-primary">{Math.round(emi).toLocaleString()} / month</span>
          </div>
        </div>

        {/* Verdict Banner */}
        <div className={`rounded-lg p-6 border ${result.summary.winningStrategy === 'Prepay' ? 'bg-emerald-950/30 border-emerald-900' : 'bg-blue-950/30 border-blue-900'} relative overflow-hidden`}>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${result.summary.winningStrategy === 'Prepay' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        Recommendation: {result.summary.winningStrategy === 'Prepay' ? "Prepay Aggressively" : "Don't Prepay, Invest Surplus"}
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Strategy <span className="font-bold text-white">{result.summary.winningStrategy === 'Prepay' ? "B" : "A"}</span> results in 
                        <span className="font-bold text-white mx-1">{formatCurrency(result.summary.netWealthDifference)}</span> 
                        more wealth after {input.tenureYears} years.
                    </p>
                </div>
                <div className="flex gap-8 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Invest Surplus Wealth</p>
                        <p className="text-xl font-mono font-bold text-blue-400">{formatCurrency(result.summary.finalWealthRegular)}</p>
                    </div>
                    <div className="w-px bg-gray-700 h-10"></div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Prepay Strategy Wealth</p>
                        <p className="text-xl font-mono font-bold text-emerald-400">{formatCurrency(result.summary.finalWealthAggressive)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          
          {/* Left Column: Inputs - Sticky */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start h-fit">
            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-500" /> 
                Loan Configuration
              </h2>
              
              <div className="grid gap-4">
                <InputField 
                  label="Loan Amount" 
                  value={input.principal} 
                  onChange={(v) => setInput({ ...input, principal: v })} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField 
                    label="Interest Rate" 
                    value={input.interestRate} 
                    onChange={(v) => setInput({ ...input, interestRate: v })} 
                    suffix="%" 
                  />
                  <InputField 
                    label="Tenure" 
                    value={input.tenureYears} 
                    onChange={(v) => setInput({ ...input, tenureYears: v })} 
                    suffix="Yrs" 
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-purple-500" /> 
                  Budget & Strategy
                </h2>
                <div className="grid gap-4">
                  <InputField 
                    label="SIP Expected Return" 
                    value={input.sipReturnRate} 
                    onChange={(v) => setInput({ ...input, sipReturnRate: v })} 
                    suffix="%" 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Extra EMIs / Year" 
                      value={input.extraEmiPerYear} 
                      onChange={(v) => setInput({ ...input, extraEmiPerYear: v })} 
                    />
                     <InputField 
                      label="Annual Step-up" 
                      value={input.stepUpPercentage} 
                      onChange={(v) => setInput({ ...input, stepUpPercentage: v })} 
                      suffix="%" 
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-4 space-y-2 bg-secondary/30 p-3 rounded">
                  <p><strong>Strategy A:</strong> Pay Loan normally. Invest all extra money into SIP.</p>
                  <p><strong>Strategy B:</strong> Use all extra money to close Loan ASAP. Once closed, invest EVERYTHING into SIP.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ROI Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strategy A Chart */}
              <Card className="p-6">
                 <div className="text-center mb-4">
                    <h3 className="font-semibold text-blue-400">Strategy A: Invest Surplus</h3>
                    <p className="text-xs text-muted-foreground">Regular Loan + SIP</p>
                 </div>
                 <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartA.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartA.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                           formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                        <p className="text-xs text-gray-400">ROI</p>
                        <p className="text-2xl font-bold text-white">{chartA.roi}%</p>
                    </div>
                 </div>
                 <div className="mt-2 text-center">
                    <p className="text-sm text-gray-400">Total Value: <span className="text-white font-mono">{formatCurrency(result.summary.finalWealthRegular)}</span></p>
                 </div>
              </Card>

              {/* Strategy B Chart */}
              <Card className="p-6">
                 <div className="text-center mb-4">
                    <h3 className="font-semibold text-emerald-400">Strategy B: Prepay First</h3>
                    <p className="text-xs text-muted-foreground">Aggressive Repayment + Post-Loan SIP</p>
                 </div>
                 <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartB.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartB.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                           formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                        <p className="text-xs text-gray-400">ROI</p>
                        <p className="text-2xl font-bold text-white">{chartB.roi}%</p>
                    </div>
                 </div>
                 <div className="mt-2 text-center">
                    <p className="text-sm text-gray-400">Total Value: <span className="text-white font-mono">{formatCurrency(result.summary.finalWealthAggressive)}</span></p>
                 </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Interest Comparison */}
               <Card className="p-6 bg-red-950/10 border-red-900/30">
                  <h4 className="text-sm font-medium text-red-400 mb-4 uppercase tracking-wider">Interest Paid</h4>
                  <div className="space-y-4">
                      <div className="flex justify-between items-end">
                          <span className="text-sm text-gray-400">Regular Loan</span>
                          <span className="text-lg font-mono">{formatCurrency(result.summary.regularTotalInterest)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                          <span className="text-sm text-gray-400">Aggressive Prepay</span>
                          <span className="text-lg font-mono text-emerald-400">{formatCurrency(result.summary.aggressiveTotalInterest)}</span>
                      </div>
                      <div className="pt-2 border-t border-red-900/30 flex justify-between items-end">
                          <span className="text-sm text-gray-300">Saved by Prepaying</span>
                          <span className="text-xl font-bold text-white">{formatCurrency(result.summary.interestSaved)}</span>
                      </div>
                  </div>
               </Card>

               {/* Time Comparison */}
               <Card className="p-6 bg-blue-950/10 border-blue-900/30">
                  <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">Freedom From Debt</h4>
                  <div className="space-y-4">
                      <div className="flex justify-between items-end">
                          <span className="text-sm text-gray-400">Regular Tenure</span>
                          <span className="text-lg font-mono">{input.tenureYears} Years</span>
                      </div>
                      <div className="flex justify-between items-end">
                          <span className="text-sm text-gray-400">Aggressive Tenure</span>
                          <span className="text-lg font-mono text-emerald-400">{(result.summary.aggressiveTenureMonths / 12).toFixed(1)} Years</span>
                      </div>
                      <div className="pt-2 border-t border-blue-900/30 flex justify-between items-end">
                          <span className="text-sm text-gray-300">Life reclaimed</span>
                          <span className="text-xl font-bold text-white">{((input.tenureYears * 12 - result.summary.aggressiveTenureMonths) / 12).toFixed(1)} Years</span>
                      </div>
                  </div>
               </Card>
            </div>

            {/* Detailed Table */}
            <Card className="p-0 overflow-hidden border-border flex flex-col max-h-[600px]">
              <div className="p-6 border-b border-border bg-card flex justify-between items-center sticky top-0 z-10">
                 <h3 className="text-lg font-medium flex items-center gap-2">
                    Comparision Breakdown
                 </h3>
                 <ToggleSwitch active={tableView} onChange={setTableView} />
              </div>
              <div className="overflow-auto custom-scrollbar flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium sticky top-0 backdrop-blur-sm z-10 shadow-sm">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap bg-card/95">Time</th>
                      <th className="py-3 px-4 text-right text-red-300/70 whitespace-nowrap bg-card/95">Loan Bal (Prepay)</th>
                      <th className="py-3 px-4 text-right text-blue-300 whitespace-nowrap bg-card/95">Wealth (A: Invest)</th>
                      <th className="py-3 px-4 text-right text-emerald-300 whitespace-nowrap bg-card/95">Wealth (B: Prepay)</th>
                      <th className="py-3 px-4 text-right text-gray-400 hidden sm:table-cell whitespace-nowrap bg-card/95">Invested (A)</th>
                      <th className="py-3 px-4 text-right text-gray-400 hidden sm:table-cell whitespace-nowrap bg-card/95">Invested (B)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tableData.map((row) => (
                      <tr key={`${row.year}-${row.month}`} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-400">
                          {tableView === 'yearly' ? `Year ${row.year}` : `Y${row.year} M${(row.month - 1) % 12 + 1}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-red-300/70">
                           {row.loanBalanceAggressive > 1000 ? formatCurrency(row.loanBalanceAggressive) : <span className="text-emerald-500 font-bold text-xs bg-emerald-950/50 px-2 py-1 rounded">CLOSED</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-400 font-medium">{formatCurrency(row.sipValueRegular)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium">
                            {row.sipValueAggressive > 0 ? formatCurrency(row.sipValueAggressive) : <span className="text-gray-600">-</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-500 hidden sm:table-cell">{formatCurrency(row.totalInvestedRegular)}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-500 hidden sm:table-cell">{formatCurrency(row.totalInvestedAggressive)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;