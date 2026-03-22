import { buildRadarPath, buildRadarPolygon, polarPoint, type RadarAxis } from "@/lib/music-dna"

interface RadarChartProps {
  axes: RadarAxis[]
}

export function RadarChart({ axes }: RadarChartProps) {
  return (
    <svg viewBox="0 0 360 360" className="h-auto w-full">
      <circle cx="180" cy="180" r="94" fill="none" stroke="rgba(0,240,255,0.42)" strokeWidth="1.4" />
      <circle cx="180" cy="180" r="62" fill="none" stroke="rgba(255,67,248,0.34)" strokeWidth="1.1" />

      {axes.map((axis, index) => {
        const edge = polarPoint(index, axes.length, 128, 180)
        const label = polarPoint(index, axes.length, 154, 180)
        const labelY = label.y + (label.y < 80 ? -4 : label.y > 280 ? 6 : 0)
        const labelX = label.x + (label.x < 80 ? -4 : label.x > 280 ? 4 : 0)

        return (
          <g key={axis.key}>
            <line x1={180} y1={180} x2={edge.x} y2={edge.y} stroke="rgba(173,233,255,0.34)" strokeWidth="1" />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="800"
              fill="#dff7ff"
            >
              {axis.label.toUpperCase()}
            </text>
          </g>
        )
      })}

      <polygon
        points={buildRadarPolygon(
          axes.map((axis) => ({ ...axis, value: 1 })),
          128,
          180
        )}
        fill="none"
        stroke="rgba(255,230,0,0.36)"
        strokeWidth="1"
      />
      <path d={buildRadarPath(axes, 128, 180)} fill="rgba(0,240,255,0.18)" stroke="#00f0ff" strokeWidth="3" />

      {axes.map((axis, index) => {
        const point = polarPoint(index, axes.length, 128 * axis.value, 180)
        return <circle key={`${axis.key}-dot`} cx={point.x} cy={point.y} r="6" fill="#ff43f8" stroke="#00f0ff" strokeWidth="1.8" />
      })}
    </svg>
  )
}
