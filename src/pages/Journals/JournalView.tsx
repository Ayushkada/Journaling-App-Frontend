import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { getJournalById, deleteJournal } from "@/lib/journalService";
import type { JournalEntryBase } from "@/types/journal";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { getUpdatedText } from "@/utils/helpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const JournalView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [toDelete, setToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Get single journal
  const {
    data: journal,
    isLoading,
    error,
  } = useQuery<JournalEntryBase>({
    queryKey: ["journal", id],
    queryFn: () => (id ? getJournalById(id) : null),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (journalId: string) => deleteJournal(journalId),
    onSuccess: async (_, deletedId) => {
      // Invalidate journals list and this journal
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
      await queryClient.invalidateQueries({ queryKey: ["journal", deletedId] });
      // Get the updated journals (from cache or refetch)
      const journals =
        queryClient.getQueryData<JournalEntryBase[]>(["journals"]) || [];
      const updated = journals.filter((j) => j.id !== deletedId);
      const next = updated
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
      navigate(next ? `/journals/${next.id}` : "/journals");
    },
  });

  const confirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete);
      setToDelete(null);
    }
  };

  return (
    <main className="bg-background flex flex-1 p-8" role="main">
      <article className="max-w-7xl mx-auto space-y-6 w-full">
        {isLoading && !journal ? (
          <div className="min-h-screen flex items-center justify-center px-4">
            <p>Loading…</p>
          </div>
        ) : error ? (
          <div className="text-red-500">Failed to load journal.</div>
        ) : (
          <>
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">
                  {journal.title || "Untitled"}
                </h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                  <span>
                    Created:{" "}
                    {format(
                      new Date(journal.date),
                      "MMMM d, yyyy 'at' hh:mm a"
                    )}
                  </span>
                  {getUpdatedText(journal.date, journal.updated_date) && (
                    <span>
                      {getUpdatedText(journal.date, journal.updated_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigate(`/journals/${journal.id}/edit`)}
                  aria-label="Edit journal entry"
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setToDelete(journal.id)}
                  aria-label="Delete journal entry"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </header>

            {journal.emojis?.length > 0 && (
              <section
                aria-label="Journal emojis"
                className="flex gap-2 text-2xl"
              >
                {journal.emojis.map((e, i) => (
                  <span key={i}>{e}</span>
                ))}
              </section>
            )}

            {/* {journal.images?.length > 0 && (
              <section
                aria-label="Journal images"
                className="flex overflow-x-auto space-x-4 py-2"
              >
                {journal.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`img-${i}`}
                    className="h-48 w-auto flex-shrink-0 rounded-lg object-cover"
                  />
                ))}
              </section>
            )} */}

            <section
              aria-label="Journal content"
              className="bg-card border rounded-xl p-6 whitespace-pre-wrap break-words hyphens-auto"
            >
              {journal.content}
            </section>
          </>
        )}
      </article>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Journal Entry?"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        confirmMessage="Delete"
        loading={deleteMutation.isPending}
      />
    </main>
  );
};

export default JournalView;
