"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TableRendererProps {
  table: {
    headers: string[]
    rows: any[][]
    title: string
    description: string
  }
}

export function TableRenderer({ table }: TableRendererProps) {
  const { headers, rows, title, description } = table

  const exportToCSV = () => {
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${title.replace(/\s+/g, "_").toLowerCase()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="p-4 bg-muted border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Filter className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={exportToCSV}>
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>

      <div className="bg-background rounded-lg border">
        <ScrollArea className="h-64">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-sm text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Showing {rows.length} rows • {headers.length} columns
      </div>
    </Card>
  )
}
