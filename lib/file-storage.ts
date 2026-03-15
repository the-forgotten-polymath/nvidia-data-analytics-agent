import fs from "fs"
import path from "path"

export class FileStorageManager {
  private static baseDir = path.join(process.cwd(), "user_files")

  public static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  public static getUserDirectory(userId: number): string {
    const userDir = path.join(this.baseDir, userId.toString())
    this.ensureDirectoryExists(userDir)
    return userDir
  }

  public static saveFile(userId: number, filename: string, buffer: Buffer): string {
    const userDir = this.getUserDirectory(userId)
    const timestamp = Date.now()
    const safeFilename = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = path.join(userDir, safeFilename)

    fs.writeFileSync(filePath, buffer)
    return filePath
  }

  public static readFile(filePath: string): Buffer {
    return fs.readFileSync(filePath)
  }

  public static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  public static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().slice(1)
  }

  public static isValidFileType(filename: string): boolean {
    const validExtensions = ["log", "csv", "xlsx", "txt"]
    const extension = this.getFileExtension(filename)
    return validExtensions.includes(extension)
  }

  public static getFileSize(filePath: string): number {
    return fs.statSync(filePath).size
  }
}
