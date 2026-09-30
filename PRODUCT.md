# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individual readers exploring their personal PDF books.

## Product Purpose

Booker lets readers add PDF books to a personal library, read them in the browser, and ask questions while exploring a selected book. Success means a reader can move from their own book to a useful answer grounded in that book.

## Positioning

Answers are grounded in the book the reader selected.

## Operating Context

Readers upload PDFs, browse their saved library, select a book, open its PDF preview alongside chat, and ask questions about it. A book may need processing before chat is ready.

## Capabilities and Constraints

- This phase supports PDF uploads only. Individuals can upload a book and select one for chat.
- The current app accepts PDF files up to 100 MB and stores uploaded books in the reader's library.
- The web client uses the Booker API and storage service for its library, uploads, PDF preview, and book chat.
- The current interface supports desktop and mobile layouts.
- Open decision: any additional durable product, privacy, or accessibility requirements have not been confirmed.

## Brand Commitments

The product name is Booker. The current interface uses a calm, reading-focused voice.

## Evidence on Hand

The repository contains the current app UI and integration tests for book upload, library browsing, PDF preview, and chat. The README says AI answers are not connected yet, while the current chat implementation calls the Booker API's book-chat endpoint; the deployment state is unconfirmed.

## Product Principles

- Keep each answer tied to the reader's selected book.
- Make it easy to move between reading and asking questions.
- Make upload and processing status clear so readers know when a book is ready.
