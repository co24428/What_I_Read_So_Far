"use client";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useStore } from "@/lib/store";
import { STATUS_COLORS } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { NODE_H, NODE_W } from "./layout";

export type BookNodeData = { bookId: string };
export type BookFlowNode = Node<BookNodeData, "book">;

export function BookNode({ data, selected }: NodeProps<BookFlowNode>) {
  const { books } = useStore();
  const { t } = useI18n();
  const book = books.find((b) => b.id === data.bookId);
  const color = book ? STATUS_COLORS[book.status].hex : "#d6d3d1";
  return (
    <div className={`flex items-center gap-2 rounded-xl border-2 bg-white px-2 py-1.5 shadow-sm ${selected ? "ring-4 ring-stone-300" : ""}`}
      style={{ width: NODE_W, height: NODE_H, borderColor: color }}>
      <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !bg-stone-400" />
      {book?.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.cover_url} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-14 w-10 shrink-0 rounded" style={{ background: color, opacity: 0.3 }} />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold leading-tight">{book?.title ?? "?"}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-stone-500">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {book ? t(`status_${book.status}`) : ""}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !bg-stone-600" />
    </div>
  );
}
