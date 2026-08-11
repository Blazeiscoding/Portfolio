# Contributing

Thanks for taking the time to contribute. This is a personal portfolio, so the bar is simple: keep it fast, accessible and easy to edit.

## Getting set up

```bash
git clone https://github.com/Dhirenderchoudhary/Portfolioo.git
cd Portfolioo
npm install
npm run dev        # http://localhost:4321
```

Node.js 20+ is required. No environment variables are needed for local development — see the [README](README.md#environment-variables) for the optional ones.

## Before opening a pull request

```bash
npm run build      # must succeed
npm run preview    # sanity-check the built output
```

Optionally type-check with `npm run astro -- check` — it prompts to install `@astrojs/check` and `typescript` the first time, as they are not project dependencies.

- [ ] The build passes and the page renders in both light and dark themes.
- [ ] New interactive elements have `aria-label`s and are reachable by keyboard.
- [ ] New animation respects `prefers-reduced-motion`.
- [ ] Images are WebP, sized sensibly, and `loading="lazy"` unless above the fold.
- [ ] No secrets, tokens or `.env` files are committed.
- [ ] Docs updated if behaviour changed (`README.md`, `docs/CONTENT.md`, `docs/DEPLOYMENT.md`).

## Conventions

**Content changes** — add or edit Markdown under `src/pages/`. See [docs/CONTENT.md](docs/CONTENT.md) for the frontmatter reference. No component changes should be needed to add an entry.

**Styling** — Tailwind utility classes with daisyUI semantic tokens (`bg-base-100`, `text-primary`, `oklch(var(--p))`). Avoid hard-coded hex colours so both themes keep working.

**Client-side JS** — lives in `src/scripts/` as small exported `init*()` functions, imported and called from `index.astro`. Anything non-critical is deferred with `requestIdleCallback`. Keep the critical path lean; this site is tuned for LCP.

**Critical CSS** — `src/styles/critical.css` is inlined into `<head>`. Only add above-the-fold rules there; everything else goes in `src/styles/shared.css` or a component `<style>` block.

**TypeScript** — prefer typed frontmatter interfaces (as in `Container.astro`) over `any` when reading Markdown globs.

## Commit messages

Conventional-commit prefixes, matching the existing history:

```
feat: add project case-study share buttons
fix: correct Coding Shastra URL
refactor: move skills into its own component
docs: document the visitor counter endpoint
chore: bump astro to 5.16
```

## Pull requests

- Branch off `main`, one focused change per PR.
- Describe what changed and why; screenshots or a preview link for anything visual.
- Note anything you could not verify locally (e.g. Docker builds, live deployment behaviour).

## Reporting issues

Open an issue with the URL or page, what you expected, what happened, and your browser/OS. For layout bugs, a screenshot saves a lot of back-and-forth.
