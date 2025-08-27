// types/table.d.ts
import type { RowData } from "@tanstack/table-core";

/* ---------- Table meta typing so cells can call helpers ---------- */
declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    removeRow?: (id: number) => void;
    invalidate?: () => void;
    /** NEW: immutable per-row updater to force re-render */
    updateRow?: (id: number, patch: Partial<TData>) => void;
  }
}
