export interface DataItem {
  id: string;
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
}

export type ChartType = 
  | 'pie' 
  | 'donut' 
  | 'bar' 
  | 'horizontalBar' 
  | 'stackedBar' 
  | 'line' 
  | 'area' 
  | 'radar' 
  | 'scatter';

export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3';
export type FontFamily = 'Plus Jakarta Sans' | 'Inter' | 'JetBrains Mono' | 'Outfit' | 'Playfair Display';
export type CanvasThemeMode = 'dark' | 'pure-dark' | 'spotify' | 'slate' | 'light' | 'paper';

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'cyber',
    name: 'Neon Cyber',
    colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#3b82f6', '#f43f5e']
  },
  {
    id: 'spotify',
    name: 'Spotify Wrapped',
    colors: ['#1ed760', '#ff007a', '#7000ff', '#00e5ff', '#ffe600', '#ff5500', '#38bdf8', '#a855f7']
  },
  {
    id: 'apple',
    name: 'Apple Keynote',
    colors: ['#0071e3', '#5e5ce6', '#30b0c7', '#34c759', '#ff9f0a', '#ff375f', '#bf5af2', '#64d2ff']
  },
  {
    id: 'vercel',
    name: 'Vercel Slate',
    colors: ['#3b82f6', '#06b6d4', '#10b981', '#6366f1', '#a855f7', '#f43f5e', '#38bdf8', '#fbbf24']
  },
  {
    id: 'finance',
    name: 'Stripe Finance',
    colors: ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb', '#0891b2']
  },
  {
    id: 'bloomberg',
    name: 'Terminal Amber',
    colors: ['#ff9900', '#00ff66', '#38bdf8', '#ff4d4d', '#facc15', '#a855f7', '#fb923c', '#2dd4bf']
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: ['#f97316', '#fb7185', '#a855f7', '#6366f1', '#06b6d4', '#eab308', '#ec4899', '#10b981']
  },
  {
    id: 'pastel',
    name: 'Minimal Pastel',
    colors: ['#93c5fd', '#fca5a5', '#86efac', '#fde047', '#c084fc', '#6ee7b7', '#fdba74', '#f472b6']
  },
  {
    id: 'emerald',
    name: 'Emerald Luxe',
    colors: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7', '#a7f3d0', '#064e3b', '#022c22']
  },
  {
    id: 'notion',
    name: 'Notion Warm',
    colors: ['#2f3437', '#9065b0', '#d44c47', '#2e7bcf', '#0f7b6c', '#c27a27', '#696458', '#454b54']
  },
  {
    id: 'crypto',
    name: 'Crypto Gold',
    colors: ['#f59e0b', '#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899']
  },
  {
    id: 'monochrome',
    name: 'Mono Dark',
    colors: ['#f8fafc', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a']
  }
];

export const SAMPLE_DATASETS = {
  // Viral & Meme Relatable Presets
  memeCoding: {
    category: 'viral',
    title: 'Where My 8-Hour Workday Actually Goes',
    subtitle: 'Source: Developer Reality Audit',
    chartType: 'pie' as ChartType,
    data: [
      { id: '1', name: 'Thinking about how to code', value: 38 },
      { id: '2', name: 'Reading docs & StackOverflow', value: 24 },
      { id: '3', name: 'Meetings that could be a DM', value: 18 },
      { id: '4', name: 'Writing actual code', value: 12 },
      { id: '5', name: 'Fighting git merge conflicts', value: 8 }
    ]
  },
  memeSalary: {
    category: 'viral',
    title: 'Where My Monthly Salary Actually Vanishes',
    subtitle: 'Bank Account Forensic Breakdown',
    chartType: 'donut' as ChartType,
    data: [
      { id: '1', name: 'Rent & Utilities', value: 45 },
      { id: '2', name: 'Coffee & Food Delivery', value: 25 },
      { id: '3', name: 'Forgot-to-cancel Subscriptions', value: 15 },
      { id: '4', name: 'Impulse Online Shopping', value: 10 },
      { id: '5', name: 'Actual Savings', value: 5 }
    ]
  },
  memeMeeting: {
    category: 'viral',
    title: 'Anatomy of a 1-Hour Zoom Meeting',
    subtitle: 'Efficiency Breakdown',
    chartType: 'bar' as ChartType,
    data: [
      { id: '1', name: '"Can you see my screen?"', value: 18 },
      { id: '2', name: '"You were on mute"', value: 14 },
      { id: '3', name: 'Awkward silence after question', value: 22 },
      { id: '4', name: 'Small talk about weather', value: 12 },
      { id: '5', name: 'Actual productive decision', value: 6 }
    ]
  },
  aiMarket: {
    category: 'tech',
    title: '2026 AI Developer Workflow Share',
    subtitle: 'State of Autonomous Software Engineering',
    chartType: 'bar' as ChartType,
    data: [
      { id: '1', name: 'Coding Agents', value: 44 },
      { id: '2', name: 'Copilot Auto-complete', value: 26 },
      { id: '3', name: 'Chat Reasoning Models', value: 18 },
      { id: '4', name: 'Manual Syntax Writing', value: 12 }
    ]
  },
  marketShare: {
    category: 'tech',
    title: 'Global Smartphone OS Market Share',
    subtitle: 'Source: Mobile Analytics 2026',
    chartType: 'pie' as ChartType,
    data: [
      { id: '1', name: 'Android', value: 71.4 },
      { id: '2', name: 'iOS', value: 27.8 },
      { id: '3', name: 'KaiOS', value: 0.5 },
      { id: '4', name: 'Others', value: 0.3 }
    ]
  },
  revenueGrowth: {
    category: 'finance',
    title: 'Quarterly SaaS Revenue ($k)',
    subtitle: 'Fiscal Year Performance Curve',
    chartType: 'line' as ChartType,
    data: [
      { id: '1', name: 'Q1 2026', value: 145 },
      { id: '2', name: 'Q2 2026', value: 230 },
      { id: '3', name: 'Q3 2026', value: 310 },
      { id: '4', name: 'Q4 2026', value: 480 }
    ]
  },
  trafficSources: {
    category: 'business',
    title: 'Website Visitor Traffic Breakdown',
    subtitle: 'Monthly Organic vs Direct vs Social',
    chartType: 'horizontalBar' as ChartType,
    data: [
      { id: '1', name: 'Organic Search', value: 52000 },
      { id: '2', name: 'Direct Traffic', value: 24000 },
      { id: '3', name: 'Social Media', value: 18000 },
      { id: '4', name: 'Referrals', value: 9500 },
      { id: '5', name: 'Email Campaigns', value: 6200 }
    ]
  },
  budgetAllocation: {
    category: 'business',
    title: 'Startup Annual Budget Allocation',
    subtitle: 'Engineering & Marketing Priority',
    chartType: 'donut' as ChartType,
    data: [
      { id: '1', name: 'Engineering & Product', value: 45 },
      { id: '2', name: 'Growth Marketing', value: 25 },
      { id: '3', name: 'Sales & BD', value: 15 },
      { id: '4', name: 'Operations & Legal', value: 10 },
      { id: '5', name: 'Customer Success', value: 5 }
    ]
  },
  cryptoPortfolio: {
    category: 'finance',
    title: 'DeFi & Crypto Asset Allocation',
    subtitle: 'Portfolio Holding Distribution',
    chartType: 'pie' as ChartType,
    data: [
      { id: '1', name: 'Bitcoin (BTC)', value: 40 },
      { id: '2', name: 'Ethereum (ETH)', value: 30 },
      { id: '3', name: 'Solana (SOL)', value: 15 },
      { id: '4', name: 'Stablecoins (USDC)', value: 10 },
      { id: '5', name: 'Altcoins', value: 5 }
    ]
  },
  skillRadar: {
    category: 'tech',
    title: 'Full-Stack Developer Skill Matrix',
    subtitle: 'Proficiency Score Out of 100',
    chartType: 'radar' as ChartType,
    data: [
      { id: '1', name: 'React & Next.js', value: 95 },
      { id: '2', name: 'TypeScript', value: 90 },
      { id: '3', name: 'UI & Design Tokens', value: 92 },
      { id: '4', name: 'Backend & APIs', value: 85 },
      { id: '5', name: 'Database & SQL', value: 80 },
      { id: '6', name: 'Performance & SEO', value: 94 }
    ]
  }
};
