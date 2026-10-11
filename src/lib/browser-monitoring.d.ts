export type MonitoringController = { refresh(): void; destroy(): void };
export function installMonitoring(input: {
  window: Window;
  document: Document;
  allowed: () => boolean;
  route: (path: string) => string | null;
  speedRoute?: (path: string) => string | null;
  analyticsScript?: string;
  speedScript?: string;
}): MonitoringController;
