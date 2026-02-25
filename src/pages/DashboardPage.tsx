/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react"
import { api } from "../lib/api"
import { useToast } from "../components/ToastProvider";

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

    const { toast } = useToast();
    const today = data?.date ?? "";
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
        onSuccess: async (_createdHabit, _payload) => {
            toast("Habit created");
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
            toast("Habit archived");
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
            toast("Habit restored");
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]})
            await qc.invalidateQueries({ queryKey: ["habits", "include-archived"]});
        },
    });

    const updateHabitMutation = useMutation({
        mutationFn: ({ habitId, payload}: { habitId: number; payload: any}) => api.updateHabit(habitId, payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboard-today"]});
            await qc.invalidateQueries({ queryKey: ["habits","include-archived"]});
        },
    });
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [goalType, setGoalType] = useState<"DAILY" | "X_PER_WEEK">("DAILY");
    const [timesPerWeek, setTimesPerWeek] = useState(3);
    const [showArchived, setShowArchived] = useState(false);

    const [editingId, setEditingId] = useState<number| null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("")
    const [editGoalType, setEditGoalType] = useState("")
    const [editTimesPerWeek, setEditTimesPerWeek] = useState(3)

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
            goal_type: goalType, 
            target_per_period: goalType === "DAILY" ? 1 : timesPerWeek,
            start_date: today,
        })

        setName("")
        setDescription("")
    }

    function startEdit(item: any) {
        setEditingId(item.habit.id);
        setEditName(item.habit.name ?? "");
        setEditDescription(item.habit.description ?? "");
        setEditGoalType(item.habit.goal_type === "X_PER_WEEK" ? "X_PER_WEEK" : "DAILY");
        setEditTimesPerWeek(item.habit.target_per_period ?? 3);
    }

    const archived = (allHabits || []).filter((h) => h.is_archived);
    return (
        <div>
            <h2>Today</h2>
            <div style={{ opacity: 0.8, marginBottom: 12}}>{today}</div>
            
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
                            Start Date: {today}
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                            <label style={{ fontSize: 14, fontWeight: 600}}>Goal</label>

                            <select 
                                value={goalType}
                                onChange={(e) => setGoalType(e.target.value as "DAILY" | "X_PER_WEEK")}
                            >
                                <option value="DAILY">Daily</option>
                                <option value="X_PER_WEEK">X times per week</option>
                            </select>

                            {goalType === "X_PER_WEEK" && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8}}>
                                    <input
                                        type="number"
                                        min={1}
                                        max={7}
                                        value={timesPerWeek}
                                        onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                                        style={{ width: 80 }}
                                        />
                                </div>
                            )}
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
                        <div style={{ flex: "auto" }}>
                            <div style={{ fontWeight: 700}}>{item.habit.name}</div>
                            {item.habit.description && (
                                <div style={{ opacity: 0.8, fontSize: 14}}>{item.habit.description}</div>
                            )}
                            <div style={{ fontSize: 13, opacity: 0.75 }}>
                                {item.habit.goal_type === "DAILY" ? "Daily" : `${item.habit.target_per_period}x / week`}
                            </div>
                            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6}}>
                                Streak: {item.current_streak} (best {item.best_streak})
                            </div>
                        </div>
                        
                        {editingId === item.habit.id && (
                            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                                <input value={editName} onChange={(e) => setEditName(e.target.value)}/>
                                <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)}/>

                                <select
                                    value={editGoalType}
                                    onChange={(e) => setEditGoalType(e.target.value as "DAILY" | "X_PER_WEEK")}
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="X_PER_WEEK">X times per week</option>
                                </select>

                                {editGoalType === "X_PER_WEEK" && (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center"}}>
                                        <input
                                        type="number"
                                        min={1}
                                        max={7}
                                        value={editTimesPerWeek}
                                        onChange={(e) => setEditTimesPerWeek(Number(e.target.value))}
                                        style={{ width: 80}}/>
                                        <span>times per week</span>
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: 8}}>
                                    <button
                                        onClick={() => {
                                            updateHabitMutation.mutate({
                                                habitId: item.habit.id,
                                                payload: {
                                                    name: editName.trim(),
                                                    description: editDescription.trim(),
                                                    goal_type: editGoalType,
                                                    target_per_period: editGoalType === "DAILY" ? 1 : editTimesPerWeek,
                                                },
                                            });
                                            setEditingId(null)
                                        }}
                                        disabled={updateHabitMutation.isPending || editName.trim().length < 3}
                                    >Save</button>

                                    <button onClick={() => setEditingId(null)} disabled={updateHabitMutation.isPending}>Cancel</button>
                                </div>
                            </div>
                        )}
                        
                        {item.is_completed ? (
                            <span style={{ fontWeight: 700}}>✅ Done</span>
                        ) : ( 
                            <button
                                onClick={() => logMutation.mutate({ habitId: item.habit.id, date: today })}
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

                        <button onClick={() => startEdit(item)}>Edit</button>
                    </div>
                ))}
            </div>
            {data.habits.length === 0 && <div>No active habits yet.</div>}
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
                                <div style={{ flex: "auto"}}>
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
        </div>
    )
}