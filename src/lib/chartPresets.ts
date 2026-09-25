export interface DataItem {
  id: string;
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
}

export type ChartType = 'pie' | 'donut' | 'bar' | 'horizontalBar' | 'stackedBar' | 'line' | 'area' | 'radar';

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'cyber',
    name: 'Neon Cyber',
    colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']
  },
  {
    id: 'vercel',
    name: 'Vercel Slate',
    colors: ['#3b82f6', '#06b6d4', '#10b981', '#6366f1', '#a855f7', '#f43f5e']
  },
  {
    id: 'finance',
    name: 'Stripe Finance',
    colors: ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed']
  },
  {
    id: 'pastel',
    name: 'Minimal Pastel',
    colors: ['#93c5fd', '#fca5a5', '#86efac', '#fde047', '#c084fc', '#6ee7b7']
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: ['#f97316', '#fb7185', '#a855f7', '#6366f1', '#06b6d4', '#eab308']
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
  }
};
