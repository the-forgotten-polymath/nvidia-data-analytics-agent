import fs from "fs"

export interface ProcessedFileData {
  type: "log" | "csv" | "xlsx" | "txt"
  content: string
  metadata: {
    size: number
    lines?: number
    columns?: string[]
    encoding?: string
  }
  preview: string
  structure?: any
}

export class FileProcessor {
  public static async processFile(filePath: string, fileType: string): Promise<ProcessedFileData> {
    const fileContent = fs.readFileSync(filePath, "utf-8")
    const fileSize = fs.statSync(filePath).size

    switch (fileType) {
      case "txt":
        return this.processTextFile(fileContent, fileSize)
      case "log":
        return this.processLogFile(fileContent, fileSize)
      case "csv":
        return this.processCsvFile(fileContent, fileSize)
      case "xlsx":
        return this.processExcelFile(filePath, fileSize)
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }

  private static processTextFile(content: string, size: number): ProcessedFileData {
    const lines = content.split("\n")
    const preview = lines.slice(0, 10).join("\n")

    return {
      type: "txt",
      content,
      metadata: {
        size,
        lines: lines.length,
        encoding: "utf-8",
      },
      preview,
    }
  }

  private static processLogFile(content: string, size: number): ProcessedFileData {
    const lines = content.split("\n").filter((line) => line.trim())
    const preview = lines.slice(0, 10).join("\n")

    // Basic log parsing - detect common patterns
    const logPatterns = {
      timestamp: /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/,
      level: /\b(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b/i,
      ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    }

    const structure = {
      hasTimestamps: logPatterns.timestamp.test(content),
      hasLogLevels: logPatterns.level.test(content),
      hasIpAddresses: logPatterns.ip.test(content),
      totalLines: lines.length,
    }

    return {
      type: "log",
      content,
      metadata: {
        size,
        lines: lines.length,
        encoding: "utf-8",
      },
      preview,
      structure,
    }
  }

  private static processCsvFile(content: string, size: number): ProcessedFileData {
    const lines = content.split("\n").filter((line) => line.trim())
    const headers = lines[0]?.split(",").map((h) => h.trim().replace(/"/g, ""))
    const preview = lines.slice(0, 6).join("\n")

    const structure = {
      headers,
      rows: lines.length - 1,
      columns: headers?.length || 0,
      delimiter: ",",
    }

    return {
      type: "csv",
      content,
      metadata: {
        size,
        lines: lines.length,
        columns: headers,
        encoding: "utf-8",
      },
      preview,
      structure,
    }
  }

  private static processExcelFile(filePath: string, size: number): ProcessedFileData {
    // For now, return basic info - full Excel processing would require xlsx library
    const preview = "Excel file processing requires additional libraries. File uploaded successfully."

    return {
      type: "xlsx",
      content: "Excel file content (binary)",
      metadata: {
        size,
        encoding: "binary",
      },
      preview,
      structure: {
        sheets: ["Sheet1"], // Placeholder
        format: "xlsx",
      },
    }
  }

  public static generateSummary(processedData: ProcessedFileData): string {
    const { type, metadata, structure } = processedData

    switch (type) {
      case "txt":
        return `Text file with ${metadata.lines} lines (${this.formatFileSize(metadata.size)})`

      case "log":
        const logInfo = structure as any
        return `Log file with ${metadata.lines} entries. ${logInfo.hasTimestamps ? "Contains timestamps. " : ""}${
          logInfo.hasLogLevels ? "Contains log levels. " : ""
        }${logInfo.hasIpAddresses ? "Contains IP addresses." : ""}`

      case "csv":
        const csvInfo = structure as any
        return `CSV file with ${csvInfo.rows} rows and ${csvInfo.columns} columns. Headers: ${csvInfo.headers
          ?.slice(0, 3)
          .join(", ")}${csvInfo.headers?.length > 3 ? "..." : ""}`

      case "xlsx":
        return `Excel file (${this.formatFileSize(metadata.size)}). Full processing available after upload.`

      default:
        return `File processed (${this.formatFileSize(metadata.size)})`
    }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
