"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ko" | "en";

const dict = {
  appName: { ko: "지금까지 읽은 책", en: "What I Read So Far" },
  navCalendar: { ko: "캘린더", en: "Calendar" },
  navLibrary: { ko: "서재", en: "Library" },
  navStats: { ko: "통계", en: "Stats" },
  navTree: { ko: "책 트리", en: "Book Tree" },
  addBook: { ko: "책 추가", en: "Add book" },
  logout: { ko: "로그아웃", en: "Log out" },

  password: { ko: "비밀번호", en: "Password" },
  enter: { ko: "들어가기", en: "Enter" },
  wrongPassword: { ko: "비밀번호가 틀렸어요", en: "Wrong password" },

  status_want: { ko: "읽고 싶음", en: "Want to read" },
  status_soon: { ko: "곧 읽을 책", en: "Soon" },
  status_reading: { ko: "읽는 중", en: "Reading" },
  status_done: { ko: "다 읽음", en: "Done" },
  all: { ko: "전체", en: "All" },

  title: { ko: "제목", en: "Title" },
  subtitle: { ko: "부제", en: "Subtitle" },
  authors: { ko: "저자", en: "Writers" },
  translators: { ko: "역자", en: "Translators" },
  publisher: { ko: "출판사", en: "Publisher" },
  publishedDate: { ko: "출간일", en: "Published" },
  genre: { ko: "장르", en: "Genre" },
  pages: { ko: "페이지", en: "Pages" },
  totalPages: { ko: "전체 페이지", en: "Total pages" },
  isbn: { ko: "ISBN", en: "ISBN" },
  coverUrl: { ko: "표지 이미지 URL", en: "Cover image URL" },
  description: { ko: "책 소개", en: "Description" },
  status: { ko: "상태", en: "Status" },
  startedAt: { ko: "시작일", en: "Started" },
  finishedAt: { ko: "완독일", en: "Finished" },
  rating: { ko: "내 별점", en: "My score" },
  progress: { ko: "진행률", en: "Progress" },
  commaHint: { ko: "쉼표로 구분", en: "comma separated" },

  search: { ko: "검색", en: "Search" },
  searchPlaceholder: { ko: "책 제목, 저자 또는 ISBN", en: "Title, writer or ISBN" },
  manualEntry: { ko: "직접 입력", en: "Enter manually" },
  noResults: { ko: "검색 결과가 없어요", en: "No results" },
  loading: { ko: "불러오는 중…", en: "Loading…" },
  save: { ko: "저장", en: "Save" },
  cancel: { ko: "취소", en: "Cancel" },
  edit: { ko: "수정", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  close: { ko: "닫기", en: "Close" },
  back: { ko: "뒤로", en: "Back" },
  confirmDelete: { ko: "정말 삭제할까요?", en: "Delete this?" },

  logProgress: { ko: "읽은 페이지 기록", en: "Log progress" },
  nowOnPage: { ko: "지금 페이지", en: "Now on page" },
  record: { ko: "기록", en: "Log" },
  history: { ko: "기록 내역", en: "History" },

  reviews: { ko: "나의 리뷰", en: "My reviews" },
  writeReview: { ko: "생각을 남겨보세요…", en: "Write your thoughts…" },
  post: { ko: "남기기", en: "Post" },
  noReviews: { ko: "아직 리뷰가 없어요", en: "No reviews yet" },

  today: { ko: "오늘", en: "Today" },
  noBooksInMonth: { ko: "이 달에 읽은 책이 없어요", en: "No books this month" },
  weekdays: { ko: "일,월,화,수,목,금,토", en: "Sun,Mon,Tue,Wed,Thu,Fri,Sat" },

  sortBy: { ko: "정렬", en: "Sort" },
  books: { ko: "권", en: "books" },
  tableView: { ko: "표", en: "Table" },
  cardView: { ko: "카드", en: "Cards" },
  filterGenre: { ko: "장르 필터", en: "Genre filter" },
  emptyLibrary: { ko: "아직 책이 없어요. 첫 책을 추가해보세요!", en: "No books yet. Add your first one!" },

  year: { ko: "연도", en: "Year" },
  pagesRead: { ko: "읽은 페이지", en: "Pages read" },
  booksFinished: { ko: "완독한 책", en: "Books finished" },
  booksStarted: { ko: "시작한 책", en: "Books started" },
  avgRating: { ko: "평균 별점", en: "Avg. score" },
  byMonth: { ko: "월별", en: "By month" },
  byYear: { ko: "연도별", en: "By year" },
  topGenres: { ko: "장르", en: "Genres" },
  topAuthors: { ko: "많이 읽은 저자", en: "Top writers" },
  topPublishers: { ko: "많이 읽은 출판사", en: "Top publishers" },
  month: { ko: "월", en: "" },

  trees: { ko: "트리 목록", en: "Trees" },
  newTree: { ko: "새 트리", en: "New tree" },
  treeNickname: { ko: "트리 이름", en: "Tree nickname" },
  myBooks: { ko: "내 책", en: "My books" },
  dragHint: { ko: "책을 캔버스로 끌어다 놓으세요", en: "Drag books onto the canvas" },
  autoLayout: { ko: "자동 정렬", en: "Auto layout" },
  saved: { ko: "저장됨", en: "Saved" },
  saving: { ko: "저장 중…", en: "Saving…" },
  unsaved: { ko: "저장 안 됨", en: "Unsaved" },
  selectTree: { ko: "왼쪽에서 트리를 선택하거나 새로 만드세요", en: "Pick a tree on the left or create one" },
  relation_mentioned: { ko: "책에서 언급됨", en: "Mentioned in" },
  relation_inspired: { ko: "영감을 받음", en: "Inspired by" },
  relation_other: { ko: "기타", en: "Other" },
  relation: { ko: "연결 종류", en: "Relation" },
  note: { ko: "메모", en: "Note" },
  removeFromTree: { ko: "트리에서 빼기", en: "Remove from tree" },
  openDetail: { ko: "상세 보기", en: "Open detail" },
  treeHelp: {
    ko: "노드 아래 점에서 다른 노드로 끌어 연결 · 연결선 클릭으로 종류 변경 · Delete 키로 삭제",
    en: "Drag from a node's bottom dot to another node to connect · Click an edge to change it · Delete key removes",
  },
  treeHelpTouch: {
    ko: "책 아래 점을 탭하고 다른 책 위 점을 탭하면 연결 · 길게 끌어 이동",
    en: "Tap a book's bottom dot, then another's top dot to connect · Drag to move",
  },
  addToTree: { ko: "트리에 책 넣기", en: "Add books" },
  tapToAdd: { ko: "탭해서 트리에 추가", en: "Tap to add to the tree" },
  done: { ko: "완료", en: "Done" },
  toastAdded: { ko: "서재에 추가했어요", en: "Added to your library" },
  toastSaved: { ko: "저장했어요", en: "Saved" },
  toastDeleted: { ko: "삭제했어요", en: "Deleted" },
  toastProgress: { ko: "진행률을 기록했어요", en: "Progress logged" },
  toastFinished: { ko: "완독을 축하해요! 🎉", en: "Finished — congrats! 🎉" },
  toastReview: { ko: "리뷰를 남겼어요", en: "Review posted" },
  toastStatus: { ko: "상태를 바꿨어요", en: "Status updated" },
  toastError: { ko: "문제가 생겼어요", en: "Something went wrong" },
  pagesLeft: { ko: "페이지 남음", en: "pages left" },
  dayCount: { ko: "일째", en: " days" },
  addFirst: { ko: "첫 책 추가하기", en: "Add your first book" },
  addNewToTree: { ko: "새 책 검색해서 추가", en: "Search & add a new book" },
  moveUp: { ko: "위로", en: "Up" },
  moveDown: { ko: "아래로", en: "Down" },
  color: { ko: "색", en: "Color" },
} as const;

export type DictKey = keyof typeof dict;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted preference after hydration
    if (saved === "en" || saved === "ko") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);
  const t = useCallback((k: DictKey) => dict[k][lang], [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
