export interface HealthStatus {
  status: string;
  environment: string;
  version: string;
  services: {
    database: { status: string; latency_ms: number; details: string };
    redis: { status: string; latency_ms: number; details: string };
  };
}

export interface Transaction {
  id: string;
  external_id: string | null;
  date: string;
  amount: number;
  currency: string;
  description: string;
  counterparty: string | null;
  category: string;
  payment_method: string;
  type: string;
  is_reconciled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  pending_reconciliation_count: number;
  by_category: Record<string, number>;
}

export interface PomodoroSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  project_name: string;
  tag: string | null;
  completed: boolean;
  interruptions: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PomodoroTodayStats {
  date: string;
  total_pomodoros: number;
  total_minutes: number;
  by_project: Record<string, number>;
}

export interface AiUsageStats {
  total_cost_usd: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_requests: number;
  by_account: Record<string, number>;
  by_model: Record<string, number>;
  by_category: Record<string, number>;
}

export interface AiQuota {
  id: string;
  account_name: string;
  provider: string;
  limit_usd: number;
  reset_day_of_month: number;
  current_usage_usd: number;
  percent_used: number;
  days_until_reset: number;
}

export interface WeatherLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
}

export interface WeatherLog {
  id: string;
  location_id: string;
  log_date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability: number;
  humidity: number | null;
  weather_condition: string;
  created_at: string;
  location: WeatherLocation;
}

const API_BASE = '/api/v1';

export const api = {
  // Health
  getHealth: async (): Promise<HealthStatus> => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Error al consultar salud del backend');
    return res.json();
  },

  // Finanzas / Transacciones
  getTransactions: async (params?: {
    is_reconciled?: boolean;
    category?: string;
    limit?: number;
  }): Promise<Transaction[]> => {
    const url = new URL(`${window.location.origin}${API_BASE}/transactions`);
    if (params?.is_reconciled !== undefined) {
      url.searchParams.set('is_reconciled', String(params.is_reconciled));
    }
    if (params?.category) {
      url.searchParams.set('category', params.category);
    }
    if (params?.limit) {
      url.searchParams.set('limit', String(params.limit));
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Error al listar transacciones');
    return res.json();
  },

  getSummary: async (): Promise<TransactionSummary> => {
    const res = await fetch(`${API_BASE}/transactions/summary`);
    if (!res.ok) throw new Error('Error al obtener resumen de transacciones');
    return res.json();
  },

  createTransaction: async (data: {
    date: string;
    amount: number;
    currency?: string;
    description: string;
    counterparty?: string;
    category?: string;
    payment_method?: string;
    type?: string;
    is_reconciled?: boolean;
    notes?: string;
  }): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear transacción');
    return res.json();
  },

  updateTransaction: async (
    id: string,
    data: {
      category?: string;
      is_reconciled?: boolean;
      notes?: string;
      description?: string;
    }
  ): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar transacción');
    return res.json();
  },

  uploadMercadoPago: async (file: File): Promise<{
    filename: string;
    processed_rows: number;
    imported_count: number;
    skipped_duplicates: number;
    parser_warnings: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/transactions/upload-mercadopago`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || 'Error al subir extracto de Mercado Pago');
    }
    return res.json();
  },

  // Pomodoro
  getTodayPomodoroStats: async (): Promise<PomodoroTodayStats> => {
    const res = await fetch(`${API_BASE}/pomodoro/stats/today`);
    if (!res.ok) throw new Error('Error al obtener estadísticas de pomodoro');
    return res.json();
  },

  getPomodoros: async (limit = 20): Promise<PomodoroSession[]> => {
    const res = await fetch(`${API_BASE}/pomodoro?limit=${limit}`);
    if (!res.ok) throw new Error('Error al listar pomodoros');
    return res.json();
  },

  createPomodoro: async (data: {
    start_time: string;
    duration_minutes: number;
    project_name: string;
    tag?: string;
    completed: boolean;
    interruptions?: number;
    notes?: string;
  }): Promise<PomodoroSession> => {
    const res = await fetch(`${API_BASE}/pomodoro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar pomodoro');
    return res.json();
  },

  // AI Usage
  getAiStats: async (days = 30): Promise<AiUsageStats> => {
    const res = await fetch(`${API_BASE}/ai/stats?days=${days}`);
    if (!res.ok) throw new Error('Error al obtener estadísticas de IA');
    return res.json();
  },

  getAiQuotas: async (): Promise<AiQuota[]> => {
    const res = await fetch(`${API_BASE}/ai/quotas`);
    if (!res.ok) throw new Error('Error al obtener cuotas de IA');
    return res.json();
  },

  // Clima / Weather
  getWeatherLogs: async (): Promise<WeatherLog[]> => {
    const res = await fetch(`${API_BASE}/weather/logs`);
    if (!res.ok) throw new Error('Error al obtener logs de clima');
    return res.json();
  },

  createWeatherLocation: async (data: {
    name: string;
    latitude: number;
    longitude: number;
    historical_days?: number;
  }): Promise<WeatherLocation> => {
    const res = await fetch(`${API_BASE}/weather/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear ubicación meteorológica');
    }
    return res.json();
  },

  deleteWeatherLocation: async (id: string, deleteLogs: boolean = true): Promise<void> => {
    const res = await fetch(`${API_BASE}/weather/locations/${id}?delete_logs=${deleteLogs}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Error al eliminar ubicación');
    }
  }
};
