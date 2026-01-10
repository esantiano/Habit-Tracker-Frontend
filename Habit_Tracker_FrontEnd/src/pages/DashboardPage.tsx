import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react"
import { api } from "../lib/api"

export default function DashboardPage() {
    const qc = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard-today"],
        queryFn: api.dashboardToday,
    });

    const createHabitMutation = useMutation({
        mutationFn: (payload: {
            name: string;
            description?: string;
            goal_type: "DAILY" | "WEEKLY" | "X_PER_WEEK";
            target_per_period: number;
            start_date: string;
        }) => api.createHabit(payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]})
        },
    });

    const logMutation = useMutation({
        mutationFn: ({habitId, date}: {habitId: number; date: string }) => 
            api.createHabitLog(habitId, {date, value: 1 }),
        onSuccess: async () => {
            await qc.invalidateQueries({queryKey: ["dashboard-today"] });
        },
    });

    const archiveMutation = useMutation({
        mutationFn: (habitId: number) => api.archiveHabit(habitId),
        onMutate: async (habitId: number) => {
            await qc.cancelQueries({ queryKey: ["dashboard-today"]});

            const previous = qc.getQueryData<unknown>(["dashboard-today"]);

            qc.setQueryData(["dashboard-today"], (old: unknown) => {
                if (!old) return old;
                return {
                    ...old,
                    habits: old.habits.filter((h:unknown) => h.habit.it !== habitId),
                };
            });

            return {previous}
        },
        onError: (_err, _habitId, ctx) => {
            if (ctx?.previous) qc.setQueryData(["dashboard-today"], ctx.previous);
        },
        onSettled: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]});
        }
    });

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    if (isLoading) return <div>Loading dashboard...</div>;
    if (error) return <pre style={{ color: "crimson", whiteSpace: "pre-wrap"}}>{String(error)}</pre>;
    if (!data) return <div>No data</div>

    async function onCreateHabit(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = name.trim()
        if (!trimmed) return;

        createHabitMutation.mutate({
            name: trimmed,
            description: description.trim(),
            goal_type: "DAILY", 
            target_per_period: 1,
            start_date: data.date
        })

        setName("")
        setDescription("")
    }
    return (
        <div>
            <h2>Today</h2>
            <div style={{ opacity: 0.8, marginBottom: 12}}>{data.date}</div>
            
            {/* Create Habit Form */}
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                }}    
            >
                <div style={{ fontWeight: 700, marginBottom: 8}}>Create a habit</div>
                <form onSubmit={onCreateHabit} style={{display: "grid", gap: 10}}>
                    <input 
                        placeholder="Habit name (e.g., Workout)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        />
                    <input 
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <div style={{display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                            Defaults: DAILY · start date {data.date}
                        </div>

                        <button
                            type="submit"
                            disabled={createHabitMutation.isPending || !name.trim()}
                            style={{ marginLeft: "auto" }}
                        >
                            {createHabitMutation.isPending ? "Creating..." : "Add habit"}
                        </button>
                    </div>

                    { createHabitMutation.isError && (
                        <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
                            {String(createHabitMutation.error)}
                        </pre>
                    )}
                </form>
            </div>
            
            {/* Habit List*/}
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

                        <button
                            onClick={() => {
                                const ok = confirm(`Archive "${item.habit.name}?`)
                                if (ok) archiveMutation.mutate(item.habit.id)
                            }}
                            disabled={archiveMutation.isPending}
                            style={{ opacity: 0.8}}
                        >
                            Archive
                        </button>
                    </div>
                ))}
            </div>

            {data.habits.length === 0 && <div>No active habits yet. Create some via the API for now.</div>}
        </div>
    )
}