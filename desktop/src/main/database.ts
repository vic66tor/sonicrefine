import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  title: string;
  inputPath: string;
  outputPath: string | null;
  originalFilename: string;
  outputFormat: string;
  status: 'pending' | 'analyzing' | 'processing' | 'completed' | 'failed';
  settings: string; // JSON string
  analysisData: string | null; // JSON string
  errorMessage: string | null;
  durationSeconds: number | null;
  createdAt: string;
  completedAt: string | null;
}

export class Database {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'sonicrefine.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        inputPath TEXT NOT NULL,
        outputPath TEXT,
        originalFilename TEXT NOT NULL,
        outputFormat TEXT NOT NULL DEFAULT 'mp3',
        status TEXT NOT NULL DEFAULT 'pending',
        settings TEXT,
        analysisData TEXT,
        errorMessage TEXT,
        durationSeconds REAL,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      )
    `);
  }

  createProject(data: {
    title: string;
    inputPath: string;
    originalFilename: string;
    outputFormat: string;
    settings: object;
    analysisData: object;
    status: string;
  }): Project {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const analysisData = data.analysisData as any;

    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, title, inputPath, originalFilename, outputFormat, 
        status, settings, analysisData, durationSeconds, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      data.inputPath,
      data.originalFilename,
      data.outputFormat,
      data.status,
      JSON.stringify(data.settings),
      JSON.stringify(data.analysisData),
      analysisData?.duration || null,
      createdAt
    );

    return this.getProject(id)!;
  }

  getProject(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as Project | undefined;
    if (!row) return null;
    return this.parseProject(row);
  }

  getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY createdAt DESC');
    const rows = stmt.all() as Project[];
    return rows.map((row) => this.parseProject(row));
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates).map((v) =>
      typeof v === 'object' ? JSON.stringify(v) : v
    );

    const stmt = this.db.prepare(`UPDATE projects SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
  }

  deleteProject(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private parseProject(row: Project): Project {
    return {
      ...row,
      settings: row.settings ? JSON.parse(row.settings) : null,
      analysisData: row.analysisData ? JSON.parse(row.analysisData) : null,
    } as any;
  }
}
