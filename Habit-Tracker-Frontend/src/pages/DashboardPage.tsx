/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react"
import { api } from "../lib/api"

type Habit = {
    id: number;
    name: string;
    description: string;
    goal_type: string;
    target_per_period: number;
    start_date: string;
    is_archived: boolean;
    created_at: string;
};

type TodayHabitItem = {
    habit: { id: number; name: string; description: string; goal_type: string };
    is_completed: boolean;
    current_streak: number;
    best_streak: number;
}

type DashboardToday = {date: string; habits: TodayHabitItem[] };

export default function DashboardPage() {
    const qc = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard-today"],
        queryFn: api.dashboardToday,
    });

    const {data: allHabits } = useQuery({
        queryKey: ["habits", "include-archived"],
        queryFn: () => api.listHabits(true)
    });
    
    const createHabitMutation = useMutation({
        mutationFn: api.createHabit,

        onMutate: async (payload) => {
            await qc. cancelQueries({queryKey: ["dashboard-today"] });

            const prev = qc.getQueryData<DashboardToday>(["dashboard-today"])

            const tempId = Math.floor(Math.random() * -1_000_000);
            const optimisticItem: TodayHabitItem = {
                habit: {
                    id: tempId,
                    name: payload.name,
                    description: payload.description ?? "",
                    goal_type: payload.goal_type
                },
                is_completed: false,
                current_streak: 0,
                best_streak: 0,
            }

            if (prev) {
                qc.setQueryData<DashboardToday>(["dashboard-today"], {
                    ...prev,
                    habits: [optimisticItem, ...prev.habits],
                });
            }

            return {prev, tempId}
        },
        onError: (_err, _payload, ctx) => {
            if (ctx?.prev) qc.setQueryData(["dashboard-today"], ctx.prev);
        },
        onSuccess: async (_createdHabit, _payload, ctx) => {
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]});
            await qc.invalidateQueries({ queryKey: ["habits","include-archived"]});
        },
    });

    const logMutation = useMutation({
        mutationFn: ({habitId, date}: {habitId: number; date: string }) => 
            api.createHabitLog(habitId, {date, value: 1 }),
        onMutate: async ({ habitId }) => {
            await qc.cancelQueries({ queryKey: ["dashboard-today"] });

            const prev = qc.getQueryData<DashboardToday>(["dashboard-today"]);
            if (!prev) return { prev };

            qc.setQueryData<DashboardToday>(["dashboard-today"], {
                ...prev,
                habits: prev.habits.map((item) => 
                    item.habit.id === habitId ? { ...item, is_completed: true} : item
                ),
            });
            return { prev }
        },
        onError : (_err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(["dashboard-today"], ctx.prev);
        },
        onSettled: async () => {
            await qc.invalidateQueries({queryKey: ["dashboard-today"] });
        },
    });

    const archiveMutation = useMutation({
        mutationFn: (habitId: number) => api.archiveHabit(habitId),
        
        onMutate: async (habitId: number) => {
            await qc.cancelQueries({ queryKey: ["dashboard-today"]});
            await qc.cancelQueries({ queryKey: ["habits","include-archived"]});

            const prevDashboard = qc.getQueryData<DashboardToday>(["dashboard-today"]);
            const prevHabits = qc.getQueryData<Habit[]>(["habits", "include-archived"]);

            if (prevDashboard) {
            qc.setQueryData(["dashboard-today"], {
                ...prevDashboard,
                habits: prevDashboard.habits.filter((x) => x.habit.id !== habitId),
                });
            }
            
            if (prevHabits) {
                qc.setQueryData<Habit[]>(
                    ["habits", "include-archived"],
                    prevHabits.map((h) => (h.id === habitId ? { ...h, is_archived: true} : h))
                );
            }

            return {prevDashboard, prevHabits};
        },
        onError: (_err, _habitId, ctx) => {
            if (ctx?.prevDashboard) {
                qc.setQueryData(["dashboard-today"], ctx.prevDashboard);
            }
            if (ctx?.prevHabits) {
                qc.setQueryData(["habits", "include-archived"], ctx.prevHabits)
            }
        },
        onSettled: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]});
            await qc.invalidateQueries({ queryKey: ["habits", "include-archived"]});
        }
    });

    const restoreMutation = useMutation({
        mutationFn: (habitId: number) => api.restoreHabit(habitId),

        onMutate: async (habitId: number) => {
            await qc.cancelQueries({ queryKey: ["dashboard-today"] });
            await qc.cancelQueries({ queryKey: ["habits","include-archived"] });

            const prevDashboard = qc.getQueryData<DashboardToday>(["dashboard-today"]);
            const prevHabits = qc.getQueryData<Habit[]>(["habits","include-archived"]);

            let restored: Habit | undefined;
            if (prevHabits) {
                const updated = prevHabits.map((h) => {
                    if(h.id === habitId) {
                        restored = { ...h, is_archived: false };
                        return restored;
                    }
                    return h;
                });
                qc.setQueryData(["habits", "include-archved"], updated);
            }

            if (prevDashboard && restored) {
                const item: TodayHabitItem = {
                    habit: {
                        id: restored.id,
                        name: restored.name,
                        description: restored.description ?? "",
                        goal_type: restored.goal_type,
                    },
                    is_completed: false,
                    current_streak: 0,
                    best_streak: 0,
                };

                qc.setQueryData<DashboardToday>(["dashboard-today"], {
                    ...prevDashboard,
                    habits: [item, ...prevDashboard.habits],
                });
            }
            return { prevDashboard, prevHabits };
        },
        onError: (_err, _habitId, ctx) => {
            if (ctx?.prevDashboard) qc.setQueryData(["dashboard-today"], ctx.prevDashboard);
            if (ctx?.prevHabits) qc.setQueryData(["habits" , "include-archived"], ctx.prevHabits);
        },
        onSettled: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]})
            await qc.invalidateQueries({ queryKey: ["habits", "include-archived"]});
        },
    });
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    if (isLoading) return (<div>
                                <h2>Today</h2>
                                <div style={{ opacity: 0.7}}>Loading...</div>
                                <div style={{ display: "grid", gap: 10, marginTop: 12}}>
                                    {[1,2,3,].map((i) => (
                                        <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, opacity: 0.6}}>
                                            Loading habit...
                                        </div>
                                    ))}
                                </div>
                            </div>);
    if (error) return (<div style={{ color: "crimson" }}>Couldn't load dashboard.</div>);
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
    
    const archived = (allHabits || []).filter((h) => h.is_archived);
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
            
            <hr style={{ margin: "20px 0"}}/>
            <button onClick={() => setShowArchived((s) => !s)}>
                {showArchived ? "Hide archived habits" : "Show archived habits"}    
            </button>
            
            {showArchived && (
                <div style={{marginTop: 20}}>
                    <h3 style={{marginBottom: 8}}>Archived habits</h3>
                    {archived.length === 0 ? (
                        <div style={{ opacity: 0.8 }}>No archived habits.</div>
                    ) : (
                    <div style={{ display: "grid", gap: 10}}>
                        {archived.map((h) => (
                            <div
                                key={h.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    opacity: 0.9,
                                }}
                            >
                                <div style={{ flex: 1}}>
                                    <div style={{ fontWeight: 700}}>{h.name}</div>
                                    {h.description && (
                                        <div style={{ fontSize: 14, opacity: 0.8}}>{h.description}</div>
                                    )}
                                </div>

                                <button
                                    onClick={() => restoreMutation.mutate(h.id)}
                                    disabled={restoreMutation.isPending}>
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>)}
                </div>
            )}
            {data.habits.length === 0 && <div>No active habits yet. Create some via the API for now.</div>}
        </div>
    )
}