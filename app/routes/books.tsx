import { BooksPage } from "~/features/books/pages/books-page";

export function meta() {
  return [
    { title: "My books · Booker" },
    {
      name: "description",
      content: "Browse and manage the books in your library.",
    },
  ];
}
export default function Books() {
  return <BooksPage />;
}
