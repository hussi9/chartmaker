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

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'cyber',
    name: 'Neon Cyber',
    colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#3b82f6', '#f43f5e']
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
    id: 'pastel',
    name: 'Minimal Pastel',
    colors: ['#93c5fd', '#fca5a5', '#86efac', '#fde047', '#c084fc', '#6ee7b7', '#fdba74', '#f472b6']
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: ['#f97316', '#fb7185', '#a855f7', '#6366f1', '#06b6d4', '#eab308', '#ec4899', '#10b981']
  },
  {
    id: 'emerald',
    name: 'Emerald Luxe',
    colors: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7', '#a7f3d0', '#064e3b', '#022c22']
  },
  {
    id: 'monochrome',
    name: 'Mono Dark',
    colors: ['#f8fafc', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a']
  },
  {
    id: 'crypto',
    name: 'Crypto Gold',
    colors: ['#f59e0b', '#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899']
  }
];

export const SAMPLE_DATASETS = {
  marketShare: {
    title: 'Global Smartphone OS Market Share',
    subtitle: 'Source: Mobile Analytics 2026',
    data: [
      { id: '1', name: 'Android', value: 71.4 },
      { id: '2', name: 'iOS', value: 27.8 },
      { id: '3', name: 'KaiOS', value: 0.5 },
      { id: '4', name: 'Others', value: 0.3 }
    ]
  },
  revenueGrowth: {
    title: 'Quarterly SaaS Revenue ($k)',
    subtitle: 'Fiscal Year Performance',
    data: [
      { id: '1', name: 'Q1 2026', value: 145 },
      { id: '2', name: 'Q2 2026', value: 230 },
      { id: '3', name: 'Q3 2026', value: 310 },
      { id: '4', name: 'Q4 2026', value: 480 }
    ]
  },
  trafficSources: {
    title: 'Website Visitor Traffic Breakdown',
    subtitle: 'Monthly Organic vs Direct vs Paid',
    data: [
      { id: '1', name: 'Organic Search', value: 52000 },
      { id: '2', name: 'Direct Traffic', value: 24000 },
      { id: '3', name: 'Social Media', value: 18000 },
      { id: '4', name: 'Referrals', value: 9500 },
      { id: '5', name: 'Email Campaigns', value: 6200 }
    ]
  },
  budgetAllocation: {
    title: 'Startup Annual Budget Allocation',
    subtitle: 'Engineering & Marketing Priority',
    data: [
      { id: '1', name: 'Engineering & Product', value: 45 },
      { id: '2', name: 'Growth Marketing', value: 25 },
      { id: '3', name: 'Sales & BD', value: 15 },
      { id: '4', name: 'Operations & Legal', value: 10 },
      { id: '5', name: 'Customer Success', value: 5 }
    ]
  },
  cryptoPortfolio: {
    title: 'DeFi & Crypto Asset Allocation',
    subtitle: 'Portfolio Holding Distribution',
    data: [
      { id: '1', name: 'Bitcoin (BTC)', value: 40 },
      { id: '2', name: 'Ethereum (ETH)', value: 30 },
      { id: '3', name: 'Solana (SOL)', value: 15 },
      { id: '4', name: 'Stablecoins (USDC)', value: 10 },
      { id: '5', name: 'Altcoins', value: 5 }
    ]
  },
  marketingFunnel: {
    title: 'Conversion Funnel Performance',
    subtitle: 'User Drop-off Stages',
    data: [
      { id: '1', name: 'Page Impressions', value: 100000 },
      { id: '2', name: 'Product Views', value: 42000 },
      { id: '3', name: 'Add to Cart', value: 12500 },
      { id: '4', name: 'Checkout Started', value: 6800 },
      { id: '5', name: 'Purchased', value: 3400 }
    ]
  },
  skillRadar: {
    title: 'Full-Stack Developer Skill Matrix',
    subtitle: 'Proficiency Score Out of 100',
    data: [
      { id: '1', name: 'React & Next.js', value: 95 },
      { id: '2', name: 'TypeScript', value: 90 },
      { id: '3', name: 'UI & CSS Architecture', value: 92 },
      { id: '4', name: 'Backend & APIs', value: 85 },
      { id: '5', name: 'Database & SQL', value: 80 },
      { id: '6', name: 'SEO & Performance', value: 94 }
    ]
  }
};
