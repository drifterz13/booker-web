import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ChatProvider, useChat } from "./chat-context";

function ChatHarness() {
  const { messages, session, sendMessage, newChat } = useChat();
  return (
    <>
      <button onClick={() => sendMessage("  A question  ")}>Send</button>
      <button onClick={newChat}>New chat</button>
      <output>
        {session}:{messages.map((message) => message.content).join(",")}
      </output>
    </>
  );
}

it("trims questions and resets the conversation for a new chat", async () => {
  const user = userEvent.setup();
  render(
    <ChatProvider>
      <ChatHarness />
    </ChatProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Send" }));
  expect(screen.getByRole("status").textContent).toBe("0:A question");
  await user.click(screen.getByRole("button", { name: "New chat" }));
  expect(screen.getByRole("status").textContent).toBe("1:");
});
