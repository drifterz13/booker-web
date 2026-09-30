---
name: Booker
description: A quiet reading workspace for personal PDF books and grounded questions.
colors:
  background: "#ffffff"
  foreground: "#222322"
  primary: "#3d5649"
  primary-foreground: "#ffffff"
  secondary: "#f0f2ef"
  muted-foreground: "#686d67"
  border: "#e5e7e3"
  surface-subtle: "#f8f8f7"
  danger: "#b42318"
  danger-foreground: "#ffffff"
  selection: "#dce7de"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    lineHeight: "1.25rem"
  overline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0.16em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  page-gutter: "1.5rem"
  page-gutter-wide: "2.5rem"
  block-gap: "1.5rem"
  section-gap: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "2.25rem"
  book-card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
---

# Booker Design System

## Overview

Booker uses a restrained, light reading workspace. White reading surfaces, a soft gray-green sidebar, and a muted forest-green primary color keep the PDF and conversation in focus. Inter carries the entire interface, with hierarchy supplied by weight, size, and spacing.

The source of truth is [app/app.css](app/app.css): Tailwind theme tokens map to root color values there. Shared interactive primitives live in `app/shared/components/ui`. Feature components should use those primitives and token-backed Tailwind utilities.

## Colors

- **Background** (`bg-background`) is the primary reading and card surface. Use it instead of `bg-white`.
- **Foreground** (`text-foreground`) is the default reading text.
- **Primary** (`bg-primary`, `text-primary`) is for the main action, icons, links, and focus.
- **Secondary** (`bg-secondary`) is a quiet selected or supporting surface.
- **Subtle surface** (`bg-surface-subtle`) separates navigation, the PDF preview, assistant messages, and quiet status labels from the reading area. `--surface-subtle` names its broad role; it is not tied to the sidebar component.
- **Muted foreground** (`text-muted-foreground`) is for secondary information. Its value is dark enough for normal text on the background, subtle surface, and secondary surfaces.
- **Border** (`border-border`) separates surfaces without heavy shadows.
- **Danger** (`text-danger`, `bg-danger`) is for errors and destructive actions. Pair a danger fill with `text-danger-foreground`.
- **Selection** and **overlay** are browser and sheet tokens; use `--selection` and `bg-overlay` rather than literal colors.

## Typography

Inter is loaded in `app/root.tsx`; `font-sans` is the default. Booker uses Tailwind's standard font sizes, line heights, weights, and `tracking-tight`. The only Booker-specific type tokens are `text-caption`, `text-overline`, and `tracking-overline`.

| Role              | Utility                                 | Size / line height | Use                                |
| ----------------- | --------------------------------------- | ------------------ | ---------------------------------- |
| Page title        | `text-3xl font-semibold tracking-tight` | 30 / 36px          | Page heading                       |
| Section title     | `text-lg font-medium`                   | 18 / 28px          | Smaller headings                   |
| Reading and entry | `text-base`                             | 16 / 24px          | Book content and question input    |
| Interface         | `text-sm`                               | 14 / 20px          | Controls and supporting copy       |
| Meta              | `text-xs`                               | 12 / 16px          | Short metadata and status          |
| Caption           | `text-caption`                          | 11 / 20px          | Help text and compact descriptions |
| Overline          | `text-overline tracking-overline`       | 10 / 16px          | Compact uppercase labels           |

The chat welcome uses Tailwind's `text-2xl` and `text-3xl` for its heading, with a quieter `text-sm` or `text-base` supporting line. Avoid arbitrary font sizes or letter spacing when an existing utility fits.

## Layout

Tailwind's 4px base spacing scale handles local layout. Numeric utilities are already scale tokens: `mt-2` is 8px, `mt-3` is 12px, `py-4` is 16px, and `py-8` is 32px. Do not create Booker aliases for those numbers alone. Margin and gap express the relationship between elements; padding expresses the breathing room inside a surface. Use a named Booker token when the same relationship recurs across components:

| Relationship        | Token or utility      | Value | Examples                                            |
| ------------------- | --------------------- | ----- | --------------------------------------------------- |
| Tight controls      | `gap-2`               | 8px   | Icon and label, adjacent toolbar controls           |
| Related copy        | `mt-3` / `gap-3`      | 12px  | Description after a heading, grouped controls       |
| Component content   | `gap-4` / `p-4`       | 16px  | Card grid, compact card interior                    |
| Standard card inset | `p-5`                 | 20px  | Book card and wide composer                         |
| Major blocks        | `mt-block-gap`        | 24px  | Welcome to composer, suggestions, message spacing   |
| Page gutter         | `px-page-gutter`      | 24px  | Library and chat on narrow screens                  |
| Wide page gutter    | `px-page-gutter-wide` | 40px  | Library and chat at wider breakpoints               |
| Section separation  | `mt-section-gap`      | 40px  | Page heading to loading, empty, error, or book grid |

Use these roles across pages before inventing another margin or padding value. Numeric utilities such as `gap-2`, `px-4`, and `mt-3` are fine for local layout. Bracketed one-off spacing like `p-[17px]` needs a specific reason; none is currently used for margin, padding, or gap. Keep a named token for a recurring relationship, not every margin or padding. The library uses a centered `max-w-5xl` container; chat uses `max-w-3xl`. The sidebar is fixed width on desktop and a sheet on mobile. Chat and PDF sit side by side from 1200px and use a sheet for PDF preview below that width.

## Elevation & Depth

Borders and surface changes provide most separation. Tailwind's standard `shadow-xs` styles fields, `shadow-sm` styles card hover and PDF pages, `shadow-md` styles menus, and `shadow-lg` styles sheets. Use Booker's softer `shadow-surface` when a raised interactive surface needs separation; the composer is its current use. Focus uses a primary-colored ring rather than an elevation shadow.

## Shapes

Controls use `rounded-md` (8px) or `rounded-lg` (12px). Cards, the composer, and major empty states use `rounded-xl` or `rounded-2xl` (both 16px in this system). Use pills only for small status labels.

## Components

- **Button:** Use `Button` from `app/shared/components/ui/button.tsx`. Its `default`, `outline`, `secondary`, `ghost`, `link`, and `danger` variants share sizing, disabled, and focus behavior. Choose the variant by action priority rather than restyling a plain button in a feature.
- **Select:** Use the shared Radix select primitives for book selection and future dropdowns. The trigger and menu inherit semantic surfaces, borders, and focus.
- **Textarea:** Use the shared `Textarea`; the chat composer removes its border and shadow because the surrounding form owns that treatment.
- **Sheet:** Use the shared sheet for mobile navigation and PDF preview. Its overlay and surface colors are token-backed.
- **Book card:** Use the white 16px radius card with a light border, `p-5`, and the existing cover/status layout. The card is a library item, not a generic container for unrelated content.

## Do's and Don'ts

- **Do** use semantic color utilities such as `bg-background`, `bg-surface-subtle`, and `text-muted-foreground` in React components.
- **Do** use `text-caption`, `text-overline`, and `tracking-overline` for their established roles.
- **Do** use the named page gutter, block gap, and section gap tokens for those recurring relationships across features.
- **Do** keep numeric Tailwind spacing utilities for one-off alignment inside a component.
- **Do** keep one primary action prominent at a time and use outline or ghost actions for nearby alternatives.
- **Don't** introduce literal hex colors, `bg-white`, arbitrary text sizes, or one-off shadows in components when an existing token expresses the same role.
- **Don't** turn a book-specific layout into a generic shared component without another proven use.
