// types/table.d.ts
import type { RowData } from "@tanstack/table-core";

declare module "@tanstack/table-core" {
  interface TableMeta<_TData extends RowData> {
    removeRow?: (id: number) => void;
    invalidate?: () => void;
    /** NEW: immutable per-row updater to force re-render */
    updateRow?: (id: number, patch: Partial<_TData>) => void;
  }
}
