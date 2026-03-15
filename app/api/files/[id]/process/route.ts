import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { FileProcessor } from "@/lib/file-processor"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fileId = Number.parseInt(params.id)
    const file = db.getFile(fileId)

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Process the file
    const processedData = await FileProcessor.processFile(file.file_path, file.file_type)
    const summary = FileProcessor.generateSummary(processedData)

    return NextResponse.json({
      file: {
        id: file.id,
        filename: file.filename,
        type: file.file_type,
        size: file.file_size,
      },
      processedData,
      summary,
    })
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}
