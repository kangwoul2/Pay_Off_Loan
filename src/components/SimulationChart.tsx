"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Props {
  data: any[];
}

const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff4d4f"];

export default function SimulationChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div>차트 데이터 없음</div>;
  }

  // month를 제외한 나머지 key = 전략들
  const strategyKeys = Object.keys(data[0]).filter(
    (key) => key !== "month"
  );

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />

          {strategyKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              name={key}
              strokeWidth={3}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
