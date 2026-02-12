"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: {
    month: string;
    현재유지: number;
    전략실행: number;
  }[];
};

export default function LoanChart({ data }: Props) {
  return (
    <div style={{ width: "100%", height: 400, marginTop: 40 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />
          <Line type="monotone" dataKey="현재유지" stroke="#ef4444" />
          <Line type="monotone" dataKey="전략실행" stroke="#2563eb" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
