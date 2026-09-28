import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/workspace.tsx", [index("routes/home.tsx"), route("books", "routes/books.tsx")]),
] satisfies RouteConfig;
