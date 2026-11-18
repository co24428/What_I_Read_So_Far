"use client";
import { useEffect, useState } from "react";
import type { Tree } from "@/lib/types";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { Button, inputCls } from "@/components/ui";
import { TreeEditor } from "@/components/tree/TreeEditor";
import { PageTransition } from "@/components/PageTransition";

const COLORS = ["#6366f1", "#db2777", "#0ea5e9", "#10b981", "#f59e0b", "#78716c"];

export default function TreePage() {
  const { t } = useI18n();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [mobileEdit, setMobileEdit] = useState(false);
  const current = trees.find((x) => x.id === selected);

  useEffect(() => {
    api<Tree[]>("/api/trees").then((ts) => {
      setTrees(ts);
      setSelected((s) => s ?? ts[0]?.id ?? null);
    });
  }, []);

  const createNamed = async (name: string) => {
    const tree = await api<Tree>("/api/trees", { method: "POST", body: { nickname: name.trim(), color: COLORS[trees.length % COLORS.length] } });
    setTrees((ts) => [...ts, tree]);
    setSelected(tree.id);
  };
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createNamed(newName);
    setNewName("");
  };
  const patch = async (id: string, body: Partial<Tree>) => {
    const tree = await api<Tree>(`/api/trees/${id}`, { method: "PATCH", body });
    setTrees((ts) => ts.map((x) => (x.id === id ? tree : x)));
  };
  const remove = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    await api(`/api/trees/${id}`, { method: "DELETE" });
    const rest = trees.filter((x) => x.id !== id);
    setTrees(rest);
    if (selected === id) setSelected(rest[0]?.id ?? null);
  };
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= trees.length) return;
    const next = [...trees];
    [next[i], next[j]] = [next[j], next[i]];
    const ordered = next.map((x, k) => ({ ...x, sort_order: k }));
    setTrees(ordered);
    await api("/api/trees", { method: "PATCH", body: ordered.map((x) => ({ id: x.id, sort_order: x.sort_order })) });
  };

  return (
    <PageTransition>
    <div className="flex h-[calc(100dvh_-_11.5rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] flex-col gap-2 md:h-[calc(100vh_-_7rem)] md:flex-row md:gap-3">
      {/* Phone: compact tree picker */}
      <div className="flex shrink-0 items-center gap-1.5 md:hidden">
        {current && <span className="h-3 w-3 shrink-0 rounded" style={{ background: current.color }} />}
        <select className={`${inputCls} min-w-0 flex-1`} value={selected ?? ""} onChange={(e) => setSelected(e.target.value || null)}>
          {trees.length === 0 && <option value="">{t("selectTree")}</option>}
          {trees.map((tr) => <option key={tr.id} value={tr.id}>{tr.nickname}</option>)}
        </select>
        {current && (
          <Button variant="outline" onClick={() => setMobileEdit((v) => !v)} title={t("edit")}>✎</Button>
        )}
        <Button onClick={() => {
          const name = prompt(t("treeNickname"));
          if (name?.trim()) void createNamed(name);
        }}>＋</Button>
      </div>
      {mobileEdit && current && (
        <div className="shrink-0 space-y-2 rounded-xl bg-white p-3 shadow-sm md:hidden">
          <input className={inputCls} defaultValue={current.nickname}
            onBlur={(e) => e.target.value.trim() && e.target.value !== current.nickname && patch(current.id, { nickname: e.target.value.trim() })} />
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} onClick={() => patch(current.id, { color: c })}
                className={`h-7 w-7 rounded-full ${current.color === c ? "ring-2 ring-stone-400 ring-offset-1" : ""}`} style={{ background: c }} />
            ))}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" onClick={() => move(trees.indexOf(current), -1)}>↑ {t("moveUp")}</Button>
            <Button variant="outline" onClick={() => move(trees.indexOf(current), 1)}>↓ {t("moveDown")}</Button>
            <Button variant="danger" className="ml-auto" onClick={() => { setMobileEdit(false); void remove(current.id); }}>{t("delete")}</Button>
          </div>
        </div>
      )}

      <aside className="hidden w-56 shrink-0 flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-900/5 md:flex">
        <h3 className="mb-2 text-sm font-semibold">{t("trees")}</h3>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {trees.map((tr, i) => (
            <li key={tr.id} className={`group rounded-xl transition-all duration-150 ${selected === tr.id ? "bg-stone-100 shadow-sm" : "hover:translate-x-0.5 hover:bg-stone-50"}`}>
              {editing === tr.id ? (
                <form className="space-y-1.5 p-1.5" onSubmit={(e) => { e.preventDefault(); void patch(tr.id, { nickname: editName }); setEditing(null); }}>
                  <input autoFocus className={inputCls} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button type="button" key={c} onClick={() => patch(tr.id, { color: c })}
                        className={`h-5 w-5 rounded-full ${tr.color === c ? "ring-2 ring-stone-400 ring-offset-1" : ""}`} style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button type="submit" className="!px-2 !py-1 text-xs">{t("save")}</Button>
                    <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => remove(tr.id)}>{t("delete")}</Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center">
                  <button onClick={() => setSelected(tr.id)} onDoubleClick={() => { setEditing(tr.id); setEditName(tr.nickname); }}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm">
                    <span className={`h-3 w-3 shrink-0 rounded transition-transform duration-200 ${selected === tr.id ? "scale-125" : "group-hover:scale-110"}`} style={{ background: tr.color }} />
                    <span className="truncate">{tr.nickname}</span>
                  </button>
                  <div className="hidden shrink-0 text-xs text-stone-400 group-hover:flex">
                    <button title={t("moveUp")} className="px-1 hover:text-stone-800" onClick={() => move(i, -1)}>↑</button>
                    <button title={t("moveDown")} className="px-1 hover:text-stone-800" onClick={() => move(i, 1)}>↓</button>
                    <button title={t("edit")} className="px-1 hover:text-stone-800" onClick={() => { setEditing(tr.id); setEditName(tr.nickname); }}>✎</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={create} className="mt-2 flex gap-1">
          <input className={inputCls} placeholder={t("treeNickname")} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="submit" className="shrink-0">＋</Button>
        </form>
      </aside>

      {selected ? (
        <TreeEditor treeId={selected} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl bg-white text-sm text-stone-400 shadow-sm">{t("selectTree")}</div>
      )}
    </div>
    </PageTransition>
  );
}
