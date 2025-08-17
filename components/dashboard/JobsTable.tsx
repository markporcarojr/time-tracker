"use client";

import * as React from "react";
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

import { z } from "zod";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconCircleCheckFilled,
  IconPlayerPlay,
  IconPlayerPause,
  IconDeviceFloppy,
  IconEdit,
} from "@tabler/icons-react";

/* ---------------- types ---------------- */

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export const jobSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["ACTIVE", "PAUSED", "DONE"]),
  startedAt: z.string().datetime().nullable(),
  stoppedAt: z.string().datetime().nullable(),
  totalMs: z.number(),
  userId: z.number(),
});

export type JobRow = z.infer<typeof jobSchema>;

/* ---------------- helpers ---------------- */

function fmtHMSfromMs(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function liveTotalMs(job: JobRow) {
  if (job.status === "ACTIVE" && job.startedAt) {
    const start = new Date(job.startedAt).getTime();
    const now = Date.now();
    return job.totalMs + Math.max(0, now - start);
  }
  return job.totalMs;
}

/* --------------- drag handle -------------- */

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
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
  job: JobRow;
  onPatched: (next: Partial<JobRow>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(job.name);
  const [description, setDescription] = React.useState(job.description ?? "");
  const [status, setStatus] = React.useState<JobStatus>(job.status);
  const [addMinutes, setAddMinutes] = React.useState<number>(0);
  const [busy, setBusy] = React.useState(false);

  const submitPatch = async (payload: any) => {
    setBusy(true);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Update failed");
      return;
    }
    const data = await res.json();
    onPatched(data.job ?? {});
  };

  const saveChanges = () =>
    submitPatch({
      name,
      description: description || null,
      status,
      addMinutes: addMinutes > 0 ? addMinutes : undefined,
    });

  const markDone = () => submitPatch({ status: "DONE" });
  const setActive = () => submitPatch({ status: "ACTIVE" });
  const pause = () => submitPatch({ status: "PAUSED" });
  const resetTotal = () => {
    if (!confirm("Reset total time to 0 and stop the timer?")) return;
    submitPatch({ resetTotal: true, status: "PAUSED" });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {job.name}
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
            <Label htmlFor="j-name">Name</Label>
            <Input
              id="j-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="j-desc">Description</Label>
            <Input
              id="j-desc"
              value={description}
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
              <span className="font-mono">{fmtHMSfromMs(job.totalMs)}</span>
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
              <Button
                size="sm"
                variant="destructive"
                onClick={resetTotal}
                disabled={busy}
              >
                Reset total
              </Button>
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

const columns: ColumnDef<JobRow>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
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
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Job",
    cell: ({ row, table }) => {
      const job = row.original;
      return (
        <div className="flex flex-col">
          <JobDrawer
            job={job}
            onPatched={(next) => {
              // Preferred: immutable optimistic update via meta helper
              table.options.meta?.patchRow?.(row.id, next);
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <Badge variant={s === "ACTIVE" ? "default" : "secondary"}>
          {s === "DONE" ? (
            <IconCircleCheckFilled className="mr-1 size-4" />
          ) : null}
          {s}
        </Badge>
      );
    },
  },
  {
    id: "running",
    header: "Running",
    cell: ({ row }) => {
      const running =
        row.original.status === "ACTIVE" && !!row.original.startedAt;
      return <span className="text-sm">{running ? "Yes" : "No"}</span>;
    },
  },
  {
    id: "total",
    header: () => <div className="w-full text-right">Total</div>,
    cell: ({ row }) => {
      const [_, setNowTick] = React.useState(0);
      const job = row.original;

      React.useEffect(() => {
        if (job.status !== "ACTIVE" || !job.startedAt) return;
        const id = setInterval(() => setNowTick((n) => n + 1), 1000);
        return () => clearInterval(id);
      }, [job.status, job.startedAt]);

      const total = fmtHMSfromMs(liveTotalMs(job));
      return <div className="text-right font-mono">{total}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const job = row.original;
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
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                if (!confirm(`Delete "${job.name}"? This cannot be undone.`))
                  return;
                const res = await fetch(`/api/jobs/${job.id}`, {
                  method: "DELETE",
                });
                if (!res.ok) {
                  alert("Failed to delete");
                  return;
                }
                table.options.meta?.removeRow?.(job.id);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

/* --------------- draggable row --------------- */

function DraggableRow({ row }: { row: Row<JobRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
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
  );
}

/* ---------------- main table ---------------- */

export function JobsTable({ data: initialData }: { data: JobRow[] }) {
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
  const sortableId = React.useId();

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data.map(({ id }) => id),
    [data]
  );

  const table = useReactTable({
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
      removeRow: (id: number | string) =>
        setData((prev) => prev.filter((r) => String(r.id) !== String(id))),
      invalidate: () => setData((prev) => [...prev]),
      patchRow: (rowId, patch) =>
        setData((prev) =>
          prev.map((r) =>
            String(r.id) === String(rowId) ? { ...r, ...patch } : r
          )
        ),
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((curr) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(curr, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} job(s)
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
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
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/jobs/new">
            <Button size="sm">New Job</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
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
