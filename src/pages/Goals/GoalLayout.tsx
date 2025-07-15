import { useEffect, useState, useMemo, useCallback } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  Outlet,
  Link,
} from "react-router-dom";
import GoalSidebarList from "@/pages/Goals/GoalSidebar";
import { Button } from "@/components/ui/Button";
import { GoalBase } from "@/types/goal";
import { getAllGoals } from "@/lib/goalService";
import { getAllJournals } from "@/lib/journalService";
import { JournalEntryBase } from "@/types/journal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/provider";
import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";

export interface GoalLayoutContext {
  goals: GoalBase[];
  journals: JournalEntryBase[];
  setGoalTitle: (title: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (v: boolean) => void;
  setPendingNav: (nav: string | null) => void;
}

const GoalLayout: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { authStatus } = useAuth();

  const [goalTitle, setGoalTitle] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const isAddPage = useMemo(
    () => location.pathname === "/goals/add",
    [location.pathname]
  );

  const results = useQueries<
    [UseQueryResult<JournalEntryBase[]>, UseQueryResult<GoalBase[]>]
  >({
    queries: [
      {
        queryKey: ["journals"],
        queryFn: () => getAllJournals(),
        enabled: authStatus === "authenticated",
        staleTime: 60 * 1000, // 1 min cache
      },
      {
        queryKey: ["goals"],
        queryFn: () => getAllGoals(),
        enabled: authStatus === "authenticated",
        staleTime: 60 * 1000, // 1 min cache
      },
    ],
  });

  const [{ data: journals }, { data: goals, isLoading, error }] = results;

  const safeGoals = goals ?? [];
  const safeJournals = journals ?? [];

  const exists = useMemo(() => {
    return !id || safeGoals.some((j) => j.id === id);
  }, [id, safeGoals]);

  // Auto-navigate if no unsaved changes
  useEffect(() => {
    if (pendingNav && !hasUnsavedChanges) {
      navigate(pendingNav);
      setGoalTitle("");
      setPendingNav(null);
    }
  }, [pendingNav, hasUnsavedChanges, navigate]);

  const outletContext = useMemo<GoalLayoutContext>(
    () => ({
      goals: safeGoals,
      journals: safeJournals,
      goalTitle,
      setGoalTitle,
      hasUnsavedChanges,
      setHasUnsavedChanges,
      setPendingNav,
    }),
    [safeGoals, goalTitle, hasUnsavedChanges, safeJournals]
  );

  return (
    <>
      <GoalSidebarList
        goals={goals}
        isAddPage={isAddPage}
        goalTitle={goalTitle}
        hasUnsavedChanges={hasUnsavedChanges}
        setPendingNav={setPendingNav}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p>Loading goals...</p>
        ) : error ? (
          <p className="text-red-500">
            {error.message || "Unable to load goals."}
          </p>
        ) : !exists ? (
          <div className="text-center text-muted-foreground text-lg py-12">
            <p>No goal found.</p>
            <Button asChild className="mt-4">
              <Link to="/goals/add">Create New Goal</Link>
            </Button>
          </div>
        ) : (
          <Outlet context={outletContext} />
        )}
      </div>

      <ConfirmDialog
        open={!!pendingNav && hasUnsavedChanges}
        onClose={() => setPendingNav(null)}
        onConfirm={() => {
          if (pendingNav) {
            navigate(pendingNav);
            setPendingNav(null);
            setHasUnsavedChanges(false);
            setGoalTitle("");
          }
        }}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave this page? Changes will be lost."
        confirmMessage="Leave"
      />
    </>
  );
};

export default GoalLayout;
