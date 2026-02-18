import tailwind from "@astrojs/tailwind";
import compress from "astro-compress";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from 'astro/config';

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
  output: "static",
  // Allow Caddy/remote access to astro preview on your domain
  vite: {
    preview: {
      allowedHosts: ["nikhilrathore.com", "www.nikhilrathore.com"]
    }
  }
});
