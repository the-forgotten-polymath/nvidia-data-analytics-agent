"use client"

import { Card } from "@/components/ui/card"
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface ChartRendererProps {
  visualization: {
    type: "chart" | "graph" | "diagram"
    data: any
    config: any
    title: string
    description: string
    chartType?: "bar" | "line" | "pie" | "area"
  }
}

const NVIDIA_COLORS = [
  "#76B900", // NVIDIA Green
  "#5A8F00", // Darker Green
  "#A9ACB6", // Gray
  "#FFFFFF", // White
  "#48CAE4", // Light Blue
  "#F72585", // Pink
  "#4CC9F0", // Blue
  "#7209B7", // Purple
]

export function ChartRenderer({ visualization }: ChartRendererProps) {
  const { type, data, config, title, description, chartType = "bar" } = visualization

  const getChartIcon = () => {
    switch (chartType) {
      case "line":
        return <TrendingUp className="w-4 h-4 text-primary" />
      case "pie":
        return <PieChart className="w-4 h-4 text-primary" />
      case "area":
        return <Activity className="w-4 h-4 text-primary" />
      default:
        return <BarChart3 className="w-4 h-4 text-primary" />
    }
  }

  const renderChart = () => {
    if (!data || !data.labels || !data.datasets) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>No data available for visualization</p>
        </div>
      )
    }

    // Transform data for Recharts format
    const chartData = data.labels.map((label: string, index: number) => {
      const dataPoint: any = { name: label }
      data.datasets.forEach((dataset: any, datasetIndex: number) => {
        dataPoint[dataset.label || `Dataset ${datasetIndex + 1}`] = dataset.data[index] || 0
      })
      return dataPoint
    })

    const commonProps = {
      width: "100%",
      height: 300,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#A9ACB6" />
              <YAxis stroke="#A9ACB6" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={dataset.label || `Dataset ${index + 1}`}
                  stroke={NVIDIA_COLORS[index % NVIDIA_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: NVIDIA_COLORS[index % NVIDIA_COLORS.length], strokeWidth: 2, r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        // Transform data for pie chart
        const pieData = data.labels.map((label: string, index: number) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0,
        }))

        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <RechartsPieChart
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={NVIDIA_COLORS[index % NVIDIA_COLORS.length]} />
                ))}
              </RechartsPieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#A9ACB6" />
              <YAxis stroke="#A9ACB6" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={dataset.label || `Dataset ${index + 1}`}
                  stackId="1"
                  stroke={NVIDIA_COLORS[index % NVIDIA_COLORS.length]}
                  fill={NVIDIA_COLORS[index % NVIDIA_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      default: // bar chart
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#A9ACB6" />
              <YAxis stroke="#A9ACB6" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
              <Legend />
              {data.datasets.map((dataset: any, index: number) => (
                <Bar
                  key={index}
                  dataKey={dataset.label || `Dataset ${index + 1}`}
                  fill={NVIDIA_COLORS[index % NVIDIA_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <Card className="p-4 bg-muted border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        {getChartIcon()}
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <div className="bg-background rounded-lg p-4">{renderChart()}</div>
    </Card>
  )
}
