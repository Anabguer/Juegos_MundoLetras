import Dexie, { Table } from 'dexie';
import { UserProgress, ScoreEntry, LevelConfig } from '../types';
import { CONFIG } from '../config';

// Definir esquema de IndexedDB
interface LocalUser {
  id?: number;
  usuario_aplicacion_key: string;
  email?: string;
  nombre?: string;
  isGuest: boolean;
  createdAt: Date;
  lastSync?: Date;
}

interface LocalScore extends Omit<ScoreEntry, 'scores_id'> {
  id?: number;
  synced: boolean;
  createdAt: Date;
}

interface LocalLevel {
  id?: number;
  levelId: number;
  config: LevelConfig;
  bestScore?: number;
  stars?: number;
  completed: boolean;
  attempts: number;
  createdAt: Date;
}

interface LocalSetting {
  key: string;
  value: any;
  updatedAt: Date;
}

// Base de datos IndexedDB
class MundoLetrasDB extends Dexie {
  users!: Table<LocalUser>;
  progress!: Table<UserProgress>;
  scores!: Table<LocalScore>;
  levels!: Table<LocalLevel>;
  settings!: Table<LocalSetting>;

  constructor() {
    super('MundoLetrasDB');
    
    this.version(1).stores({
      users: '++id, usuario_aplicacion_key, email, isGuest, createdAt',
      progress: 'usuario_aplicacion_key, nivel_max, monedas, actualizado_at',
      scores: '++id, usuario_aplicacion_key, nivel_id, score, fecha, synced',
      levels: '++id, levelId, completed, bestScore, stars',
      settings: 'key, updatedAt'
    });
  }
}

// Instancia de la base de datos
const db = new MundoLetrasDB();

/**
 * Clase para manejo de almacenamiento local
 */
export class LocalStorage {
  
  /**
   * Usuario
   */
  static async saveUser(user: LocalUser): Promise<void> {
    await db.users.put(user);
  }

  static async getUser(userKey: string): Promise<LocalUser | undefined> {
    return await db.users.where('usuario_aplicacion_key').equals(userKey).first();
  }

  static async getCurrentUser(): Promise<LocalUser | undefined> {
    return await db.users.orderBy('createdAt').reverse().first();
  }

  static async deleteUser(userKey: string): Promise<void> {
    await db.users.where('usuario_aplicacion_key').equals(userKey).delete();
  }

  /**
   * Progreso
   */
  static async saveProgress(progress: UserProgress): Promise<void> {
    await db.progress.put(progress);
    
    // También guardar en localStorage como backup
    localStorage.setItem(CONFIG.STORAGE.PROGRESS_KEY, JSON.stringify(progress));
  }

  static async getProgress(userKey: string): Promise<UserProgress | undefined> {
    let progress = await db.progress.get(userKey);
    
    // Fallback a localStorage
    if (!progress) {
      const stored = localStorage.getItem(CONFIG.STORAGE.PROGRESS_KEY);
      if (stored) {
        progress = JSON.parse(stored);
        if (progress && progress.usuario_aplicacion_key === userKey) {
          await this.saveProgress(progress);
        } else {
          progress = undefined;
        }
      }
    }
    
    return progress;
  }

  static async updateProgress(userKey: string, updates: Partial<UserProgress>): Promise<void> {
    const current = await this.getProgress(userKey);
    const updated: UserProgress = {
      usuario_aplicacion_key: userKey,
      nivel_max: 1,
      monedas: CONFIG.GAME.DEFAULT_COINS,
      actualizado_at: new Date().toISOString(),
      ...current,
      ...updates
    };
    
    await this.saveProgress(updated);
  }

  /**
   * Puntuaciones
   */
  static async saveScore(score: LocalScore): Promise<number> {
    const id = await db.scores.add(score);
    
    // Mantener solo las últimas 100 puntuaciones por usuario
    const oldScores = await db.scores
      .where('usuario_aplicacion_key')
      .equals(score.usuario_aplicacion_key)
      .orderBy('createdAt')
      .reverse()
      .offset(100)
      .toArray();
    
    if (oldScores.length > 0) {
      const oldIds = oldScores.map(s => s.id!);
      await db.scores.bulkDelete(oldIds);
    }
    
    return id;
  }

  static async getScores(userKey: string, limit = 50): Promise<LocalScore[]> {
    return await db.scores
      .where('usuario_aplicacion_key')
      .equals(userKey)
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  static async getUnsyncedScores(userKey: string): Promise<LocalScore[]> {
    return await db.scores
      .where(['usuario_aplicacion_key', 'synced'])
      .equals([userKey, false])
      .toArray();
  }

  static async markScoresSynced(scoreIds: number[]): Promise<void> {
    await db.scores.bulkUpdate(scoreIds, { synced: true });
  }

  static async getBestScore(userKey: string, levelId: number): Promise<number> {
    const bestScore = await db.scores
      .where(['usuario_aplicacion_key', 'nivel_id'])
      .equals([userKey, levelId])
      .orderBy('score')
      .reverse()
      .first();
    
    return bestScore?.score || 0;
  }

  /**
   * Niveles
   */
  static async saveLevel(level: LocalLevel): Promise<void> {
    await db.levels.put(level);
  }

  static async getLevel(levelId: number): Promise<LocalLevel | undefined> {
    return await db.levels.where('levelId').equals(levelId).first();
  }

  static async updateLevel(levelId: number, updates: Partial<LocalLevel>): Promise<void> {
    const current = await this.getLevel(levelId);
    if (current) {
      await db.levels.put({ ...current, ...updates });
    }
  }

  static async getCompletedLevels(userKey: string): Promise<number[]> {
    const progress = await this.getProgress(userKey);
    if (!progress) return [];
    
    const levels = [];
    for (let i = 1; i < progress.nivel_max; i++) {
      levels.push(i);
    }
    return levels;
  }

  /**
   * Configuraciones
   */
  static async saveSetting(key: string, value: any): Promise<void> {
    await db.settings.put({
      key,
      value,
      updatedAt: new Date()
    });
    
    // También en localStorage
    localStorage.setItem(`${CONFIG.STORAGE.SETTINGS_KEY}_${key}`, JSON.stringify(value));
  }

  static async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await db.settings.get(key);
    if (setting) {
      return setting.value;
    }
    
    // Fallback a localStorage
    const stored = localStorage.getItem(`${CONFIG.STORAGE.SETTINGS_KEY}_${key}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultValue;
      }
    }
    
    return defaultValue;
  }

  /**
   * Sincronización
   */
  static async getLastSyncTime(userKey: string): Promise<Date | null> {
    const user = await this.getUser(userKey);
    return user?.lastSync || null;
  }

  static async updateLastSyncTime(userKey: string): Promise<void> {
    const user = await this.getUser(userKey);
    if (user) {
      user.lastSync = new Date();
      await this.saveUser(user);
    }
  }

  /**
   * Limpieza
   */
  static async clearUserData(userKey: string): Promise<void> {
    await Promise.all([
      db.users.where('usuario_aplicacion_key').equals(userKey).delete(),
      db.progress.where('usuario_aplicacion_key').equals(userKey).delete(),
      db.scores.where('usuario_aplicacion_key').equals(userKey).delete()
    ]);
    
    // Limpiar localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mundoletras_')) {
        localStorage.removeItem(key);
      }
    });
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      db.users.clear(),
      db.progress.clear(),
      db.scores.clear(),
      db.levels.clear(),
      db.settings.clear()
    ]);
    
    // Limpiar localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mundoletras_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Estadísticas locales
   */
  static async getUserStats(userKey: string): Promise<{
    totalGames: number;
    totalScore: number;
    avgScore: number;
    bestScore: number;
    uniqueLevels: number;
    completionRate: number;
  }> {
    const scores = await this.getScores(userKey, 1000);
    const progress = await this.getProgress(userKey);
    
    const totalGames = scores.length;
    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
    const avgScore = totalGames > 0 ? totalScore / totalGames : 0;
    const bestScore = Math.max(...scores.map(s => s.score), 0);
    const uniqueLevels = new Set(scores.map(s => s.nivel_id)).size;
    const completionRate = progress ? ((progress.nivel_max - 1) / CONFIG.GAME.MAX_LEVELS) * 100 : 0;
    
    return {
      totalGames,
      totalScore,
      avgScore: Math.round(avgScore * 10) / 10,
      bestScore,
      uniqueLevels,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  /**
   * Exportar/Importar datos
   */
  static async exportUserData(userKey: string): Promise<string> {
    const [user, progress, scores, levels] = await Promise.all([
      this.getUser(userKey),
      this.getProgress(userKey),
      this.getScores(userKey, 1000),
      db.levels.toArray()
    ]);
    
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user,
      progress,
      scores,
      levels: levels.filter(l => l.completed)
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  static async importUserData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.version !== '1.0') {
        throw new Error('Versión de datos no compatible');
      }
      
      if (data.user) await this.saveUser(data.user);
      if (data.progress) await this.saveProgress(data.progress);
      if (data.scores) {
        for (const score of data.scores) {
          await this.saveScore({ ...score, synced: false, createdAt: new Date(score.createdAt) });
        }
      }
      if (data.levels) {
        for (const level of data.levels) {
          await this.saveLevel({ ...level, createdAt: new Date(level.createdAt) });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }
}

// Inicializar base de datos
db.open().catch(error => {
  console.error('Error abriendo IndexedDB:', error);
});

export default LocalStorage;
