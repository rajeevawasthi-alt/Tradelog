# TradeLog Enhancement Plan

This document outlines the roadmap for adding advanced features to the TradeLog application to make it a professional-grade trading journal.

## Phase 1: Customization & UX Improvements (Short-term)
*   [ ] **Dynamic Settings**: Replace hardcoded `MARKETS`, `SETUPS`, and `INDICATORS` constants with user-definable lists stored in LocalStorage/Database.
*   [ ] **Theme Toggle**: Implement a Light/Dark mode switcher using Tailwind's `dark` class.
*   [ ] **Screenshot Attachment**: Allow users to attach chart screenshots (Base64 or Cloud Storage) to their trade logs.
*   [ ] **Rich Text Notes**: Upgrade the notes `textarea` to a simple markdown or rich-text editor.

## Phase 2: Advanced Analytics & Visualization
*   [ ] **Profit/Loss Heatmap**: A GitHub-style contribution calendar showing daily P&L.
*   [ ] **Performance by Time**: A bar chart showing win rate and P&L filtered by trading hours (e.g., Morning vs Afternoon session).
*   [ ] **Equity Curve & Drawdown**: Advanced charts using Recharts to track account growth and risk phases.
*   [ ] **Expectancy Score**: Automatically calculate the "Trading Expectancy" based on R:R and Win Rate.

## Phase 3: Trading Tools & Utilities
*   [ ] **Position Sizing Calculator**: A tool where users input their Risk Amount and Stop Loss to get the exact Lot Size for different instruments.
*   [ ] **Pre-Trade Checklist**: A mandatory popup before logging a trade to ensure it meets strategy criteria.
*   [ ] **Economic Calendar**: Integration with a free API (like FinancialModelingPrep) to show daily economic events.

## Phase 4: Data Integration & Backend
*   [ ] **Cloud Sync (Firebase/Supabase)**: Move from `localStorage` to a real backend for cross-device sync and secure authentication.
*   [ ] **CSV/Excel Import**: Bulk upload trades from popular brokers like Zerodha, Upstox, or MetaTrader.
*   [ ] **PDF Report Export**: Generate a monthly performance summary in PDF format.

## Phase 5: AI & Gamification
*   [ ] **AI Trade Insights**: Integrate Gemini API to analyze trade notes and identify psychological patterns or recurring mistakes.
*   [ ] **Achievement System**: Unlock badges for streaks (e.g., "5-Day Green Streak", "Disciplined Trader").
*   [ ] **Social Sharing Cards**: Generate beautiful "Trade Result" images for sharing on Twitter/Telegram.

---

### Priority Suggestion
I recommend starting with **Phase 1 (Dynamic Settings)** and **Phase 2 (Heatmap Calendar)** as they provide the most immediate value to the user experience.
