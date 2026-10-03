import { ChatPage } from "~/features/chat/pages/chat-page";

export function meta() {
  return [
    { title: "Start chat · Booker" },
    { name: "description", content: "A thoughtful space to explore and chat with your books." },
  ];
}

export default function Home() {
  return <ChatPage />;
}
