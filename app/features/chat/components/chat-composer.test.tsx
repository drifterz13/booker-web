import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { useState } from "react";
import { ChatComposer } from "./chat-composer";

it("requires both a book and a nonblank question before sending", () => {
  const onSend = vi.fn();
  const { rerender } = render(<ChatComposer value="Hello" onChange={vi.fn()} onSend={onSend} />);
  expect((screen.getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  rerender(<ChatComposer value="   " bookName="book.pdf" onChange={vi.fn()} onSend={onSend} />);
  expect((screen.getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  rerender(<ChatComposer value="Hello" bookName="book.pdf" onChange={vi.fn()} onSend={onSend} />);
  expect((screen.getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(
    false,
  );
});

it("sends with Enter, preserves Shift+Enter, and clears the submitted draft", async () => {
  const user = userEvent.setup();
  const onSend = vi.fn();
  function Harness() {
    const [draft, setDraft] = useState("");
    return (
      <ChatComposer
        value={draft}
        onChange={setDraft}
        bookName="book.pdf"
        onSend={() => {
          onSend(draft);
          setDraft("");
        }}
      />
    );
  }
  render(<Harness />);
  const input = screen.getByRole("textbox", { name: "Your question" });
  await user.type(input, "First{Shift>}{Enter}{/Shift}Second");
  expect(onSend).not.toHaveBeenCalled();
  await user.keyboard("{Enter}");
  expect(onSend).toHaveBeenCalledWith("First\nSecond");
  expect((input as HTMLTextAreaElement).value).toBe("");
});
