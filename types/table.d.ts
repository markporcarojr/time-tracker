// types/table.d.ts
import type { RowData } from "@tanstack/table-core";

declare module "@tanstack/table-core" {
  interface TableMeta<_TData extends RowData> {
    removeRow?: (id: number) => void;
    invalidate?: () => void;
  }
}
