/**
 * Shared data types for all chart components.
 * Charts receive typed data props; D3 scale/shape modules handle computation.
 */

export interface ChartMargin {
  top: number
  right: number
  bottom: number
  left: number
}

export const DEFAULT_MARGIN: ChartMargin = { top: 16, right: 16, bottom: 40, left: 48 }

/** A single [x, y] data point for line/area/scatter charts */
export interface DataPoint {
  x: number | string | Date
  y: number
  /** Optional label shown in tooltip */
  label?: string
}

/** One named series containing an array of data points */
export interface SeriesData {
  key: string
  /** Human-readable series name shown in legend / tooltip */
  name?: string
  data: DataPoint[]
  /** Override the auto-assigned series color (CSS variable index 1-6) */
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
}

/** Category-value pair used in BarChart, PieChart, FunnelChart, etc. */
export interface CategoryValue {
  category: string
  value: number
  /** Optional label override for display */
  label?: string
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
}

/** Named stacked category row (for stacked bar, waterfall) */
export interface StackedCategoryValue {
  category: string
  /** Keyed sub-values to stack */
  values: Record<string, number>
}

/** Cell value for heatmap / calendar heatmap */
export interface HeatCell {
  x: string | number
  y: string | number
  value: number
}

/** Calendar heatmap entry — one value per ISO date string */
export interface CalendarEntry {
  date: string
  value: number
}

/** Node in a hierarchical dataset (Treemap, Sunburst) */
export interface HierarchyDatum {
  name: string
  value?: number
  children?: HierarchyDatum[]
}

/** Sankey node */
export interface SankeyNode {
  id: string
  name: string
}

/** Sankey link */
export interface SankeyLink {
  source: string
  target: string
  value: number
}

/** Force-directed graph node */
export interface GraphNode {
  id: string
  label?: string
  group?: string | number
  value?: number
}

/** Force-directed graph edge */
export interface GraphEdge {
  source: string
  target: string
  value?: number
}

/** Common chart dimensions computed by useChartDimensions */
export interface ChartDimensions {
  width: number
  height: number
  innerWidth: number
  innerHeight: number
  margin: ChartMargin
}

/** Tooltip position and content */
export interface TooltipState {
  visible: boolean
  x: number
  y: number
  title?: string
  items: Array<{ label: string; value: string | number; colorIndex?: number }>
}
