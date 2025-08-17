// Ensure this file is included by "include" or "files" in tsconfig.json
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    removeRow?: (id: number | string) => void;
    invalidate?: () => void;
    patchRow?: (rowId: string, patch: Partial<TData>) => void;
  }
}
