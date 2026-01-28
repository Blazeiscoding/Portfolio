import tailwind from "@astrojs/tailwind";
import compress from "astro-compress";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from 'astro/config';

import vercel from "@astrojs/vercel";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://nikhilrathore.com",
  integrations: [
    tailwind(), 
    icon({
      include: {
        "carbon": ["*"],
        "mdi": ["*"],
        "simple-icons": ["*"] 
      }
    }), 
    sitemap(), 
    compress()
  ],
  output: "server",
  // Default: run anywhere (VM/Docker). For Vercel builds set DEPLOY_TARGET=vercel.
  adapter: process.env.DEPLOY_TARGET === "vercel"
    ? vercel()
    : node({ mode: "standalone" })
});