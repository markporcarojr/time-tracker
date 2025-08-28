"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { Job } from "../../types/prisma";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { fmtHMS, liveTotalMs } from "@/lib/utils";
import { JobStatus } from "../../types/prisma";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDeviceFloppy,
  IconDotsVertical,
  IconEdit,
  IconGripVertical,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { Plus } from "lucide-react";

/* ---------------- Types & Schema ---------------- */
/* ---------------- helpers ---------------- */

/* --------------- total cell (uses hooks) -------------- */

function TotalCell({ job }: { job: Job }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (job.status !== "ACTIVE" || !job.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [job.status, job.startedAt]);
  return <div className="text-right font-mono">{fmtHMS(liveTotalMs(job))}</div>;
}

/* --------------- DnD: pass handle props via context -------------- */

type HandleBindings = {
  attributes: React.HTMLAttributes<HTMLButtonElement>;
  listeners: React.DOMAttributes<HTMLButtonElement>;
};

const RowDndCtx = React.createContext<HandleBindings | null>(null);

function DragHandle() {
  const ctx = React.useContext(RowDndCtx);
  return (
    <Button
      {...(ctx?.attributes ?? {})}
      {...(ctx?.listeners ?? {})}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="size-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

/* --------------- drawer (row viewer / quick edit) -------------- */

function JobDrawer({
  job,
  onPatched,
}: {
  job: Job;
  onPatched: (next: Partial<Job>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState(job.customerName);
  const [jobNumber, setJobNumber] = React.useState<string | number>(
    job.jobNumber ?? 0
  );
  const [description, setDescription] = React.useState(job.description ?? "");
  const [status, setStatus] = React.useState<JobStatus>(job.status);
  const [addMinutes, setAddMinutes] = React.useState<number>(0);
  const [busy, setBusy] = React.useState(false);

  type PatchResponse = { job: Job } | Job;

  const submitPatch = async (
    payload: Partial<
      Pick<Job, "customerName" | "description" | "status" | "jobNumber">
    > & {
      addMinutes?: number;
      resetTotal?: boolean;
    }
  ) => {
    setBusy(true);
    try {
      const promise: Promise<PatchResponse> = (async () => {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
        if (!res.ok) {
          const ct = res.headers.get("content-type") || "";
          let message = `Update failed (${res.status})`;
          try {
            if (ct.includes("application/json")) {
              const j = await res.json();
              message =
                (j as { message?: string; error?: string })?.message ||
                (j as { message?: string; error?: string })?.error ||
                message;
            } else {
              const t = await res.text();
              message = t || message;
            }
          } catch {}
          throw new Error(message);
        }
        return (await res.json()) as PatchResponse;
      })();

      await toast.promise(promise, {
        loading: "Saving changes…",
        success: "Job updated",
        error: (err: unknown) =>
          err instanceof Error ? err.message : "Update failed",
      });

      const data = await promise;
      onPatched("job" in data ? data.job : data);
      // setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const saveChanges = () =>
    submitPatch({
      customerName,
      jobNumber:
        jobNumber === ""
          ? null
          : typeof jobNumber === "string"
          ? Number(jobNumber)
          : jobNumber,
      description: description || null,
      status,
      addMinutes: addMinutes > 0 ? addMinutes : undefined,
    });

  const markDone = () => submitPatch({ status: "DONE" });
  const setActive = () => submitPatch({ status: "ACTIVE" });
  const pause = () => submitPatch({ status: "PAUSED" });

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {job.customerName}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="min-w-[360px]">
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-2">
            <IconEdit className="size-4" />
            Edit Job
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
          <div className="grid gap-3">
            <Label htmlFor="j-name">Customer Name</Label>
            <Input
              id="j-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="j-number">Job Number</Label>
            <Input
              id="j-number"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="j-desc">Description</Label>
            <Input
              id="j-desc"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as JobStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="PAUSED">PAUSED</SelectItem>
                <SelectItem value="DONE">DONE</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Switching away from ACTIVE will add elapsed time and stop the
              timer. Setting ACTIVE starts it now.
            </p>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="j-add">Add manual minutes</Label>
            <div className="flex gap-2">
              <Input
                id="j-add"
                type="number"
                min={0}
                className="max-w-[140px]"
                value={Number.isNaN(addMinutes) ? 0 : addMinutes}
                onChange={(e) => setAddMinutes(Number(e.target.value) || 0)}
              />
              <Button variant="secondary" disabled={busy} onClick={saveChanges}>
                <IconDeviceFloppy className="mr-2 size-4" />
                Add & Save
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2">
            <div className="text-sm">
              Saved total:{" "}
              <span className="font-mono">{fmtHMS(job.totalMs)}</span>
              {job.status === "ACTIVE" && job.startedAt ? (
                <span className="ml-2 text-muted-foreground">
                  (running since {new Date(job.startedAt).toLocaleString()})
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={setActive} disabled={busy}>
                <IconPlayerPlay className="mr-2 size-4" />
                Set ACTIVE
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={pause}
                disabled={busy}
              >
                <IconPlayerPause className="mr-2 size-4" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={markDone}
                disabled={busy}
              >
                <IconCircleCheckFilled className="mr-2 size-4" />
                Mark DONE
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={busy}>
                    Reset total
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset total time?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will set total time to 0 and pause the timer. You
                      cannot undo this action.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        submitPatch({ resetTotal: true, status: "PAUSED" })
                      }
                    >
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button onClick={saveChanges} disabled={busy}>
              <IconDeviceFloppy className="mr-2 size-4" />
              Save changes
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
            <Link
              href={`/jobs/${job.id}`}
              className="ml-auto underline text-sm text-muted-foreground hover:text-foreground"
            >
              Open Job Page
            </Link>
          </div>
        </div>

        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}

/* ---------------- table columns ---------------- */

type Checked = boolean | "indeterminate";

export const columns: ColumnDef<Job>[] = [
  {
    id: "drag",
    header: () => null,
    cell: () => (
      <div className="w-8">
        <DragHandle />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(checked: Checked) =>
            table.toggleAllPageRowsSelected(!!checked)
          }
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked: Checked) => row.toggleSelected(!!checked)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "customerName",
    header: "Job",
    cell: ({ row, table }) => {
      const job = row.original;
      return (
        <div className="flex flex-col">
          <JobDrawer
            job={job}
            onPatched={(next) => {
              // IMPORTANT: immutable replace so TanStack Table re-renders
              table.options.meta?.updateRow?.(job.id, next);
            }}
          />
          {job.description ? (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {job.description}
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "jobNumber",
    header: "Job #",
    cell: ({ row }) => {
      const jobNumber = row.original.jobNumber;
      return (
        <div className="text-left">
          {typeof jobNumber === "number"
            ? jobNumber.toString().padStart(4, "0")
            : "-"}
        </div>
      );
    },
  },
  {
    id: "total",
    header: () => <div className="w-full text-right">Total Hrs</div>,
    cell: ({ row }) => <TotalCell job={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const job = row.original;

      const doDelete = async () => {
        const p = fetch(`/api/jobs/${job.id}`, { method: "DELETE" }).then(
          async (res) => {
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              throw new Error(text || "Delete failed");
            }
          }
        );

        toast.promise(p, {
          loading: "Deleting…",
          success: "Job deleted",
          error: (err: unknown) =>
            err instanceof Error ? err.message : "Delete failed",
        });

        table.options.meta?.removeRow?.(job.id);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}`}>Open</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 focus:text-white"
                >
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete “{job.customerName}”?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action permanently removes the job and its timing data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={doDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

/* --------------- draggable row --------------- */

function DraggableRow({ row }: { row: Row<Job> }) {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: row.original.id });

  const handleBindings: HandleBindings = {
    attributes: attributes as React.HTMLAttributes<HTMLButtonElement>,
    listeners: (listeners ?? {}) as React.DOMAttributes<HTMLButtonElement>,
  };

  return (
    <RowDndCtx.Provider value={handleBindings}>
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
        style={{ transform: CSS.Transform.toString(transform), transition }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </RowDndCtx.Provider>
  );
}

/* ---------------- main table ---------------- */

export function JobsTable({ data: initialData }: { data: Job[] }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data.map(({ id }) => id),
    [data]
  );

  const table = useReactTable<Job>({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      removeRow: (id: number) =>
        setData((prev) => prev.filter((r) => r.id !== id)),
      invalidate: () => setData((prev) => [...prev]),
      /** NEW: immutable row replacement so cells re-render */
      updateRow: (id: number, patch: Partial<Job>) =>
        setData((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
        ),
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setData((curr) => {
      const ids = curr.map((r) => r.id) as UniqueIdentifier[];
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return curr;
      return arrayMove(curr, oldIndex, newIndex);
    });
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} job(s)
        </div>
        <div className="flex items-center gap-2">
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
                <IconChevronDown className="ml-1 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value: boolean) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu> */}
          <Button
            asChild
            className="
              rounded-full px-5 py-5 text-base font-medium
              bg-gradient-to-r from-primary to-primary/70 text-primary-foreground
              shadow-sm hover:opacity-95 mb-2            "
          >
            <Link href="/jobs/new" aria-label="Create new job">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
