import React, { useEffect, useState, useMemo } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  Outlet,
  Link,
} from "react-router-dom";
import JournalSidebarList from "@/pages/Journals/JournalSidebar";
import { getAllJournals } from "@/lib/journalService";
import { Button } from "@/components/ui/Button";
import type { JournalEntryBase } from "@/types/journal";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface JournalLayoutContext {
  journals: JournalEntryBase[];
  journalTitle: string;
  setJournalTitle: (title: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (dirty: boolean) => void;
  setPendingNav: (nav: string | null) => void;
}

const JournalLayout: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { authStatus } = useAuth();

  const [journalTitle, setJournalTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const isAddPage = useMemo(
    () => location.pathname === "/journals/add",
    [location.pathname]
  );

  const {
    data: journals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["journals"],
    queryFn: () => getAllJournals(),
    enabled: authStatus === "authenticated",
    staleTime: 60 * 1000, // 1 min cache
  });

  const exists = useMemo(
    () => !id || journals.some((j) => j.id === id),
    [id, journals]
  );

  // Handle guarded navigation away
  useEffect(() => {
    if (pendingNav && !hasUnsavedChanges) {
      navigate(pendingNav);
      setJournalTitle("");
      setPendingNav(null);
    }
  }, [pendingNav, hasUnsavedChanges, navigate]);

  const outletContext = useMemo<JournalLayoutContext>(
    () => ({
      journals,
      journalTitle,
      setJournalTitle,
      hasUnsavedChanges,
      setHasUnsavedChanges,
      setPendingNav,
    }),
    [journals, journalTitle, hasUnsavedChanges]
  );

  return (
    <>
      <JournalSidebarList
        journals={journals}
        isAddPage={isAddPage}
        journalTitle={journalTitle}
        hasUnsavedChanges={hasUnsavedChanges}
        setPendingNav={setPendingNav}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p>Loading journals...</p>
        ) : error ? (
          <p className="text-red-500">
            {error.message || "Unable to load journals."}
          </p>
        ) : !exists ? (
          <div className="text-center text-muted-foreground text-lg py-12">
            <p>No journal found.</p>
            <Button asChild className="mt-4">
              <Link to="/journals/add">Create New Journal</Link>
            </Button>
          </div>
        ) : (
          <Outlet context={outletContext} />
        )}
      </main>

      <ConfirmDialog
        open={!!pendingNav && hasUnsavedChanges}
        onClose={() => setPendingNav(null)}
        onConfirm={() => {
          if (pendingNav) {
            navigate(pendingNav);
            setPendingNav(null);
            setHasUnsavedChanges(false);
            setJournalTitle("");
          }
        }}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave this page? Changes will be lost."
        confirmMessage="Leave"
      />
    </>
  );
};

export default JournalLayout;
