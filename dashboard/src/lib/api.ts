/**
 * Centralized API Client for AMR-Sentinel V2
 * 
 * Configured with same-origin fallback or explicit VITE_API_BASE_URL environment variable.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export const api = {
  getHealth: () => apiFetch<any>("/api/health"),
  getDataStatus: () => apiFetch<any>("/api/data-status"),
  getOverview: () => apiFetch<any>("/api/overview"),
  getSignals: () => apiFetch<any[]>("/api/signals"),
  getSignalDetail: (id: string) => apiFetch<any>(`/api/signals/${id}`),
  getSignalInvestigation: (id: string) => apiFetch<any>(`/api/signals/${id}/investigation`),
  getMap: () => apiFetch<any[]>("/api/map"),
  getCoverage: () => apiFetch<any[]>("/api/coverage"),
  getClusters: () => apiFetch<any[]>("/api/clusters"),
  getClusterDetail: (id: string) => apiFetch<any>(`/api/clusters/${id}`),
  getTimeline: (pathogen?: string, gene?: string) => {
    const params = new URLSearchParams();
    if (pathogen) params.append("pathogen", pathogen);
    if (gene) params.append("gene", gene);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<any>(`/api/timeline${query}`);
  },
  getKnowledgeGraph: () => apiFetch<any>("/api/knowledge-graph"),
  getWhatChanged: () => apiFetch<any>("/api/what-changed"),
  getDataQuality: () => apiFetch<any>("/api/data-quality"),
  getModelValidation: () => apiFetch<any>("/api/model-validation"),
  getLiterature: (pathogen?: string, gene?: string) => {
    const params = new URLSearchParams();
    if (pathogen) params.append("pathogen", pathogen);
    if (gene) params.append("gene", gene);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<any[]>(`/api/literature${query}`);
  },
  getDataSources: () => apiFetch<any>("/api/data-sources"),
  getMethodology: () => apiFetch<any>("/api/methodology"),
  search: (payload: { query?: string; pathogen?: string; gene?: string; country?: string; min_score?: number }) =>
    apiFetch<any>("/api/search", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  recalculateScores: (weights: Record<string, number>) =>
    apiFetch<any>("/api/config/recalculate", {
      method: "POST",
      body: JSON.stringify({ weights }),
    }),
  exportReport: (signalId: string) => apiFetch<any>(`/api/export/report/${signalId}`),
};
