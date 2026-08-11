import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "0 12px 30px -12px oklch(0.22 0.05 265 / 0.28)",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
};

export const RISK_COLORS = ["var(--success)", "var(--warning)", "var(--highrisk)", "var(--critical)"];

export function RiskDonut({
  data,
  height = 260,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="86%"
          paddingAngle={3}
          stroke="var(--card)"
          strokeWidth={3}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={RISK_COLORS[i % RISK_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RiskTrendChart({
  data,
  height = 300,
}: {
  data: readonly { period: string; high: number; medium: number; low: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={[...data]} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {[
            ["low", "var(--success)"],
            ["medium", "var(--warning)"],
            ["high", "var(--highrisk)"],
          ].map(([key, color]) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="period" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area
          type="monotone"
          dataKey="low"
          name="Low Risk"
          stroke="var(--success)"
          fill="url(#grad-low)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="medium"
          name="Medium Risk"
          stroke="var(--warning)"
          fill="url(#grad-medium)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="high"
          name="High Risk"
          stroke="var(--highrisk)"
          fill="url(#grad-high)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FactorBarChart({
  data,
  height = 280,
  dataKey = "impact",
  labelKey = "factor",
  color = "var(--primary)",
}: {
  data: Record<string, string | number>[];
  height?: number;
  dataKey?: string;
  labelKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey={labelKey} width={150} {...axisProps} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Impact"]} />
        <Bar dataKey={dataKey} radius={[6, 6, 6, 6]} barSize={16} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  bars,
  height = 300,
  unit = "",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; name: string; color: string }[];
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}${unit}`, ""]} />
        {bars.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[6, 6, 0, 0]} barSize={26} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({
  data,
  xKey,
  series,
  height = 280,
  domain,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  height?: number;
  domain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`line-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} domain={domain ?? ["auto", "auto"]} />
        <Tooltip {...tooltipStyle} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#line-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
