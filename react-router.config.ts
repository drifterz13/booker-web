import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  // Serve the page shell immediately; book queries and PDF loading stay client-side.
  prerender: true,
} satisfies Config;
