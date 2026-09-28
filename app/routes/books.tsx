import { BooksPage } from "~/features/books/pages/books-page";

export function meta() {
  return [{ title: "My books · Booker" }];
}
export default function Books() {
  return <BooksPage />;
}
