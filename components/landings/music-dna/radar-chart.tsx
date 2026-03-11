import { buildRadarPath, buildRadarPolygon, polarPoint, type RadarAxis } from "@/lib/music-dna"

interface RadarChartProps {
  axes: RadarAxis[]
}

export function RadarChart({ axes }: RadarChartProps) {
  return (
    <svg viewBox="0 0 360 360" className="h-auto w-full">
      <circle cx="180" cy="180" r="94" fill="none" stroke="#8f735b" strokeWidth="1.6" />
      <circle cx="180" cy="180" r="62" fill="none" stroke="#a18269" strokeWidth="1.2" />

      {axes.map((axis, index) => {
        const edge = polarPoint(index, axes.length, 128, 180)
        const label = polarPoint(index, axes.length, 154, 180)
        const labelY = label.y + (label.y < 80 ? -4 : label.y > 280 ? 6 : 0)
        const labelX = label.x + (label.x < 80 ? -4 : label.x > 280 ? 4 : 0)

        return (
          <g key={axis.key}>
            <line x1={180} y1={180} x2={edge.x} y2={edge.y} stroke="#7b624e" strokeWidth="1.1" />
            <rect x={labelX - 34} y={labelY - 11} width={68} height={22} rx={10} fill="rgba(248,236,214,0.85)" />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="800"
              fill="#3f2b20"
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
        stroke="#b39a80"
        strokeWidth="1"
      />
      <path d={buildRadarPath(axes, 128, 180)} fill="rgba(79,132,201,0.2)" stroke="#2d5f9f" strokeWidth="3" />

      {axes.map((axis, index) => {
        const point = polarPoint(index, axes.length, 128 * axis.value, 180)
        return <circle key={`${axis.key}-dot`} cx={point.x} cy={point.y} r="6" fill="#f0bf29" stroke="#7d4f2a" strokeWidth="2" />
      })}
    </svg>
  )
}
