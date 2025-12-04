import tailwind from "@astrojs/tailwind";
import compress from "astro-compress";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from 'astro/config';

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://nikhilrathore.com",
  integrations: [tailwind(), icon(), sitemap(), compress()],
  output: "server",
  adapter: vercel()
});