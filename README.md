# 💰 Loan vs SIP Strategizer

A smart financial calculator that helps you make data-driven decisions about whether to **prepay your home loan aggressively** or **invest surplus in SIPs** — and shows you which strategy builds more wealth over time.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)

## 🎯 The Problem

When you have extra money beyond your regular EMI, you face a classic dilemma:

- **Option A**: Continue paying regular EMIs and invest the surplus in mutual funds (SIP)
- **Option B**: Use all extra money to close the loan faster, then invest everything post-closure

This tool simulates both strategies month-by-month and tells you **which one makes you wealthier** at the end of your loan tenure.

## ✨ Features

- **Real-time Comparison** — Instantly see results as you adjust inputs
- **Visual ROI Charts** — Pie charts showing principal invested vs wealth gained
- **Detailed Breakdown** — Toggle between yearly and monthly views
- **Interest Savings Calculator** — See how much interest you save by prepaying
- **Time Savings** — Calculate how many years earlier you become debt-free
- **Clear Recommendation** — Get an unambiguous verdict on the better strategy

## 📊 How It Works

### Strategy A: Invest Surplus
Pay your regular EMI to the loan. Invest everything extra (stepped-up capacity + annual bonuses) into SIP.

### Strategy B: Prepay First
Throw all available money at the loan until it's closed. After loan closure, invest the entire budget (which is now 100% surplus) into SIP.

The calculator simulates both approaches month-by-month, accounting for:
- Compound interest on the loan
- SIP returns with monthly compounding
- Step-up increases in your payment capacity
- Extra EMI payments (like annual bonuses)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/loan-vs-sip-strategizer.git

# Navigate to the project
cd loan-vs-sip-strategizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠️ Tech Stack

- **React 19** — UI library
- **TypeScript** — Type safety
- **Vite** — Fast build tool
- **Recharts** — Data visualization
- **Tailwind CSS** — Styling

## 📖 Usage

1. **Enter Loan Details**
   - Loan Amount (Principal)
   - Interest Rate (Annual %)
   - Tenure (Years)

2. **Configure Your Strategy**
   - Expected SIP Returns (%)
   - Extra EMIs per Year (e.g., 1 for annual bonus)
   - Annual Step-up (%) — Your yearly increase in payment capacity

3. **Analyze Results**
   - View the recommendation banner
   - Compare ROI charts for both strategies
   - Check interest saved and time saved
   - Explore the detailed breakdown table

## 💡 Example Scenario

| Input | Value |
|-------|-------|
| Loan Amount | ₹50,00,000 |
| Interest Rate | 8.5% |
| Tenure | 20 years |
| SIP Returns | 12% |
| Extra EMIs/Year | 1 |
| Step-up | 5% |

The calculator will show you:
- Which strategy yields more wealth after 20 years
- How much interest you save by prepaying
- How many years earlier you become debt-free
- Month-by-month breakdown of both strategies

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from custom SVG components

---

<p align="center">
  Made with ❤️ for better financial decisions
</p>
