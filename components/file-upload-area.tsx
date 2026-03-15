"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  id?: number
  name: string
  size: number
  type: string
  status: "uploading" | "completed" | "error"
  progress: number
  error?: string
}

interface FileFromAPI {
  id: number
  filename: string
  fileType: string
  size: number
  uploadDate: string
}

export function FileUploadArea() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [existingFiles, setExistingFiles] = useState<FileFromAPI[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()

  // Load existing files on component mount
  useEffect(() => {
    fetchExistingFiles()
  }, [])

  const fetchExistingFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setExistingFiles(data.files)
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }, [])

  const handleFiles = async (fileList: File[]) => {
    const validTypes = ["log", "csv", "xlsx", "txt"]
    const maxSize = 200 * 1024 * 1024 // 200MB

    // Validate files first
    const validFiles: File[] = []
    for (const file of fileList) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      if (!fileExtension || !validTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload .log, .csv, .xlsx, or .txt files.`,
          variant: "destructive",
        })
        continue
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 200MB limit.`,
          variant: "destructive",
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Add files to upload queue
    const uploadFiles: UploadedFile[] = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: "." + file.name.split(".").pop()?.toLowerCase(),
      status: "uploading",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])

    // Upload files
    await uploadFiles(validFiles, uploadFiles)
  }

  const uploadFiles = async (fileList: File[], uploadFiles: UploadedFile[]) => {
    const formData = new FormData()
    fileList.forEach((file) => {
      formData.append("files", file)
    })

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (uploadFiles.some((uf) => uf.name === f.name) && f.status === "uploading") {
              const newProgress = Math.min(f.progress + Math.random() * 20, 90)
              return { ...f, progress: newProgress }
            }
            return f
          }),
        )
      }, 300)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (response.ok) {
        const data = await response.json()

        // Update file statuses based on results
        setFiles((prev) =>
          prev.map((f) => {
            const result = data.results.find((r: any) => r.filename === f.name)
            if (result) {
              return {
                ...f,
                id: result.id,
                status: result.success ? "completed" : "error",
                progress: 100,
                error: result.error,
              }
            }
            return f
          }),
        )

        // Show success/error messages
        data.results.forEach((result: any) => {
          if (result.success) {
            toast({
              title: "Upload completed",
              description: `${result.filename} has been successfully uploaded and is ready for analysis.`,
            })
          } else {
            toast({
              title: "Upload failed",
              description: `${result.filename}: ${result.error}`,
              variant: "destructive",
            })
          }
        })

        // Refresh existing files list
        fetchExistingFiles()
      } else {
        // Handle upload error
        setFiles((prev) =>
          prev.map((f) => {
            if (uploadFiles.some((uf) => uf.name === f.name)) {
              return { ...f, status: "error", progress: 100, error: "Upload failed" }
            }
            return f
          }),
        )

        toast({
          title: "Upload failed",
          description: "There was an error uploading your files. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      setFiles((prev) =>
        prev.map((f) => {
          if (uploadFiles.some((uf) => uf.name === f.name)) {
            return { ...f, status: "error", progress: 100, error: "Network error" }
          }
          return f
        }),
      )

      toast({
        title: "Upload failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      })
    }
  }

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="p-4 border-b border-border">
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          isDragOver ? "border-primary bg-primary/5 nvidia-glow" : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Files for Analysis</h3>
            <p className="text-muted-foreground mb-4">Drag and drop your files here, or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports: .log, .csv, .xlsx, .txt files (max 200MB each)
            </p>

            <input
              type="file"
              multiple
              accept=".log,.csv,.xlsx,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button className="nvidia-gradient hover:opacity-90 transition-opacity">Choose Files</Button>
            </label>
          </div>

          {/* Current Upload Queue */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Uploading Files</h4>
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    {file.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : file.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <FileText className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:text-destructive"
                        onClick={() => removeFile(file.name)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.size)}</span>
                      {file.error && (
                        <>
                          <span>•</span>
                          <span className="text-destructive">{file.error}</span>
                        </>
                      )}
                    </div>

                    {file.status === "uploading" && <Progress value={file.progress} className="mt-2 h-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Previously Uploaded Files</h4>
              {existingFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.fileType.toUpperCase()}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.uploadDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
