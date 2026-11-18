export type BookStatus = "want" | "soon" | "reading" | "done";
export const STATUSES: BookStatus[] = ["want", "soon", "reading", "done"];

export const STATUS_COLORS: Record<BookStatus, { bg: string; text: string; hex: string }> = {
  want: { bg: "bg-slate-400", text: "text-slate-700", hex: "#94a3b8" },
  soon: { bg: "bg-amber-400", text: "text-amber-700", hex: "#f59e0b" },
  reading: { bg: "bg-sky-500", text: "text-sky-700", hex: "#0ea5e9" },
  done: { bg: "bg-emerald-500", text: "text-emerald-700", hex: "#10b981" },
};

export interface Book {
  id: string;
  isbn13: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  translators: string[];
  publisher: string | null;
  published_date: string | null;
  cover_url: string | null;
  total_pages: number | null;
  genre: string | null;
  description: string | null;
  source: string;
  status: BookStatus;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  current_page: number;
  created_at: string;
  updated_at: string;
}

export type BookInput = Partial<Omit<Book, "id" | "created_at" | "updated_at">>;

export interface ProgressLog {
  id: string;
  book_id: string;
  page: number;
  logged_on: string;
  created_at: string;
}

export interface Review {
  id: string;
  book_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Tree {
  id: string;
  nickname: string;
  description: string | null;
  color: string;
  sort_order: number;
}

export interface TreeNode {
  id: string;
  tree_id: string;
  book_id: string;
  x: number;
  y: number;
}

export type Relation = "mentioned" | "inspired" | "other";

export interface TreeEdge {
  id: string;
  tree_id: string;
  from_node: string;
  to_node: string;
  relation: Relation;
  note: string | null;
}

/** A search result candidate built from Kakao + NLK. */
export interface BookCandidate extends BookInput {
  title: string;
}
