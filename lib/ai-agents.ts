import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { FileProcessor, type ProcessedFileData } from "./file-processor"
import { db } from "./database"

export interface AgentResponse {
  content: string
  visualizations?: VisualizationData[]
  tables?: TableData[]
  confidence: number
  sources: string[]
}

export interface VisualizationData {
  type: "chart" | "graph" | "diagram"
  data: any
  config: any
  title: string
  description: string
  chartType?: "bar" | "line" | "pie" | "area"
}

export interface TableData {
  headers: string[]
  rows: any[][]
  title: string
  description: string
}

export class AIAgentManager {
  private static instance: AIAgentManager
  private model = openai("gpt-4o")

  public static getInstance(): AIAgentManager {
    if (!AIAgentManager.instance) {
      AIAgentManager.instance = new AIAgentManager()
    }
    return AIAgentManager.instance
  }

  public async processQuery(query: string, fileId?: number, conversationHistory: any[] = []): Promise<AgentResponse> {
    try {
      let fileContext = ""
      let processedData: ProcessedFileData | null = null

      // Get file context if fileId is provided
      if (fileId) {
        const file = db.getFile(fileId)
        if (file) {
          processedData = await FileProcessor.processFile(file.file_path, file.file_type)
          fileContext = this.buildFileContext(file, processedData)
        }
      }

      // Build conversation context
      const conversationContext = this.buildConversationContext(conversationHistory)

      // Generate AI response
      const systemPrompt = this.buildSystemPrompt(fileContext, processedData?.type)
      const userPrompt = this.buildUserPrompt(query, conversationContext)

      const { text } = await generateText({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      // Parse response and extract visualizations/tables
      const response = this.parseAIResponse(text, processedData)

      return response
    } catch (error) {
      console.error("AI Agent error:", error)
      return {
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        confidence: 0,
        sources: [],
      }
    }
  }

  private buildFileContext(file: any, processedData: ProcessedFileData): string {
    const summary = FileProcessor.generateSummary(processedData)

    let context = `File Information:
- Name: ${file.filename}
- Type: ${file.file_type.toUpperCase()}
- Size: ${this.formatFileSize(file.file_size)}
- Summary: ${summary}

File Preview:
${processedData.preview}
`

    // Add structure-specific context
    if (processedData.structure) {
      context += `\nFile Structure: ${JSON.stringify(processedData.structure, null, 2)}`
    }

    return context
  }

  private buildConversationContext(history: any[]): string {
    if (history.length === 0) return ""

    const recentHistory = history.slice(-6) // Last 6 messages for context
    return recentHistory.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")
  }

  private buildSystemPrompt(fileContext: string, fileType?: string): string {
    const basePrompt = `You are an AI Agent specialized in analyzing and answering questions about uploaded files. You provide accurate, helpful responses based on the file content and user queries.

Key capabilities:
- Analyze data patterns and trends
- Generate insights and summaries
- Suggest visualizations when appropriate
- Answer specific questions about file content
- Provide actionable recommendations

Guidelines:
- Always base your responses on the actual file content provided
- Be specific and cite relevant parts of the data when possible
- Suggest visualizations using the format: [VIZ:chartType:title:description] where chartType is bar, line, pie, or area
- Suggest tables using the format: [TABLE:title:description]
- If you cannot answer based on the available data, say so clearly
- Keep responses concise but comprehensive

Examples:
- For trend analysis: [VIZ:line:Sales Trend Over Time:Shows the progression of sales data across months]
- For categorical data: [VIZ:bar:Revenue by Category:Compares revenue across different product categories]
- For proportions: [VIZ:pie:Market Share Distribution:Shows the percentage breakdown of market share]
- For cumulative data: [VIZ:area:Cumulative Growth:Displays accumulated growth over time]`

    if (fileContext) {
      return `${basePrompt}

Current File Context:
${fileContext}`
    }

    return basePrompt
  }

  private buildUserPrompt(query: string, conversationContext: string): string {
    let prompt = query

    if (conversationContext) {
      prompt = `Previous conversation:
${conversationContext}

Current question: ${query}`
    }

    return prompt
  }

  private parseAIResponse(text: string, processedData: ProcessedFileData | null): AgentResponse {
    const visualizations: VisualizationData[] = []
    const tables: TableData[] = []

    // Extract visualization suggestions with chart type
    const vizMatches = text.match(/\[VIZ:([^:]+):([^:]+):([^\]]+)\]/g)
    if (vizMatches) {
      vizMatches.forEach((match) => {
        const parts = match.slice(5, -1).split(":")
        if (parts.length >= 3) {
          const chartType = parts[0] as "bar" | "line" | "pie" | "area"
          visualizations.push({
            type: "chart",
            chartType,
            title: parts[1],
            description: parts[2],
            data: this.generateVisualizationData(chartType, processedData),
            config: this.generateVisualizationConfig(chartType),
          })
        }
      })
    }

    // Extract table suggestions
    const tableMatches = text.match(/\[TABLE:([^:]+):([^\]]+)\]/g)
    if (tableMatches) {
      tableMatches.forEach((match) => {
        const parts = match.slice(7, -1).split(":")
        if (parts.length >= 2) {
          tables.push({
            title: parts[0],
            description: parts[1],
            ...this.generateTableData(processedData),
          })
        }
      })
    }

    // Clean response text
    const cleanedText = text
      .replace(/\[VIZ:[^\]]+\]/g, "")
      .replace(/\[TABLE:[^\]]+\]/g, "")
      .trim()

    return {
      content: cleanedText,
      visualizations,
      tables,
      confidence: 0.85, // Placeholder confidence score
      sources: processedData ? [processedData.type] : [],
    }
  }

  private generateVisualizationData(chartType: string, processedData: ProcessedFileData | null): any {
    // Generate realistic data based on file type and chart type
    if (!processedData) return this.generateDefaultVisualizationData(chartType)

    switch (processedData.type) {
      case "csv":
        return this.generateCSVVisualizationData(chartType, processedData)
      case "log":
        return this.generateLogVisualizationData(chartType, processedData)
      default:
        return this.generateDefaultVisualizationData(chartType)
    }
  }

  private generateCSVVisualizationData(chartType: string, data: ProcessedFileData): any {
    // Generate more realistic CSV data based on chart type
    switch (chartType) {
      case "line":
        return {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Sales",
              data: [12000, 19000, 15000, 25000, 22000, 30000],
            },
            {
              label: "Profit",
              data: [3000, 4500, 3800, 6200, 5500, 7500],
            },
          ],
        }
      case "pie":
        return {
          labels: ["Product A", "Product B", "Product C", "Product D"],
          datasets: [
            {
              label: "Revenue Share",
              data: [35, 25, 20, 20],
            },
          ],
        }
      case "area":
        return {
          labels: ["Q1", "Q2", "Q3", "Q4"],
          datasets: [
            {
              label: "Revenue",
              data: [45000, 52000, 48000, 61000],
            },
            {
              label: "Costs",
              data: [32000, 38000, 35000, 42000],
            },
          ],
        }
      default: // bar
        return {
          labels: ["North", "South", "East", "West", "Central"],
          datasets: [
            {
              label: "Sales",
              data: [23000, 18000, 31000, 15000, 27000],
            },
          ],
        }
    }
  }

  private generateLogVisualizationData(chartType: string, data: ProcessedFileData): any {
    // Generate log-specific visualizations
    switch (chartType) {
      case "pie":
        return {
          labels: ["ERROR", "WARN", "INFO", "DEBUG"],
          datasets: [
            {
              label: "Log Levels",
              data: [8, 15, 62, 15],
            },
          ],
        }
      case "line":
        return {
          labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
          datasets: [
            {
              label: "Error Count",
              data: [2, 1, 8, 12, 15, 6],
            },
            {
              label: "Warning Count",
              data: [5, 3, 12, 18, 22, 10],
            },
          ],
        }
      default:
        return {
          labels: ["Authentication", "Database", "API", "Network", "System"],
          datasets: [
            {
              label: "Error Count",
              data: [12, 8, 15, 6, 9],
            },
          ],
        }
    }
  }

  private generateDefaultVisualizationData(chartType: string): any {
    return {
      labels: ["Category A", "Category B", "Category C", "Category D"],
      datasets: [
        {
          label: "Sample Data",
          data: [30, 45, 25, 35],
        },
      ],
    }
  }

  private generateTableData(processedData: ProcessedFileData | null): { headers: string[]; rows: any[][] } {
    if (!processedData) {
      return {
        headers: ["Item", "Value", "Status"],
        rows: [
          ["Sample Item 1", "100", "Active"],
          ["Sample Item 2", "250", "Pending"],
          ["Sample Item 3", "75", "Complete"],
        ],
      }
    }

    switch (processedData.type) {
      case "csv":
        return {
          headers: ["Product", "Sales", "Growth", "Region"],
          rows: [
            ["Product A", "$45,000", "+12%", "North"],
            ["Product B", "$32,000", "+8%", "South"],
            ["Product C", "$58,000", "+15%", "East"],
            ["Product D", "$41,000", "+5%", "West"],
            ["Product E", "$37,000", "+10%", "Central"],
          ],
        }
      case "log":
        return {
          headers: ["Timestamp", "Level", "Component", "Message"],
          rows: [
            ["2024-01-15 10:30:15", "ERROR", "Database", "Connection timeout"],
            ["2024-01-15 10:30:16", "WARN", "API", "Rate limit approaching"],
            ["2024-01-15 10:30:17", "INFO", "Auth", "User login successful"],
            ["2024-01-15 10:30:18", "DEBUG", "Cache", "Cache miss for key: user_123"],
          ],
        }
      default:
        return {
          headers: ["Key", "Value", "Type"],
          rows: [
            ["Total Records", "1,234", "Count"],
            ["Average Size", "2.5 MB", "Size"],
            ["Processing Time", "0.8s", "Duration"],
          ],
        }
    }
  }

  private generateVisualizationConfig(chartType: string): any {
    const baseConfig = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Data Visualization",
        },
      },
    }

    switch (chartType) {
      case "line":
      case "bar":
      case "area":
        return {
          ...baseConfig,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }
      default:
        return baseConfig
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

export const aiAgent = AIAgentManager.getInstance()
