// No runtime import in .d.ts files; type-only is fine.
import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    /** Remove a row by id */
    removeRow?: (id: number) => void;
    /** Force an immutable update of the data array */
    invalidate?: () => void;
    /** Immutable per-row updater so cells re-render */
    updateRow?: (id: number, patch: Partial<TData>) => void;
  }
}
