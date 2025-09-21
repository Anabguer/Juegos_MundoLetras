import { CONFIG } from '../config';
import { ApiResponse, UserAuth, UserProgress, ScoreEntry } from '../types';

/**
 * Cliente API para comunicación con el backend de Hostalia
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
  }

  /**
   * Realizar petición HTTP
   */
  private async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Autenticación
   */
  async login(email: string, password: string): Promise<ApiResponse<{
    user: UserAuth;
    progress: UserProgress;
  }>> {
    return this.request('auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        email,
        password
      })
    });
  }

  async register(email: string, password: string, nombre: string): Promise<ApiResponse<{
    user_id: number;
    email_sent: boolean;
  }>> {
    return this.request('auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'register',
        email,
        password,
        nombre,
        app_codigo: CONFIG.APP_CODIGO
      })
    });
  }

  async verifyCode(code: string): Promise<ApiResponse<{
    user_id: number;
    email: string;
    nombre: string;
  }>> {
    return this.request('auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'verify',
        code
      })
    });
  }

  /**
   * Progreso
   */
  async getProgress(userKey: string): Promise<ApiResponse<{
    progress: UserProgress;
    recent_scores: ScoreEntry[];
  }>> {
    return this.request('progress.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get',
        user_key: userKey
      })
    });
  }

  async updateProgress(
    userKey: string, 
    nivelMax: number, 
    monedas: number
  ): Promise<ApiResponse<UserProgress>> {
    return this.request('progress.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        user_key: userKey,
        nivel_max: nivelMax,
        monedas
      })
    });
  }

  async syncProgress(
    userKey: string, 
    localProgress: Partial<UserProgress>
  ): Promise<ApiResponse<{
    progress: UserProgress;
    sync_info: any;
  }>> {
    return this.request('progress.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'sync',
        user_key: userKey,
        local_progress: localProgress
      })
    });
  }

  async submitScore(
    userKey: string,
    nivelId: number,
    score: number,
    tiempoMs: number,
    seed?: string,
    deviceHash?: string
  ): Promise<ApiResponse<{
    score_id: number;
    is_new_record: boolean;
  }>> {
    // Generar hash del cliente para validación anti-trampas
    const clientHash = seed ? 
      await this.generateClientHash(nivelId, score, tiempoMs, seed) : 
      undefined;

    return this.request('progress.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'submit_score',
        user_key: userKey,
        nivel_id: nivelId,
        score,
        tiempo_ms: tiempoMs,
        seed,
        device_hash: deviceHash,
        client_hash: clientHash
      })
    });
  }

  /**
   * Ranking
   */
  async getGlobalRanking(limit = 50, offset = 0): Promise<ApiResponse<{
    ranking: any[];
    pagination: any;
  }>> {
    return this.request('ranking.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'global',
        limit,
        offset
      })
    });
  }

  async getWeeklyRanking(week?: string, limit = 50): Promise<ApiResponse<{
    ranking: any[];
    week_info: any;
  }>> {
    return this.request('ranking.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'weekly',
        week: week || this.getCurrentWeek(),
        limit
      })
    });
  }

  async getLevelRanking(nivelId: number, limit = 20): Promise<ApiResponse<{
    ranking: any[];
    stats: any;
  }>> {
    return this.request('ranking.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'level',
        nivel_id: nivelId,
        limit
      })
    });
  }

  async getUserStats(userKey: string): Promise<ApiResponse<{
    user: any;
    stats: any;
    recent_scores: any[];
  }>> {
    return this.request('ranking.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'user_stats',
        user_key: userKey
      })
    });
  }

  /**
   * Utilidades
   */
  private async generateClientHash(
    levelId: number, 
    score: number, 
    timeMs: number, 
    seed: string
  ): Promise<string> {
    const data = `${levelId}${score}${timeMs}${seed}MUNDO_LETRAS_SALT`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getCurrentWeek(): string {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Verificar conectividad
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Instancia singleton
export const apiClient = new ApiClient();

/**
 * Hook para verificar conectividad
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Exportar para uso directo
export default apiClient;
