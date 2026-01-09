import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api"

export default function DashboardPage() {
    const qc = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard-today"],
        queryFn: api.dashboardToday,
    });

    const logMutation = useMutation({
        mutationFn: ({habitId, date}: {habitId: number; date: string }) => 
            api.createHabitLog(habitId, {date, value: 1 }),
        onSuccess: async () => {
            await qc.invalidateQueries({queryKey: ["dashboard-today"] });
        },
    });

    if (isLoading) return <div>Loading dashboard...</div>;
    if (error) return <pre style={{ color: "crimson", whiteSpace: "pre-wrap"}}>{String(error)}</pre>;
    if (!data) return <div>No data</div>

    return (
        <div>
            <h2>Today</h2>
            <div style={{ opacity: 0.8, marginBottom: 12}}>{data.date}</div>
            <div style={{ display: "grid", gap: 10 }}>
                {data.habits.map((item) => (
                    <div
                        key={item.habit.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 12
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700}}>{item.habit.name}</div>
                            {item.habit.description && (
                                <div style={{ opacity: 0.8, fontSize: 14}}>{item.habit.description}</div>
                            )}
                            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6}}>
                                Streak: {item.current_streak} (best {item.best_streak})
                            </div>
                        </div>
                        
                        {item.is_completed ? (
                            <span style={{ fontWeight: 700}}>✅ Done</span>
                        ) : ( 
                            <button
                                onClick={() => logMutation.mutate({ habitId: item.habit.id, date: data.date })}
                                disabled={logMutation.isPending}>
                                    Mark done
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {data.habits.length === 0 && <div>No active habits yet. Create some via the API for now.</div>}
        </div>
    )
}