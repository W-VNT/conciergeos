"use client";

import { useEffect } from "react";

/**
 * Warns the user before leaving a page with unsaved form changes.
 * Uses the browser's native `beforeunload` event.
 *
 * @param isDirty - Whether the form has unsaved changes (from react-hook-form formState.isDirty)
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
