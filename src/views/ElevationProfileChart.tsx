import type { Hike } from '../state/types'
import { computeElevationProfileGeometry } from '../gpx/elevationProfile'
import { useTranslation } from '../i18n/LanguageContext'
import './ElevationProfileChart.css'

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 220
const PADDING = 24

export default function ElevationProfileChart({ hike }: { hike: Hike }) {
  const { t } = useTranslation()
  const geometry = computeElevationProfileGeometry(hike)

  if (!geometry.hasElevation) {
    return <div className="elevation-chart-empty">{t('elevationChart.empty')}</div>
  }

  const innerWidth = VIEW_WIDTH - 2 * PADDING
  const innerHeight = VIEW_HEIGHT - 2 * PADDING
  const elevRange = Math.max(1, geometry.maxElevation - geometry.minElevation)

  const toX = (distance: number) => PADDING + (distance / geometry.totalDistance) * innerWidth
  const toY = (elevation: number) =>
    PADDING + innerHeight - ((elevation - geometry.minElevation) / elevRange) * innerHeight

  const polylinePoints = geometry.points.map((p) => `${toX(p.distance)},${toY(p.elevation)}`).join(' ')

  return (
    <div className="elevation-chart">
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        <polyline points={polylinePoints} className="elevation-chart-line" />
        {geometry.boundaries.map((b, i) => {
          const x = toX(b.distance)
          return (
            <g key={i}>
              <line x1={x} y1={PADDING} x2={x} y2={PADDING + innerHeight} className="elevation-chart-boundary" />
              <text x={x} y={PADDING - 6} className="elevation-chart-label" textAnchor="middle">
                {b.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="elevation-chart-summary">
        {t('common.elevationSummary', { gain: Math.round(geometry.totalGain), loss: Math.round(geometry.totalLoss) })}
      </p>
    </div>
  )
}
