import React, { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Save, Trash2 } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import type {
  JournalEntryCreate,
  JournalEntryUpdate,
  JournalEntryBase,
} from "@/types/journal";
import {
  createJournal,
  deleteJournal,
  getJournalById,
  updateJournal,
} from "@/lib/journalService";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { getUpdatedText, navigateWithUnsavedCheck } from "@/utils/helpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { JournalLayoutContext } from "./JournalLayout";

const JournalForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Context from layout
  const {
    journals,
    setJournalTitle,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setPendingNav,
  } = useOutletContext<JournalLayoutContext>();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch current journal (for editing only)
  const {
    data: journal,
    isLoading,
    error,
  } = useQuery<JournalEntryBase>({
    queryKey: ["journal", id],
    queryFn: () => getJournalById(id!),
    enabled: isEditing && !!id,
  });

  useEffect(() => {
    if (isEditing && journal) {
      setTitle(journal.title || "");
      setContent(journal.content || "");
      setMood(journal.emojis || []);
      setImages(journal.images || []);
    } else if (!isEditing) {
      // Reset all fields for 'Add New'
      setTitle("");
      setContent("");
      setMood([]);
      setImages([]);
    }
  }, [isEditing, journal, id]);

  // Keep the sidebar in sync with form's title input
  useEffect(() => {
    setJournalTitle(title);
    const isDirty =
      isEditing && journal
        ? title.trim() !== (journal.title || "").trim() ||
          content.trim() !== (journal.content || "").trim() ||
          JSON.stringify(mood) !== JSON.stringify(journal.emojis || []) ||
          JSON.stringify(images) !== JSON.stringify(journal.images || [])
        : !!title.trim() ||
          !!content.trim() ||
          mood.length > 0 ||
          images.length > 0;
    setHasUnsavedChanges(isDirty);
  }, [
    title,
    content,
    mood,
    images,
    isEditing,
    journal,
    setJournalTitle,
    setHasUnsavedChanges,
  ]);

  // Auto-expand textarea as you type
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Close emoji picker on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showEmojiPicker]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: JournalEntryCreate) => createJournal(payload),
    onSuccess: (created) => {
      setHasUnsavedChanges(false);
      setJournalTitle("");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      navigate(`/journals/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: JournalEntryUpdate;
    }) => updateJournal(id, payload),
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setJournalTitle("");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
      navigate(`/journals/${id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (journalId: string) => deleteJournal(journalId),
    onSuccess: (_, deletedId) => {
      setHasUnsavedChanges(false);
      setJournalTitle("");
      queryClient.setQueryData(["journals"], (old: JournalEntryBase[] = []) =>
        old.filter((j) => j.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["journal", deletedId] });
      // Find newest journal to show after delete
      const updated =
        queryClient.getQueryData<JournalEntryBase[]>(["journals"]) || [];
      const next = updated
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
      navigate(next ? `/journals/${next.id}` : "/journals");
    },
  });

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      ).then((newImgs) => setImages((prev) => [...prev, ...newImgs]));
      e.target.value = "";
    },
    []
  );

  // Cancel logic: check for unsaved and fallback to newest
  const handleCancel = () => {
    setJournalTitle("");
    const fallback = [...journals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    navigateWithUnsavedCheck(
      isEditing
        ? `/journals/${id}`
        : fallback
        ? `/journals/${fallback.id}`
        : "/journals",
      hasUnsavedChanges,
      navigate,
      setPendingNav
    );
  };

  // Delete
  const handleDelete = () => {
    if (journalToDelete) {
      deleteMutation.mutate(journalToDelete);
      setJournalToDelete(null);
    }
  };

  // Submit (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const payload = {
      title: title || null,
      content,
      emojis: mood.length ? mood : null,
      images: images.length ? images : null,
    };

    if (isEditing && id) {
      const updatePayload: JournalEntryUpdate = {
        ...payload,
        updated_date: new Date().toISOString(),
      };
      updateMutation.mutate({ id, payload: updatePayload });
    } else {
      const createPayload: JournalEntryCreate = {
        ...payload,
        date: new Date().toISOString(),
        source: "web",
      };
      createMutation.mutate(createPayload);
    }
  };

  const isPending = isEditing
    ? updateMutation.isPending
    : createMutation.isPending;
  const isDisabled = !content.trim() || isPending;

  return (
    <main className="min-h-screen bg-background flex" role="main">
      <section className="flex-1 p-8 w-full max-w-7xl mx-auto">
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
                  {isEditing ? "Edit" : "New"} Journal Entry
                </h1>
                {isEditing && (
                  <div className="text-muted-foreground text-sm flex flex-wrap gap-x-4">
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
                )}
              </div>
              {isEditing && (
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                  onClick={() => journal?.id && setJournalToDelete(journal.id)}
                  aria-label="Delete journal entry"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              )}
            </header>

            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-xl shadow-lg border p-8 space-y-6 mt-4"
            >
              <section>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                  placeholder="Give your entry a title…"
                />
              </section>

              <section>
                <label className="block text-sm font-medium mb-2">
                  Your Thoughts *
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
                  placeholder="Express yourself…"
                  className="w-full px-4 py-3 border rounded-lg bg-background resize-none overflow-y-auto max-h-[70vh] focus:ring-2 focus:ring-primary"
                />
              </section>

              <section className="relative" ref={emojiPickerRef}>
                <label className="block text-sm font-medium mb-2">
                  How are you feeling?
                </label>
                <input
                  type="text"
                  value={mood.join("")}
                  readOnly
                  onClick={() => setShowEmojiPicker(true)}
                  className="w-full px-4 py-3 border rounded-lg bg-background cursor-text focus:ring-2 focus:ring-primary"
                  placeholder="Select emojis"
                />
                {showEmojiPicker && (
                  <div className="absolute z-50 mt-2">
                    <Picker
                      data={data}
                      onEmojiSelect={(e) =>
                        setMood((prev) => [...prev, e.native])
                      }
                      theme="light"
                      previewPosition="none"
                    />
                  </div>
                )}
              </section>

              {/* <section>
                <label className="block text-sm font-medium mb-2">
                  Add Images
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 space-y-4 text-center hover:border-primary transition-colors">
                  {images.length ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((src, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={src}
                            alt="upload"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-destructive rounded-full w-6 h-6 flex items-center justify-center text-white text-sm"
                            onClick={() =>
                              setImages((imgs) =>
                                imgs.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      No images uploaded.
                    </div>
                  )}
                  <div>
                    <p className="mb-4">Drag/drop or select images</p>
                    <input
                      id="upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="upload"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Choose Images
                    </label>
                  </div>
                </div>
              </section> */}

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
                  disabled={isDisabled}
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
                  {isEditing ? "Update Entry" : "Save Entry"}
                </button>
              </footer>
            </form>

            <ConfirmDialog
              open={!!journalToDelete}
              onClose={() => setJournalToDelete(null)}
              onConfirm={handleDelete}
              title="Delete Journal Entry?"
              message="Are you sure you want to delete this journal entry? This action
                      cannot be undone."
              confirmMessage="Delete"
              loading={deleteMutation.isPending}
            />
          </>
        )}
      </section>
    </main>
  );
};

export default JournalForm;
