import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { gradeToTheme } from '../utils/grading'

const CHART_MARGIN = { top: 12, right: 6, left: 0, bottom: 24 }

function wrapTickLabel(rawLabel) {
  const text = String(rawLabel ?? '').trim()
  if (!text) return ['']

  const words = text.split(/\s+/)
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const next = currentLine ? `${currentLine} ${word}` : word
    if (next.length <= 14) {
      currentLine = next
      return
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = word
      return
    }

    lines.push(word.slice(0, 14))
    currentLine = ''
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  if (lines.length <= 3) return lines

  const collapsed = lines.slice(0, 2)
  const third = lines.slice(2).join(' ')
  collapsed.push(third.length > 16 ? `${third.slice(0, 14)}..` : third)
  return collapsed
}

function SubjectTick({ x, y, payload }) {
  const lines = wrapTickLabel(payload?.value)

  return (
    <text x={x} y={y + 6} textAnchor="middle" fill="#94a3b8" fontSize="11">
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 10 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function GradeBarChart({ chartData }) {
  const [showRails, setShowRails] = useState(true)
  if (!chartData.length) return null

  const highestSubject = chartData.reduce((best, current) =>
    current.totalMarks > best.totalMarks ? current : best,
  )

  const lowestSubject = chartData.reduce((worst, current) =>
    current.totalMarks < worst.totalMarks ? current : worst,
  )

  const gradeGuides = [
    { grade: 'S', mark: 135 },
    { grade: 'A+', mark: 127.5 },
    { grade: 'A', mark: 120 },
    { grade: 'B+', mark: 112.5 },
    { grade: 'B', mark: 105 },
    { grade: 'C+', mark: 97.5 },
    { grade: 'C', mark: 90 },
    { grade: 'D', mark: 82.5 },
    { grade: 'P', mark: 75 },
    { grade: 'F', mark: 0 },
  ].map((item) => ({
    ...item,
    color: gradeToTheme(item.grade).chart,
  }))

  const renderedGuides = gradeGuides.filter((guide) => guide.mark > 0)

  return (
    <div className="rounded-2xl border-[0.5px] border-teal-400/35 bg-gradient-to-br from-slate-900/90 via-slate-900/86 to-teal-900/14 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-100 sm:text-lg">Performance tab</p>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Subject totals out of 150 with grade guides from S to F.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <p className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-300">
            Highest: <span className="font-semibold text-emerald-300">{highestSubject.name}</span>
          </p>
          <p className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-300">
            Lowest: <span className="font-semibold text-amber-300">{lowestSubject.name}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowRails((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-200 transition hover:bg-teal-500/20"
            aria-pressed={showRails}
            aria-label="Toggle grade guide lines"
          >
            <span className="text-teal-100">Grade Guides</span>
            <span
              className={`relative inline-flex h-4 w-7 rounded-full transition ${
                showRails ? 'bg-teal-500/80' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
                  showRails ? 'left-3.5' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {gradeGuides.map((guide) => (
          <span
            key={guide.grade}
            className="rounded-full border px-2 py-0.5 text-[10px] text-slate-200"
            style={{ borderColor: `${guide.color}66`, backgroundColor: `${guide.color}1A` }}
          >
            {guide.grade} {guide.mark}
          </span>
        ))}
      </div>

      <div className="relative h-[280px] w-full min-w-0 sm:h-[320px]">
        <div className="pointer-events-none absolute left-[44px] right-[8px] top-[12px] bottom-[40px] z-0">
          {renderedGuides.map((guide) => (
            <div
              key={`bg-guide-${guide.grade}`}
              className="absolute left-0 right-0"
              style={{
                top: `${100 - (guide.mark / 150) * 100}%`,
                borderTop: `1.35px dashed ${guide.color}`,
                opacity: showRails ? (guide.grade === 'F' ? 0.55 : 0.72) : 0,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 h-full w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={260}>
            <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="12%">
            <defs>
              <filter id="chartBarGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={12}
              tickMargin={8}
              interval={0}
              tick={<SubjectTick />}
            />
            <YAxis domain={[0, 150]} stroke="#94a3b8" fontSize={12} />

            <Tooltip
              cursor={false}
              contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#5eead4', fontWeight: 700 }}
              formatter={(value, _name, series) => {
                if (series?.dataKey === 'totalMarks') {
                  return [`${Number(value).toFixed(1)} / 150`, 'Total marks']
                }

                return [value, series?.name ?? 'Value']
              }}
              labelFormatter={(_label, payload) => {
                if (!payload?.length) return ''
                const item = payload[0].payload
                return `${item.name} | ${item.internalRaw}/50 + ${item.externalRaw}/100 | Grade ${item.grade}`
              }}
            />

            <Bar
              dataKey="totalMarks"
              name="Total marks"
              radius={[10, 10, 0, 0]}
              activeBar={{
                filter: 'url(#chartBarGlow)',
                stroke: '#cffafe',
                strokeWidth: 1.5,
              }}
            >
              {chartData.map((entry) => (
                <Cell key={`bar-${entry.id}`} fill={gradeToTheme(entry.grade).chart} />
              ))}
            </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default GradeBarChart
