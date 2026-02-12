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

export default function SimulationChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div>차트 데이터 없음</div>;
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="cumulativeCurrent"
            stroke="#8884d8"
            name="기존 유지"
          />
          <Line
            type="monotone"
            dataKey="cumulativeNew"
            stroke="#82ca9d"
            name="전략 실행"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
