import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// Database types
export interface User {
  id: number
  username: string
  created_at: string
  updated_at: string
}

export interface FileRecord {
  id: number
  user_id: number
  filename: string
  file_path: string
  file_type: "log" | "csv" | "xlsx" | "txt"
  file_size: number
  upload_date: string
}

export interface Conversation {
  id: number
  user_id: number
  file_id?: number
  title: string
  history_json: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
  visualizations?: any[]
  tables?: any[]
}

export class DatabaseManager {
  private db: Database.Database
  private static instance: DatabaseManager

  private constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Initialize database
    const dbPath = path.join(dataDir, "ai_agent.db")
    this.db = new Database(dbPath)
    this.db.pragma("journal_mode = WAL")
    this.initializeDatabase()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private initializeDatabase() {
    // Read and execute SQL schema
    const schemaPath = path.join(process.cwd(), "scripts", "init-database.sql")
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf-8")
      this.db.exec(schema)
    }
  }

  // User operations
  public getUser(id: number): User | undefined {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?")
    return stmt.get(id) as User | undefined
  }

  public createUser(username: string): User {
    const stmt = this.db.prepare("INSERT INTO users (username) VALUES (?) RETURNING *")
    return stmt.get(username) as User
  }

  // File operations
  public saveFileRecord(fileData: Omit<FileRecord, "id" | "upload_date">): FileRecord {
    const stmt = this.db.prepare(`
      INSERT INTO files (user_id, filename, file_path, file_type, file_size) 
      VALUES (?, ?, ?, ?, ?) RETURNING *
    `)
    return stmt.get(
      fileData.user_id,
      fileData.filename,
      fileData.file_path,
      fileData.file_type,
      fileData.file_size,
    ) as FileRecord
  }

  public getFilesByUser(userId: number): FileRecord[] {
    const stmt = this.db.prepare("SELECT * FROM files WHERE user_id = ? ORDER BY upload_date DESC")
    return stmt.all(userId) as FileRecord[]
  }

  public getFile(id: number): FileRecord | undefined {
    const stmt = this.db.prepare("SELECT * FROM files WHERE id = ?")
    return stmt.get(id) as FileRecord | undefined
  }

  // Conversation operations
  public createConversation(userId: number, title: string, fileId?: number): Conversation {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (user_id, file_id, title, history_json) 
      VALUES (?, ?, ?, ?) RETURNING *
    `)
    return stmt.get(userId, fileId || null, title, JSON.stringify([])) as Conversation
  }

  public getConversationsByUser(userId: number): Conversation[] {
    const stmt = this.db.prepare("SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC")
    return stmt.all(userId) as Conversation[]
  }

  public getConversation(id: number): Conversation | undefined {
    const stmt = this.db.prepare("SELECT * FROM conversations WHERE id = ?")
    return stmt.get(id) as Conversation | undefined
  }

  public updateConversationHistory(id: number, messages: ChatMessage[]): void {
    const stmt = this.db.prepare(
      "UPDATE conversations SET history_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    stmt.run(JSON.stringify(messages), id)
  }

  public deleteConversation(id: number): void {
    const stmt = this.db.prepare("DELETE FROM conversations WHERE id = ?")
    stmt.run(id)
  }

  public updateConversation(id: number, updates: { title?: string }): void {
    const fields = []
    const values = []

    if (updates.title !== undefined) {
      fields.push("title = ?")
      values.push(updates.title)
    }

    if (fields.length > 0) {
      fields.push("updated_at = CURRENT_TIMESTAMP")
      values.push(id)

      const stmt = this.db.prepare(`UPDATE conversations SET ${fields.join(", ")} WHERE id = ?`)
      stmt.run(...values)
    }
  }
}

export const db = DatabaseManager.getInstance()
