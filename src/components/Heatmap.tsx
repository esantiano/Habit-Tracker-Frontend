import { useMemo, useState } from "react";

type HeatmapDay = { date: string; count: number }

function parseISODate(d: string) {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
}

function dayOfWeekSunday0(dt: Date) {
    return dt.getDay();
}
function formatTooltip(dateStr: string, count: number) {
    const dt = parseISODate(dateStr);
    const pretty = dt.toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"});
    const noun = count === 1 ? "check-in" : "check-ins";
    return `${count} ${noun} on ${pretty}`;
}

function levelFromCount(count: number, max: number) {
    if (count <= 0) return 0;
    if (max <=1) return 4;

    const r = count / max;
    if (r <= 0.25) return 1;
    if (r <= 0.50) return 2;
    if (r <= 0.75) return 3;
    return 4
}

export default function Heatmap({ days }: {days: HeatmapDay[]}) {
    const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

    const {weeks, monthLabels, maxCount} = useMemo(() => {
        if (!days.length) return {weeks: [] as HeatmapDay[][], monthLabels: [] as { idx: number; label: string }[], maxCount: 0};

        const max = Math.max(...days.map((d) => d.count));

        const first = parseISODate(days[0].date);
        const padLeft = dayOfWeekSunday0(first);

        const cells: (HeatmapDay | null)[] = [];
        for (let i = 0; i < padLeft; i++) {
            cells.push(null);
        }
        for (const d of days) cells.push(d);

        const weeksArr: HeatmapDay[][] = [];
        const monthMarks: { idx: number; label: string }[] = [];

        for (let i = 0 ; i < cells.length; i += 7) {
            const weekCells = cells.slice(i, i + 7);

            const week: HeatmapDay[] = weekCells.map((c) => c || {date: "", count: 0});
            weeksArr.push(week);

            const firstNonEmpty = weekCells.find((c) => c && c.date) as HeatmapDay | undefined;
            if (firstNonEmpty) {
                const dt = parseISODate(firstNonEmpty.date);
                const label = dt.toLocaleDateString(undefined, { month: "short"});

                const prev = monthMarks[monthMarks.length - 1];
                if (!prev || prev.label !== label) {
                    monthMarks.push({ idx: weeksArr.length - 1, label });
                }
            }
        }
        return { weeks: weeksArr, monthLabels: monthMarks, maxCount: max };
    }, [days]);

    const levelColor = (lvl: number) => {
        const colors = ["#ebedf0", "#FDB777", "#FDA766", "#FD9346", "#FD7F2C"];
        return colors[lvl] || colors[0];
    };

    const cellSize = 12;
    const gap = 3

    return (
        <div
        style={
            {
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                background: "white",
                padding: 12,
            }
        }>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Heatmap (check-ins)</div>    

            <div style={{ marginLeft: 28, display: "flex", gap: gap, marginBottom: 6}}>
                {weeks.map((_, idx) => {
                    const mark = monthLabels.find((m) => m.idx === idx);
                    return (
                        <div key={idx} 
                        style={{
                            width: cellSize,
                            fontSize: 11,
                            color: "#666",
                            marginLeft: 5
                        }}>
                            {mark ? mark.label : ""}
                        </div>
                    );
                })}
        </div>

        <div style = {{ display: "flex", gap }}>
            <div style = {{ width: 28, display: "grid", gridTemplateRows: `repeat(7, ${cellSize}px)`, gap}}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#666", lineHeight: `${cellSize}px`}}>
                        {label}
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap}}>
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} style={{ display: "grid", gridTemplateRows: `repeat(7, ${cellSize}px)`, gap, width: "2%" }}>
                        {week.map((d, rIdx) => {
                            const isEmpty = !d.date;
                            const lvl = isEmpty ? 0 : levelFromCount(d.count, maxCount);
                            const bg = levelColor(lvl);

                            return (
                                <div key={`${wIdx}-${rIdx}`}
                                onMouseEnter={(e) => {
                                    if (isEmpty) return;
                                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                                    setHover({
                                        x: rect.left + rect.width/2,
                                        y: rect.top, 
                                        text: formatTooltip(d.date, d.count),
                                    });
                                }}
                                onMouseLeave={() => setHover(null)}
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                    borderRadius: 2,
                                    background: bg,
                                    border: "1px solid rgba(27,31,35,0.06)",
                                    cursor: isEmpty ? "default" :"pointer",
                                }}
                                />
                            );
                        })}
                    </div>
                    ))}
                </div>
            </div>
            {hover && (
                <div 
                style={{
                    position: "fixed",
                    left: hover.x,
                    top: hover.y - 10,
                    transform: "translate(-50%, -100%)",
                    background: "#24292f",
                    color: "white",
                    padding: "6px 8px",
                    borderRadius: 6,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    zIndex: 9999,
                    width: 300,
                }}>
                    {hover.text}
                </div>
            )}
        </div>   
    );
}