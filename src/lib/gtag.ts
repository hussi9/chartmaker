// Google Analytics 4 (GA4) Integration & Telemetry System
// Supports environment variables (VITE_GA_MEASUREMENT_ID), dynamic client override, and structured conversion tracking.

import { recordChartEvent, recordExportEvent, recordAiPrompt, getCustomGaId } from './learningLoop';

// Declare gtag on window
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Get effective GA ID
export const getActiveGaMeasurementId = (): string => {
  const custom = getCustomGaId();
  if (custom) return custom;
  return import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-CHARTGENIE1';
};

// Dynamically initialize or update GA script if needed
export const initGoogleAnalytics = (measurementId?: string) => {
  if (typeof window === 'undefined') return;

  const id = measurementId || getActiveGaMeasurementId();
  if (!id || id === 'G-CHARTGENIE1') return; // Skip dummy mock if not configured

  // Check if script already exists
  const scriptId = 'ga4-gtag-script';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
  }

  window.gtag?.('config', id, {
    page_path: window.location.pathname,
    send_page_view: true
  });
};

// Generic Track Event
export const trackEvent = (action: string, category: string, label?: string, value?: number, additionalParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...additionalParams
    });
  }
};

// Specific Conversion & User Flow Trackers
export const trackChartCreate = (chartType: string, themeId: string, aspect: string, pointsCount: number) => {
  trackEvent('chart_update', 'Studio', `${chartType}:${themeId}`, pointsCount, {
    chart_type: chartType,
    theme_id: themeId,
    aspect_ratio: aspect,
    points_count: pointsCount
  });
  recordChartEvent(chartType, themeId, aspect);
};

export const trackExportChart = (format: 'png' | 'svg' | 'json' | 'embed', scale?: number) => {
  trackEvent('export_chart', 'Conversion', format, scale || 1, {
    export_format: format,
    scale: scale || 1
  });
  recordExportEvent(format);
};

export const trackCopyChart = () => {
  trackEvent('copy_clipboard', 'Engagement', 'png_image');
  recordExportEvent('clipboard_copy');
};

export const trackAiPromptGenerate = (prompt: string, success: boolean) => {
  trackEvent('ai_prompt_generate', 'AI_Studio', success ? 'success' : 'failed', prompt.length, {
    prompt_length: prompt.length,
    success
  });
  if (success) {
    recordAiPrompt(prompt);
  }
};

export const trackCsvImport = (rowsCount: number) => {
  trackEvent('csv_import', 'Data', 'user_file', rowsCount, {
    row_count: rowsCount
  });
};

export const trackThemeSelection = (themeId: string) => {
  trackEvent('theme_change', 'Customization', themeId);
};

export const trackAspectRatioSelection = (ratio: string) => {
  trackEvent('aspect_ratio_change', 'Customization', ratio);
};
