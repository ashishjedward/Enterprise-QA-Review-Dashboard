import {
  HealthResponse,
  DashboardOverviewResponse,
  AccountMetadataResponse,
  ApiErrorResponse,
  DashboardScopeFilters,
  Account360Response,
  ProcessHealthMatrixResponse,
  SlaDiagnosticResponse,
  SlaTimePeriod,
  BestQmDiagnosticResponse,
  BestQmTimePeriod,
  HygieneDiagnosticResponse,
  HygieneTimePeriod,
  QaTeamDiagnosticResponse,
  QaTeamTimePeriod,
  ActionsDiagnosticResponse,
  ActionsTimePeriod,
  ValueAddsDiagnosticResponse,
  InsightsDiagnosticResponse,
  InsightsTimePeriod,
} from '../types/api';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiErrorResponse;
      if (typeof errorBody?.error === 'string') {
        errorMessage = errorBody.error;
      } else if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Non-JSON error body, use default message
    }
    throw new ApiError(errorMessage, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (err) {
    throw new Error(`Failed to parse API JSON response: ${(err as Error).message}`);
  }
}

/**
 * Validates server health and live BigQuery connection.
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<HealthResponse>(response);
}

/**
 * Fetches dashboard overview metrics, KPI cards, attention bands, and top attention accounts.
 */
export async function getDashboardOverview(): Promise<DashboardOverviewResponse> {
  const response = await fetch('/api/dashboard/overview', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<DashboardOverviewResponse>(response);
}

/**
 * Fetches scoped dashboard overview metrics filtered by optional dimensions.
 */
export async function getScopedDashboardOverview(
  filters?: DashboardScopeFilters
): Promise<DashboardOverviewResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.vertical) params.set('vertical', filters.vertical);
    if (filters.qaLeader) params.set('qaLeader', filters.qaLeader);
    if (filters.srDirector) params.set('srDirector', filters.srDirector);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.site) params.set('site', filters.site);
    if (filters.lob) params.set('lob', filters.lob);
  }

  const query = params.toString();
  const url = query ? `/api/dashboard/scoped-overview?${query}` : '/api/dashboard/scoped-overview';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<DashboardOverviewResponse>(response);
}

/**
 * Fetches the master account dimension hierarchy for all accounts.
 */
export async function getAccountMetadata(): Promise<AccountMetadataResponse> {
  const response = await fetch('/api/meta/accounts', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<AccountMetadataResponse>(response);
}

/**
 * Fetches complete Live Account 360 diagnostic data for a specific Account ID.
 */
export async function getAccount360(accountId: string): Promise<Account360Response> {
  const encodedId = encodeURIComponent(accountId);
  const response = await fetch(`/api/accounts/${encodedId}/360`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<Account360Response>(response);
}

/**
 * Fetches row-level Process Health matrix for scoped accounts.
 */
export async function getProcessHealthMatrix(
  filters?: DashboardScopeFilters
): Promise<ProcessHealthMatrixResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.vertical) params.set('vertical', filters.vertical);
    if (filters.qaLeader) params.set('qaLeader', filters.qaLeader);
    if (filters.srDirector) params.set('srDirector', filters.srDirector);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.site) params.set('site', filters.site);
    if (filters.lob) params.set('lob', filters.lob);
  }

  const query = params.toString();
  const url = query ? `/api/process-health/matrix?${query}` : '/api/process-health/matrix';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<ProcessHealthMatrixResponse>(response);
}

/**
 * Fetches comprehensive live SLA Diagnostic data.
 */
export async function getSlaDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: SlaTimePeriod | string; account?: string }
): Promise<SlaDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/sla-diagnostic?${query}` : '/api/sla-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<SlaDiagnosticResponse>(response);
}

/**
 * Fetches comprehensive live BEST QM Diagnostic data.
 */
export async function getBestQmDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: BestQmTimePeriod | string; account?: string }
): Promise<BestQmDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/best-qm-diagnostic?${query}` : '/api/best-qm-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<BestQmDiagnosticResponse>(response);
}

/**
 * Fetches comprehensive live Hygiene Diagnostic data.
 */
export async function getHygieneDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: HygieneTimePeriod | string; account?: string }
): Promise<HygieneDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/hygiene-diagnostic?${query}` : '/api/hygiene-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<HygieneDiagnosticResponse>(response);
}

/**
 * Fetches comprehensive live QA Team Diagnostic data.
 */
export async function getQaTeamDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: QaTeamTimePeriod | string; account?: string }
): Promise<QaTeamDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/qa-team-diagnostic?${query}` : '/api/qa-team-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<QaTeamDiagnosticResponse>(response);
}

/**
 * Fetches Actions and Closure Management diagnostic data across scoped accounts.
 */
export async function getActionsDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: string; account?: string }
): Promise<ActionsDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/actions-diagnostic?${query}` : '/api/actions-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<ActionsDiagnosticResponse>(response);
}

// Alias for convenience
export const fetchActionsDiagnostic = getActionsDiagnostic;

/**
 * Fetches comprehensive Value-adds & Transformation Diagnostic data across scoped accounts.
 */
export async function getValueAddsDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: string; account?: string }
): Promise<ValueAddsDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/value-adds-diagnostic?${query}` : '/api/value-adds-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<ValueAddsDiagnosticResponse>(response);
}

// Alias for convenience
export const fetchValueAddsDiagnostic = getValueAddsDiagnostic;

/**
 * Fetches comprehensive Leadership Insights & Executive Radar Diagnostic data across scoped accounts.
 */
export async function getInsightsDiagnostic(
  filters?: DashboardScopeFilters & { timePeriod?: string; account?: string }
): Promise<InsightsDiagnosticResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.timePeriod && filters.timePeriod !== 'ALL') {
      params.set('timePeriod', filters.timePeriod);
    }
    if (filters.vertical && filters.vertical !== 'ALL') {
      params.set('vertical', filters.vertical);
    }
    if (filters.qaLeader && filters.qaLeader !== 'ALL') {
      params.set('qaLeader', filters.qaLeader);
    }
    if (filters.srDirector && filters.srDirector !== 'ALL') {
      params.set('srDirector', filters.srDirector);
    }
    const accId = filters.accountId || filters.account;
    if (accId && accId !== 'ALL') {
      params.set('accountId', accId);
    }
    if (filters.site && filters.site !== 'ALL') {
      params.set('site', filters.site);
    }
    if (filters.lob && filters.lob !== 'ALL') {
      params.set('lob', filters.lob);
    }
  }

  const query = params.toString();
  const url = query ? `/api/insights-diagnostic?${query}` : '/api/insights-diagnostic';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<InsightsDiagnosticResponse>(response);
}

// Alias for convenience
export const fetchInsightsDiagnostic = getInsightsDiagnostic;

export { ApiError };
