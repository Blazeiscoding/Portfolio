# Editing content

All visible content lives in Markdown under `src/pages/`. `src/components/Container.astro` reads each folder with `import.meta.glob(..., { eager: true })`, so **creating a file is enough** — there is no index or registry to update. Entries are sorted by year, newest first.

| Section | Folder | Rendered by |
| --- | --- | --- |
| Projects | `src/pages/projects/` | Homepage accordion **+** its own page at `/projects/<filename>` |
| Work | `src/pages/works/` | Homepage accordion |
| Studies | `src/pages/studies/` | Homepage accordion |
| Contact links | `src/pages/contact/` | Footer icons + `sameAs` in the homepage JSON-LD |
| About / bio | `src/pages/about/about.md` | Header, page title, meta description, JSON-LD |

The filename becomes the URL slug, so use lowercase kebab-case: `note-master.md` → `/projects/note-master`.

---

## Projects

`src/pages/projects/<slug>.md`

```markdown
---
layout: ../../layouts/ProjectLayout.astro
title: SketchSchema
url: https://sketchema.vercel.app/
github: https://github.com/Blazeiscoding/sketchschema
tags: ["AI", "Prisma", "PostgreSQL"]
date: 2026
image: /Sketchschema.webp
description: AI-powered tool that turns database diagrams into production-ready schemas.
---

One or two paragraphs describing the project. This body text appears both in the
homepage card and on the project's own case-study page.
```

| Field | Required | Notes |
| --- | --- | --- |
| `layout` | ✅ | Must be `../../layouts/ProjectLayout.astro`, otherwise the standalone page renders unstyled |
| `title` | ✅ | Card heading and page title |
| `date` | ✅ | Year, or a range like `2024 - Present`. Used for sorting (see [Sorting](#sorting)) |
| `description` | — | Used for `<meta name="description">`, OG and Twitter cards. Falls back to a generated sentence |
| `url` | — | Live demo link ("View project" button) |
| `github` | — | Source repository link |
| `tags` | — | String array rendered as badges |
| `image` | — | Path under `public/`, e.g. `/my-project.webp` — see [Images](#images) |

## Work

`src/pages/works/<slug>.md`

```markdown
---
title: Freelancer
date: 2024 - Present
url: "https://nikhilrathore.com"
location: New Delhi, India
org: Full Stack Development
tags: ["Full Stack", "Frontend", "Backend"]
---

- One bullet per achievement or responsibility.
- Keep them outcome-focused and scannable.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | ✅ | Role title |
| `date` | ✅ | e.g. `2024 - Present` |
| `org` | — | Company or focus area; used as the link label |
| `url` | — | Company link |
| `location` | — | Shown beside the date |
| `tags` | — | Badges |
| `image` | — | Optional logo; rendered right-aligned and contained |

## Studies

`src/pages/studies/<slug>.md`

```markdown
---
title: Bachelor of Science in Computer Science
institute: University of Delhi
location: University of Delhi, New Delhi
url: https://www.du.ac.in/
date: 2021-2024
tags: ["Computer Science", "Web Development"]
---
```

`title` and `date` are required; `institute` is used as the card's link label. A body is optional — the existing entries have none.

> **Note:** the studies card links to the generated `/studies/<slug>` page, not to `url`. Because work and study files have no `layout`, those generated pages render as bare HTML. Only project files use `ProjectLayout.astro` and get a styled standalone page — add a `layout` line to a work or study file if you want the same treatment.

## Contact links

`src/pages/contact/<name>.md` — frontmatter only, no body:

```markdown
---
title: Github
icon: carbon:logo-github
url: https://github.com/Blazeiscoding
---
```

All three fields are required. `icon` is any name from the icon sets enabled in `astro.config.mjs`: **`carbon:*`**, **`mdi:*`** or **`simple-icons:*`** — browse them at [icones.js.org](https://icones.js.org). Each file adds one footer icon and one `sameAs` entry in the homepage structured data.

## About

`src/pages/about/about.md` drives the header, page `<title>`, meta description and JSON-LD:

```markdown
---
title: about
name: "Nikhil Rathore"
designation: "Full Stack Developer"
location: India, New Delhi
pronouns: "he/him"
website: ""
---

Short professional bio, two to four sentences.
```

`location` is split on `,` for the JSON-LD address, so keep the `Country, City` shape.

## Skills

Skills are **not** Markdown. Edit the `skills` array in `src/components/Skills.astro`:

```ts
{ name: "React", icon: "simple-icons:react", category: "Frontend" },
```

`category` must be one of `Language`, `Frontend`, `Backend`, `Database`, `Tools` — those are the group headings, rendered in that order.

---

## Images

1. Export as **WebP**, roughly 1200×630 for project cards and OG images.
2. Drop the file in `public/`.
3. Reference it with a leading slash: `image: /my-project.webp`.

Files in `public/` are served from the site root as-is; `astro-compress` optimises them at build time.

## Sorting

`Container.astro` sorts each section by the first number it finds in `date`, descending. Practically:

- `2026` → sorts as 2026
- `2024 - Present` → sorts as 2024
- `Present` on its own → pinned to the top

So write dates as a plain year or `<year> - Present` and ordering takes care of itself.

## Checklist before committing

- [ ] `npm run dev` and confirm the entry shows up in the right section, in the right order.
- [ ] For a project, open `/projects/<slug>` and check the case-study page renders with the right title, image and links.
- [ ] Confirm any new image exists in `public/` and loads (no broken image, correct aspect ratio).
- [ ] `npm run build` passes.
