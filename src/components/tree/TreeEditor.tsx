"use client";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider,
  addEdge, useEdgesState, useNodesState, useReactFlow,
  type Connection, type Edge, type EdgeChangeset, type NodeChangeset,
} from "@xyflow/react";
import type { Book, Relation, TreeEdge, TreeNode } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button, Cover, StatusSelect, inputCls } from "../ui";
import { BookNode, type BookFlowNode } from "./BookNode";
import { autoLayout, NODE_H, NODE_W } from "./layout";

const nodeTypes = { book: BookNode };
const RELATION_STYLE: Record<Relation, { stroke: string; dash?: string }> = {
  mentioned: { stroke: "#6366f1" },
  inspired: { stroke: "#db2777" },
  other: { stroke: "#a8a29e", dash: "6 4" },
};
type EdgeData = { relation: Relation; note: string | null };
type FlowEdge = Edge<EdgeData>;

function styleEdge(e: FlowEdge, label: string): FlowEdge {
  const r = RELATION_STYLE[e.data?.relation ?? "inspired"];
  return {
    ...e,
    type: "smoothstep",
    label: e.data?.note ? `${label} · ${e.data.note}` : label,
    labelStyle: { fontSize: 10, fill: "#57534e" },
    labelBgStyle: { fill: "#fafaf9" },
    style: { stroke: r.stroke, strokeWidth: 2, strokeDasharray: r.dash },
    markerEnd: { type: MarkerType.ArrowClosed, color: r.stroke },
  };
}

export function TreeEditor({ treeId }: { treeId: string }) {
  return (
    <ReactFlowProvider>
      <Editor key={treeId} treeId={treeId} />
    </ReactFlowProvider>
  );
}

function Editor({ treeId }: { treeId: string }) {
  const { t } = useI18n();
  const { books, openBook, openAdd, upsertLocal } = useStore();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<BookFlowNode>([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<FlowEdge>([]);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0); // bump = unsaved change
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [filter, setFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false); // phone: book list as bottom sheet
  const wrapper = useRef<HTMLDivElement>(null);
  const dirty = useCallback(() => setVersion((v) => v + 1), []);

  const relLabel = useCallback((r: Relation) => t(`relation_${r}`), [t]);

  // Load graph
  useEffect(() => {
    let alive = true;
    api<{ nodes: TreeNode[]; edges: TreeEdge[] }>(`/api/trees/${treeId}/graph`).then((g) => {
      if (!alive) return;
      setNodes(g.nodes.map((n) => ({ id: n.id, type: "book", position: { x: n.x, y: n.y }, data: { bookId: n.book_id } })));
      setEdges(g.edges.map((e) => ({ id: e.id, source: e.from_node, target: e.to_node, data: { relation: e.relation, note: e.note } })));
      setLoaded(true);
      setTimeout(() => fitView({ padding: 0.2, maxZoom: 1.2 }), 50);
    });
    return () => { alive = false; };
  }, [treeId, setNodes, setEdges, fitView]);

  // Debounced autosave
  useEffect(() => {
    if (!loaded || version === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect pending save
    setSaveState("unsaved");
    const h = setTimeout(async () => {
      setSaveState("saving");
      try {
        await api(`/api/trees/${treeId}/graph`, {
          method: "PUT",
          body: {
            nodes: nodes.map((n) => ({ id: n.id, book_id: n.data.bookId, x: n.position.x, y: n.position.y })),
            edges: edges.map((e) => ({ id: e.id, from_node: e.source, to_node: e.target, relation: e.data?.relation ?? "inspired", note: e.data?.note ?? null })),
          },
        });
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
      }
    }, 700);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save only when version bumps
  }, [version]);

  const onNodesChange = useCallback((changes: NodeChangeset<BookFlowNode>) => {
    const meaningful = changes.toArray().some((c) => c.type === "remove" || (c.type === "position" && c.dragging === false));
    onNodesChangeBase(changes);
    if (meaningful) dirty();
  }, [onNodesChangeBase, dirty]);

  const onEdgesChange = useCallback((changes: EdgeChangeset<FlowEdge>) => {
    const meaningful = changes.toArray().some((c) => c.type === "remove");
    onEdgesChangeBase(changes);
    if (meaningful) dirty();
  }, [onEdgesChangeBase, dirty]);

  const onConnect = useCallback((c: Connection) => {
    if (c.source === c.target) return;
    setEdges((es) => addEdge({ ...c, id: crypto.randomUUID(), data: { relation: "inspired", note: null } }, es));
    dirty();
  }, [setEdges, dirty]);

  const inTree = useMemo(() => new Set(nodes.map((n) => n.data.bookId)), [nodes]);

  const addBookNode = useCallback((bookId: string, pos?: { x: number; y: number }) => {
    setNodes((ns) => {
      if (ns.some((n) => n.data.bookId === bookId)) return ns;
      let position = pos;
      if (!position) {
        const r = wrapper.current?.getBoundingClientRect();
        position = r ? screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 };
        position = { x: position.x - NODE_W / 2 + (Math.random() - 0.5) * 60, y: position.y - NODE_H / 2 + (Math.random() - 0.5) * 60 };
      }
      return [...ns, { id: crypto.randomUUID(), type: "book", position, data: { bookId } }];
    });
    dirty();
  }, [setNodes, screenToFlowPosition, dirty]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const bookId = e.dataTransfer.getData("application/x-book-id");
    if (!bookId) return;
    const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addBookNode(bookId, { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 });
  };

  const doLayout = () => {
    setNodes((ns) => autoLayout(ns, edges));
    dirty();
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  };

  const selectedNode = nodes.find((n) => n.selected);
  const selectedEdge = edges.find((e) => e.selected);
  const selectedBook = selectedNode ? books.find((b) => b.id === selectedNode.data.bookId) : undefined;

  const setBookStatus = async (b: Book, status: Book["status"]) => {
    upsertLocal(await api<Book>(`/api/books/${b.id}`, { method: "PATCH", body: { status } }));
  };
  const updateEdge = (id: string, patch: Partial<EdgeData>) => {
    setEdges((es) => es.map((e) => (e.id === id ? { ...e, data: { ...(e.data as EdgeData), ...patch } } : e)));
    dirty();
  };

  const styledEdges = useMemo(() => edges.map((e) => styleEdge(e, relLabel(e.data?.relation ?? "inspired"))), [edges, relLabel]);
  const listBooks = books.filter((b) => !filter || b.title.toLowerCase().includes(filter.toLowerCase()) || b.authors.some((a) => a.toLowerCase().includes(filter.toLowerCase())));

  return (
    <div className="flex min-h-0 flex-1 gap-3">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm" ref={wrapper}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes} edges={styledEdges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onNodeDoubleClick={(_, n) => openBook(n.data.bookId)}
          deleteKeyCode={["Backspace", "Delete"]}
          minZoom={0.2} maxZoom={2} proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#e7e5e4" />
          <Controls showInteractive={false} className="!hidden md:!flex" />
          <MiniMap className="!hidden md:!block" pannable zoomable nodeColor={(n) => {
            const b = books.find((x) => x.id === (n as BookFlowNode).data.bookId);
            return b ? STATUS_COLORS[b.status].hex : "#d6d3d1";
          }} />
        </ReactFlow>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Button variant="outline" className="bg-white" onClick={doLayout}>⇅ {t("autoLayout")}</Button>
          <span className="text-xs text-stone-400">{t(saveState)}</span>
        </div>
        <p className="pointer-events-none absolute left-3 top-14 max-w-[16rem] text-[11px] leading-snug text-stone-400">
          <span className="hidden md:inline">{t("treeHelp")}</span>
          <span className="md:hidden">{t("treeHelpTouch")}</span>
        </p>
        <div className="absolute bottom-3 right-3 md:hidden"><Button className="shadow-lg" onClick={() => setSheetOpen(true)}>📚 {t("addToTree")}</Button></div>

        {(selectedBook || selectedEdge) && (
          <div className="absolute inset-x-3 bottom-3 z-10 space-y-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg md:inset-x-auto md:bottom-auto md:right-3 md:top-3 md:w-64">
            {selectedBook && selectedNode && (
              <>
                <p className="text-sm font-semibold">{selectedBook.title}</p>
                <StatusSelect value={selectedBook.status} onChange={(s) => setBookStatus(selectedBook, s)} />
                <div className="flex gap-1">
                  <Button variant="outline" onClick={() => openBook(selectedBook.id)}>{t("openDetail")}</Button>
                  <Button variant="danger" onClick={() => {
                    setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id));
                    setEdges((es) => es.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                    dirty();
                  }}>{t("removeFromTree")}</Button>
                </div>
              </>
            )}
            {selectedEdge && !selectedBook && (
              <>
                <p className="text-xs font-medium text-stone-500">{t("relation")}</p>
                <div className="flex flex-wrap gap-1">
                  {(["mentioned", "inspired", "other"] as Relation[]).map((r) => (
                    <button key={r} onClick={() => updateEdge(selectedEdge.id, { relation: r })}
                      className={`rounded-full border px-2.5 py-1 text-xs ${selectedEdge.data?.relation === r ? "text-white" : "text-stone-600"}`}
                      style={selectedEdge.data?.relation === r ? { background: RELATION_STYLE[r].stroke, borderColor: RELATION_STYLE[r].stroke } : undefined}>
                      {relLabel(r)}
                    </button>
                  ))}
                </div>
                <input className={inputCls} placeholder={t("note")} value={selectedEdge.data?.note ?? ""}
                  onChange={(e) => updateEdge(selectedEdge.id, { note: e.target.value || null })} />
                <Button variant="danger" onClick={() => { setEdges((es) => es.filter((e) => e.id !== selectedEdge.id)); dirty(); }}>
                  {t("delete")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Book list — desktop: right column; phone: bottom sheet */}
      {sheetOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSheetOpen(false)} />}
      <aside className={`pb-safe flex-col bg-white p-3 md:static md:flex md:w-60 md:shrink-0 md:rounded-2xl md:shadow-sm ${
        sheetOpen ? "fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] rounded-t-2xl shadow-2xl" : "hidden"}`}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("myBooks")}</h3>
          <span className="md:hidden"><Button variant="ghost" onClick={() => setSheetOpen(false)}>{t("done")}</Button></span>
        </div>
        <p className="mb-2 text-[11px] text-stone-400">
          <span className="hidden md:inline">{t("dragHint")}</span><span className="md:hidden">{t("tapToAdd")}</span>
        </p>
        <input className={`${inputCls} mb-2`} placeholder={t("search")} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Button variant="outline" className="mb-2" onClick={() => { setSheetOpen(false); openAdd({ status: "want", onAdded: (b) => addBookNode(b.id) }); }}>
          ＋ {t("addNewToTree")}
        </Button>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {listBooks.map((b) => {
            const used = inTree.has(b.id);
            return (
              <li key={b.id} draggable={!used}
                onDragStart={(e) => { e.dataTransfer.setData("application/x-book-id", b.id); e.dataTransfer.effectAllowed = "move"; }}
                onDoubleClick={() => !used && addBookNode(b.id)}
                onClick={() => { if (!used && sheetOpen) addBookNode(b.id); }}
                className={`flex items-center gap-2 rounded-lg p-1.5 ${used ? "opacity-40" : "cursor-grab hover:bg-stone-100 active:bg-stone-100"}`}>
                <Cover src={b.cover_url} title="" className="h-10 w-7 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{b.title}</p>
                  <p className="flex items-center gap-1 text-[10px] text-stone-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[b.status].hex }} />
                    {t(`status_${b.status}`)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
