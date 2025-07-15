import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  Link,
} from "react-router-dom";
import { Loader2, Save, Trash2 } from "lucide-react";
import {
  createGoal,
  deleteGoal,
  getGoalById,
  updateGoal,
} from "@/lib/goalService";
import type { GoalBase, GoalCreate, GoalUpdate } from "@/types/goal";
import {
  baseCategories,
  baseCategoryColors,
  fallbackCategoryColors,
} from "@/constants/categoryColors";
import { Button } from "@/components/ui/Button";
import { FinishByDateField } from "@/components/ui/DatePicker";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { format } from "date-fns";
import { SearchComboBox } from "@/components/ui/SearchCombobox";
import { getUpdatedText, navigateWithUnsavedCheck } from "@/utils/helpers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useIsMobile } from "@/hooks/useMobile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GoalLayoutContext } from "./GoalLayout";

const GoalForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    goals,
    journals,
    setGoalTitle,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setPendingNav,
  } = useOutletContext<GoalLayoutContext>();

  // Form state
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [relatedEntryIds, setRelatedEntryIds] = useState<string[]>([]);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const queryClient = useQueryClient();

  // Fetch goal when editing
  const {
    data: goal,
    isLoading,
    error,
  } = useQuery<GoalBase>({
    queryKey: ["goal", id],
    queryFn: () => getGoalById(id!),
    enabled: isEditing && !!id,
  });

  useEffect(() => {
    if (isEditing && goal) {
      setContent(goal.content);
      setCategories(goal.category || []);
      setNotes(goal.notes || "");
      setProgress(goal.progress_score);
      setDueDate(goal.time_limit ? goal.time_limit.slice(0, 10) : "");
      setRelatedEntryIds(goal.related_entry_ids || []);
    } else if (!isEditing) {
      setContent("");
      setCategories([]);
      setNotes("");
      setProgress(0);
      setDueDate("");
      setRelatedEntryIds([]);
    }
  }, [isEditing, goal, id]);

  useEffect(() => {
    setGoalTitle(content);
    const isDirty =
      isEditing && goal
        ? content.trim() !== (goal.content || "").trim() ||
          notes.trim() !== (goal.notes || "").trim() ||
          JSON.stringify(categories) !== JSON.stringify(goal.category || []) ||
          progress !== (goal.progress_score || 0) ||
          dueDate.trim() !==
            (goal.time_limit ? goal.time_limit.slice(0, 10) : "") ||
          JSON.stringify(relatedEntryIds) !==
            JSON.stringify(goal.related_entry_ids || [])
        : !!content.trim() ||
          !!notes.trim() ||
          categories.length > 0 ||
          progress !== 0 ||
          !!dueDate.trim() ||
          relatedEntryIds.length > 0;

    setHasUnsavedChanges(isDirty);
  }, [
    content,
    notes,
    categories,
    progress,
    dueDate,
    relatedEntryIds,
    isEditing,
    goal,
    setHasUnsavedChanges,
    setGoalTitle,
  ]);

  // Auto-expand textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = "auto";
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  }, [notes]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: GoalCreate) => createGoal(payload),
    onSuccess: (created) => {
      setHasUnsavedChanges(false);
      setGoalTitle("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      navigate(`/goals/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GoalUpdate }) =>
      updateGoal(id, payload),
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setGoalTitle("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", id] });
      navigate(`/goals/${id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
    onSuccess: (_, deletedId) => {
      setHasUnsavedChanges(false);
      setGoalTitle("");
      queryClient.setQueryData(["goals"], (old: GoalBase[] = []) =>
        old.filter((j) => j.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", deletedId] });
      // Find newest goal to show after delete
      const updated = queryClient.getQueryData<GoalBase[]>(["goals"]) || [];
      const next = updated
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      navigate(next ? `/goals/${next.id}` : "/goals");
    },
  });

  const handleCancel = () => {
    setGoalTitle("");
    const fallback = [...goals].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    navigateWithUnsavedCheck(
      isEditing
        ? `/goals/${id}`
        : fallback
        ? `/goals/${fallback.id}`
        : "/goals",
      hasUnsavedChanges,
      navigate,
      setPendingNav
    );
  };

  const handleDelete = async () => {
    if (goalToDelete) {
      deleteMutation.mutate(goalToDelete);
      setGoalToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const payload = {
      content,
      category: categories || null,
      notes: notes || null,
      progress_score: progress,
      time_limit: dueDate || null,
      related_entry_ids: relatedEntryIds.length ? relatedEntryIds : null,
    };

    if (isEditing && id) {
      const completedAt = progress === 100 ? new Date().toISOString() : null;

      const updatePayload: GoalUpdate = {
        ...payload,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      };
      updateMutation.mutate({ id, payload: updatePayload });
    } else {
      const createPayload: GoalCreate = {
        ...payload,
        created_at: new Date().toISOString(),
        ai_generated: false as const,
        verified: true,
      };
      createMutation.mutate(createPayload);
    }
  };

  // related entries
  const journalOptions = journals.map((j) => ({
    id: j.id,
    title: j.title?.trim() || "Untitled Entry",
  }));

  const handleRemoveRelated = (rid: string) => {
    setRelatedEntryIds((prev) => prev.filter((id) => id !== rid));
  };

  const isPending = isEditing
    ? updateMutation.isPending
    : createMutation.isPending;
  const isDisabled = !content.trim() || isPending;

  return (
    <main className="min-h-screen bg-background flex" role="main">
      <section className="flex-1 p-8 w-full max-w-7xl mx-auto">
        {isLoading && !goal ? (
          <div className="min-h-screen flex items-center justify-center px-4">
            <p>Loading…</p>
          </div>
        ) : error ? (
          <div className="text-red-500">Failed to load goal.</div>
        ) : (
          <>
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">
                  {isEditing ? "Edit" : "New"} Goal
                </h1>
                {isEditing && (
                  <div className="text-muted-foreground text-sm flex flex-wrap gap-x-4">
                    <span>
                      Created:{" "}
                      {format(
                        new Date(goal.created_at),
                        "MMMM d, yyyy 'at' hh:mm a"
                      )}
                    </span>
                    {getUpdatedText(goal.created_at, goal.updated_at) && (
                      <span>
                        {getUpdatedText(goal.created_at, goal.updated_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isEditing && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => goal?.id && setGoalToDelete(goal.id)}
                  aria-label="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </header>
            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-xl shadow-lg border p-8 space-y-6 mt-4"
            >
              <section>
                <label className="block text-sm font-medium mb-2">
                  Goal Details *
                </label>
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onInput={() => {
                    if (contentRef.current) {
                      contentRef.current.style.height = "auto";
                      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
                    }
                  }}
                  placeholder="Describe your goal in detail…"
                  className="w-full px-4 py-3 border rounded-lg bg-background resize-none overflow-y-auto max-h-[20vh] focus:ring-2 focus:ring-primary"
                />
              </section>

              <section>
                <label className="block text-sm font-medium mb-2">
                  Notes / Progress
                </label>
                <textarea
                  ref={notesRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onInput={() => {
                    if (notesRef.current) {
                      notesRef.current.style.height = "auto";
                      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
                    }
                  }}
                  placeholder="Any additional notes or progress updates…"
                  className="w-full px-4 py-3 border rounded-lg bg-background resize-none overflow-y-auto max-h-[70vh] focus:ring-2 focus:ring-primary"
                />
              </section>

              <section>
                <label className="block text-sm font-medium mb-2">
                  Categories
                </label>
                <CategoryPicker
                  baseCategories={baseCategories}
                  baseCategoryColors={baseCategoryColors}
                  fallbackCategoryColors={fallbackCategoryColors}
                  selected={categories}
                  setSelected={setCategories}
                />
              </section>

              <section>
                <label className="block text-sm font-medium mb-2">
                  Progress: {progress}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none"
                  style={{
                    background: `linear-gradient( to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--input)) ${progress}%, hsl(var(--input)) 100%)`,
                  }}
                />
              </section>

              <FinishByDateField dueDate={dueDate} setDueDate={setDueDate} />

              <section>
                <label className="block text-sm font-medium mb-2">
                  Related Journal Entries
                </label>

                {relatedEntryIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {relatedEntryIds.map((rid) => {
                      const title =
                        journalOptions.find((j) => j.id === rid)?.title ||
                        "Untitled Entry";
                      return (
                        <span
                          key={rid}
                          className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground max-w-[12rem]"
                        >
                          <Link
                            to={`/journals/${rid}`}
                            title={title}
                            className="truncate underline inline-block max-w-[8rem]"
                          >
                            {title.length > 50
                              ? `${title.slice(0, 50)}…`
                              : title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveRelated(rid)}
                            className="ml-1 text-sm font-bold leading-none focus:outline-none"
                            aria-label={`Remove ${title}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <SearchComboBox
                  items={journalOptions}
                  placeholder="Search journal titles…"
                  onSelect={(id) => {
                    if (!relatedEntryIds.includes(id)) {
                      setRelatedEntryIds((prev) => [...prev, id]);
                    }
                  }}
                />
              </section>

              <footer className="flex justify-between gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className={`min-w-[128px] px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition ${
                    !content.trim()
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 w-4 h-4" />
                  )}
                  {isEditing ? "Update Goal" : "Save Goal"}
                </button>
              </footer>
            </form>

            <ConfirmDialog
              open={!!goalToDelete}
              onClose={() => setGoalToDelete(null)}
              onConfirm={handleDelete}
              title="Delete Goal?"
              message="Are you sure you want to delete this goal? This action cannot be undone."
              confirmMessage="Delete"
              loading={deleteMutation.isPending}
            />
          </>
        )}
      </section>
    </main>
  );
};

export default GoalForm;
