import React, { useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { GoalBase } from "@/types/goal";
import type { JournalEntryBase } from "@/types/journal";
import { deleteGoal, getGoalById } from "@/lib/goalService";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { format } from "date-fns";
import { getCategoryColor, getUpdatedText } from "@/utils/helpers";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GoalLayoutContext } from "./GoalLayout";

const GoalView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [toDelete, setToDelete] = useState<string | null>(null);
  const [fallbackMap, setFallbackMap] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { journals } = useOutletContext<GoalLayoutContext>();

  // Get single journal
  const {
    data: goal,
    isLoading,
    error,
  } = useQuery<GoalBase>({
    queryKey: ["goal", id],
    queryFn: () => (id ? getGoalById(id) : null),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
    onSuccess: async (_, deletedId) => {
      // Invalidate goals list and this journal
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      await queryClient.invalidateQueries({ queryKey: ["goal", deletedId] });
      // Get the updated goals (from cache or refetch)
      const goals = queryClient.getQueryData<GoalBase[]>(["goals"]) || [];
      const updated = goals.filter((j) => j.id !== deletedId);
      const next = updated
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      navigate(next ? `/goals/${next.id}` : "/goals");
    },
  });

  const confirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete);
      setToDelete(null);
    }
  };

  // find related journals
  const related = (goal?.related_entry_ids || [])
    .map((jid) => journals.find((j) => j.id === jid))
    .filter(Boolean) as JournalEntryBase[];

  return (
    <main className="bg-background flex flex-1 p-8" role="main">
      <article className="max-w-7xl mx-auto space-y-8 w-full">
        {isLoading && !goal ? (
          <div className="min-h-screen flex items-center justify-center px-4">
            <p>Loading…</p>
          </div>
        ) : error ? (
          <div className="text-red-500">Failed to load goal.</div>
        ) : (
          <>
            <header className="space-y-2">
              <div className="space-y-0">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                  <div className="flex flex-col space-y-2">
                    {goal.ai_generated || goal.category?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {goal.ai_generated && (
                          <Badge
                            variant="outline"
                            className="px-2 py-1 text-xs"
                          >
                            AI-Generated
                          </Badge>
                        )}
                        {goal.category?.map((cat) => {
                          const colorClass = getCategoryColor(cat, {
                            fallbackMap,
                            setFallbackMap,
                          });

                          return (
                            <Badge
                              key={cat}
                              className={`px-2 py-1 text-xs ${colorClass}`}
                            >
                              {cat}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <h1 className="text-3xl font-bold">
                        {goal.content || "Untitled"}
                      </h1>
                    )}
                  </div>

                  <div className="flex items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => navigate(`/goals/${goal.id}/edit`)}
                      aria-label="Edit goal"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setToDelete(goal.id)}
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {(goal.ai_generated || goal.category?.length > 0) && (
                  <h1 className="text-3xl font-bold">
                    {goal.content || "Untitled"}
                  </h1>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-muted-foreground text-sm">
                  <div>
                    Created:{" "}
                    {format(
                      new Date(goal.created_at),
                      "MMMM d, yyyy 'at' hh:mm a"
                    )}
                  </div>
                  {goal.completed_at ? (
                    <div>
                      Completed:{" "}
                      {format(goal.completed_at, "MMMM d, yyyy 'at' hh:mm a")}
                    </div>
                  ) : (
                    getUpdatedText(goal.created_at, goal.updated_at) && (
                      <div>
                        {getUpdatedText(goal.created_at, goal.updated_at)}
                      </div>
                    )
                  )}
                </div>
                <div className="text-muted-foreground text-sm">
                  {goal.time_limit && (
                    <div>
                      Due:{" "}
                      {format(
                        new Date(goal.time_limit),
                        "MMMM d, yyyy 'at' hh:mm a"
                      )}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <section aria-label="Progress">
              <h2 className="font-semibold mb-2">Progress</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={goal.progress_score} />
                  <p className="text-sm mt-1">
                    {goal.progress_score.toFixed(0)}%
                  </p>
                </div>
              </div>
            </section>

            {goal.notes && (
              <section>
                <h2 className="font-semibold mb-2">Notes</h2>
                <div
                  aria-label="Notes"
                  className="bg-card border rounded-xl p-4 whitespace-pre-wrap break-words"
                >
                  {goal.notes.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section aria-label="Related Journals">
                <h2 className="font-semibold mb-2">Related Journals</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {related.map((j) => {
                    const title =
                      j.title?.trim() ||
                      format(new Date(j.date), "MMMM d, yyyy");
                    return (
                      <span
                        key={j.id}
                        className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground max-w-[12rem]"
                      >
                        <a
                          href={`/journals/${j.id}`}
                          title={title}
                          className="truncate underline inline-block max-w-[8rem]"
                        >
                          {title.length > 50 ? `${title.slice(0, 50)}…` : title}
                        </a>
                      </span>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </article>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Goal?"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmMessage="Delete"
        loading={deleteMutation.isPending}
      />
    </main>
  );
};

export default GoalView;
