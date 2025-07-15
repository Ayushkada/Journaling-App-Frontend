import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { JournalCard } from "@/components/ui/JournalCard";
import { deleteJournal, getAllJournals } from "@/lib/journalService";
import type { JournalEntryBase } from "@/types/journal";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/provider";

const Journals: React.FC = () => {
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();
  const { authStatus } = useAuth();

  const { data, isLoading, error } = useQuery<JournalEntryBase[]>({
    queryKey: ["journals"],
    queryFn: () => getAllJournals(),
    enabled: authStatus === "authenticated",
    staleTime: 60 * 1000, // 1 min cache
  });

  const journals = data ?? [];

  const sorted = useMemo(
    () =>
      [...journals].sort((a, b) => {
        const getSortDate = (entry: JournalEntryBase) =>
          entry.updated_date
            ? new Date(entry.updated_date)
            : new Date(entry.date);

        return getSortDate(b).getTime() - getSortDate(a).getTime();
      }),
    [journals]
  );

  const filteredJournals = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return sorted.filter(
      (j) =>
        j.content.toLowerCase().includes(lowerQuery) ||
        j.title?.toLowerCase().includes(lowerQuery)
    );
  }, [query, sorted]);

  // Delete journal mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });

  const confirmDelete = useCallback(() => {
    if (journalToDelete) deleteMutation.mutate(journalToDelete);
    setJournalToDelete(null);
  }, [journalToDelete, deleteMutation]);

  const lowerQuery = query.toLowerCase();
  const results = journals.filter(
    (j) =>
      j.content.toLowerCase().includes(lowerQuery) ||
      j.title?.toLowerCase().includes(lowerQuery)
  );

  return (
    <main className="flex-1 p-8" role="main">
      <section className="max-w-7xl mx-auto w-full">
        {isLoading && !data ? (
          <div className="min-h-screen flex items-center justify-center px-4">
            <p>Loading…</p>
          </div>
        ) : error ? (
          <div className="text-red-500">Failed to load journals.</div>
        ) : (
          <>
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-1">
                  My Journals
                </h1>
                <p className="text-muted-foreground text-lg">
                  A personal space for reflection and growth
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-48 md:w-48 lg:w-56 xl:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search journals..."
                    className="pl-10"
                    aria-label="Search entries"
                  />
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link
                    to="/journals/add"
                    aria-label="Create new journal entry"
                  >
                    New Journal Entry
                  </Link>
                </Button>
              </div>
            </header>

            {journals.length === 0 && !isLoading ? (
              <div className="col-span-full text-center text-muted-foreground text-lg py-12">
                <p>No journal entries yet.</p>
                <Button asChild className="mt-4">
                  <Link
                    to="/journals/add"
                    aria-label="Start your first journal entry"
                  >
                    Start your first journal
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 auto-rows-fr">
                  {filteredJournals.map((j) => (
                    <JournalCard
                      key={j.id}
                      id={j.id}
                      title={j.title || "Untitled"}
                      preview={`${j.content}`}
                      date={format(j.date, "MMMM d, yyyy")}
                      image={j.images?.[0] || null}
                      emojis={j.emojis || []}
                      viewUrl={`/journals/${j.id}`}
                      editUrl={`/journals/${j.id}/edit`}
                      onDelete={() => setJournalToDelete(j.id)}
                    />
                  ))}
                </div>
              </>
            )}

            <ConfirmDialog
              open={!!journalToDelete}
              onClose={() => setJournalToDelete(null)}
              onConfirm={confirmDelete}
              title="Delete Journal Entry?"
              message="Are you sure you want to delete this journal entry? This action cannot be undone."
              confirmMessage="Delete"
              loading={deleteMutation.isPending}
            />
          </>
        )}
      </section>
    </main>
  );
};

export default Journals;
