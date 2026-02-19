import {  useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react"
import { api } from "../lib/api"

function pct(x: number) {
    return `${Math.round(x*100)}%`;
}
export default function AnalyticsPage () {
    const [range, setRange] = useState<"7d"|"30d"|"90d">("30d");

    const {data, isLoading, error} = useQuery({
        queryKey: ["stats-overview", range],
        queryFn: () => api.statsOverview(range),
    });

    const rows = useMemo(() => {
        if (!data) return [];

        return [...data.habits].sort((a,b) => {
            if (b.completion_rate !== a.completion_rate) return b.completion_rate - a.completion_rate;
            return b.best_streak - a.best_streak;
        });
    }, [data])

    if (isLoading) return <div>Loading analytics...</div>
    if (error) return <div style={{ color: "crimson" }}>Couldn't load analytics.</div>
    if (!data) return <div>No data.</div>

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0 }}>Analytics</h2>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>Range:</span>
                    <select value={range} onChange={e => setRange(e.target.value as any)}>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
            </div>
            
            <div style={{fontSize: 13, opacity: 0.8}}>
                {data.start_date} → {data.end_date}
            </div>

            {/* Overview cards */}
            <div style={{ display: "grid", 
                gap: 10, 
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" 
                }}>
                    <Card title="Overall completion" value={pct(data.overall_completion_rate)} />
                    <Card title="Active habits" value={String(data.active_habits)} />
                    <Card title="Total check-ins" value={String(data.total_checkins)} />
            </div>

            {/* Habit table */}
            <div style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                background: "white",
                overflow: "hidden",}}>
                <div style={{ padding: 12, fontWeight: 800}}>Per-habit</div>
                <div style={{overflowX: "auto"}}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
                                <Th>Habit</Th>
                                <Th>Goal</Th>
                                <Th>Done</Th>
                                <Th>Rate</Th>
                                <Th>Streak</Th>
                                <Th>Best</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((h) => (
                                <tr key={h.habit_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <Td>
                                        <div style={{fontWeight: 700}}>{h.name}</div>
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>#{h.habit_id}</div>
                                    </Td>
                                    <Td>{h.goal_type === "DAILY"
                                        ? "Daily" 
                                        : `${h.target_per_period} per week`}
                                    </Td>
                                    <Td>{h.completion_count}</Td>
                                    <Td>{pct(h.completion_rate)}</Td>
                                    <Td>{h.current_streak}</Td>
                                    <Td>{h.best_streak}</Td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <Td colSpan={6}>
                                        <div style={{ padding: 12, opacity: 0.8}}>No habits yet.</div>
                                    </Td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
                Note: overall completion rate reflects daily habits (weekly habits show per-habit weekly rate).
            </div>
        </div>
    );
}

function Card({ title, value }: {title: string, value: string }) {
    return (
        <div 
        style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 12, 
            background: "white",
        }}>
            <div style={{ fontSize: 13, opacity: 0.8}}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6}}>{value}</div>
        </div>
    );
}

function Th({children}: { children: React.ReactNode}) {
    return <th style={{padding: 10, fontSize: 12, opacity: 0.8}}>{children}</th>
}

function Td({children, colSpan}: { children: React.ReactNode, colSpan?: number}) {
    return <td colSpan={colSpan} style={{ padding: 10, verticalAlign: "top"}}>{children}</td>;
}