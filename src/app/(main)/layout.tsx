import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { BookDetailModal } from "@/components/BookDetailModal";
import { AddBookDialog } from "@/components/AddBookDialog";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <BookDetailModal />
      <AddBookDialog />
    </StoreProvider>
  );
}
