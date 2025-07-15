import { Button } from "@/components/ui/Button";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmMessage?: string;
  requiresInputConfirmation?: boolean;
  requiredText?: string;
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmMessage = "Confirm",
  requiresInputConfirmation = false,
  requiredText = "DELETE",
  loading = false,
}: ConfirmDialogProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setInput("");
    if (open && requiresInputConfirmation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, requiresInputConfirmation]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl max-w-md w-full outline-none">
          <DialogTitle className="text-lg font-semibold text-foreground mb-2">
            {title}
          </DialogTitle>
          <div className="text-sm text-muted-foreground mb-4">{message}</div>
          {requiresInputConfirmation && (
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Type "${requiredText}" to confirm`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-3 py-2 border border-muted-foreground/30 rounded-lg text-sm bg-background text-foreground"
                aria-label={`Type "${requiredText}" to confirm`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim() !== requiredText) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={
                loading ||
                (requiresInputConfirmation && input.trim() !== requiredText)
              }
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                confirmMessage
              )}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
