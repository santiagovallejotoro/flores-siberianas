"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import ConfirmDialog, { type ConfirmTone } from "./ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /**
   * If provided, the dialog stays open and shows a spinner on the confirm
   * button until the action resolves. Throw to surface an error to the caller.
   */
  onConfirm?: () => void | Promise<void>;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface DialogState {
  open: boolean;
  busy: boolean;
  opts: ConfirmOptions;
}

const INITIAL: DialogState = {
  open: false,
  busy: false,
  opts: { title: "" },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(INITIAL);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false, busy: false }));
  }, []);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // If a previous dialog is still mounted, resolve it as cancelled.
    resolverRef.current?.(false);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, busy: false, opts });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    const action = state.opts.onConfirm;
    if (!action) {
      close(true);
      return;
    }
    setState((prev) => ({ ...prev, busy: true }));
    try {
      await action();
      close(true);
    } catch {
      // The caller is responsible for surfacing the error message.
      // Re-enable the buttons so the user can retry or cancel.
      setState((prev) => ({ ...prev, busy: false }));
    }
  }, [state.opts, close]);

  const handleCancel = useCallback(() => {
    if (state.busy) return;
    close(false);
  }, [state.busy, close]);

  const ctx = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={ctx}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.opts.title}
        description={state.opts.description}
        confirmLabel={state.opts.confirmLabel}
        cancelLabel={state.opts.cancelLabel}
        tone={state.opts.tone}
        busy={state.busy}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx;
}
