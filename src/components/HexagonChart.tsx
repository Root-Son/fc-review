"use client";

import { FEEL_STAT_LABELS } from "@/lib/types";

interface HexagonChartProps {
  stats: Record<string, number>;
  size?: number;
}

const STAT_KEYS = [
  "shooting_feel",
  "physical_feel",
  "pass_accuracy_feel",
  "weak_foot_feel",
  "skill_move_feel",
  "overall_feel",
];

export default function HexagonChart({
  stats,
  size = 280,
}: HexagonChartProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const labelRadius = size * 0.48;
  const n = STAT_KEYS.length;

  function getPoint(index: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 10) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  function getLabelPos(index: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return [
      center + labelRadius * Math.cos(angle),
      center + labelRadius * Math.sin(angle),
    ];
  }

  // 배경 그리드 (2, 4, 6, 8, 10)
  const gridLevels = [2, 4, 6, 8, 10];
  const gridPaths = gridLevels.map((level) => {
    const points = Array.from({ length: n }, (_, i) => getPoint(i, level));
    return points.map((p) => p.join(",")).join(" ");
  });

  // 데이터 폴리곤
  const dataPoints = STAT_KEYS.map((key, i) =>
    getPoint(i, stats[key] || 0)
  );
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  // 축선
  const axisLines = Array.from({ length: n }, (_, i) => ({
    x1: center,
    y1: center,
    x2: getPoint(i, 10)[0],
    y2: getPoint(i, 10)[1],
  }));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 그리드 */}
        {gridPaths.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#334155"
            strokeWidth={i === gridLevels.length - 1 ? 1.5 : 0.5}
            opacity={0.5}
          />
        ))}

        {/* 축선 */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            {...line}
            stroke="#334155"
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {/* 데이터 영역 */}
        <polygon
          points={dataPath}
          fill="rgba(59, 130, 246, 0.25)"
          stroke="#3B82F6"
          strokeWidth={2}
        />

        {/* 데이터 포인트 */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#3B82F6" />
        ))}

        {/* 라벨 */}
        {STAT_KEYS.map((key, i) => {
          const [x, y] = getLabelPos(i);
          const value = stats[key] || 0;
          return (
            <g key={key}>
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-300 text-[11px] font-medium"
              >
                {FEEL_STAT_LABELS[key]}
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-blue-400 text-[13px] font-bold"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
