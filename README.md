# www.cominvent.com

Minimal [Hugo](https://gohugo.io/) static site for **cominvent.com**
(the apex domain is canonical; `www` redirects to it).
Self-contained: custom layouts in `layouts/`, no external theme.

## Prerequisites

- Hugo **extended** (`hugo version` should print `+extended`).
  On macOS: `brew install hugo`.

## Develop / preview

```sh
hugo server -D          # live-reload preview at http://localhost:1313
```

Content lives in `content/` (Markdown). Edits reload automatically.

## Build

```sh
hugo --gc --minify      # baseURL (https://cominvent.com/) comes from hugo.toml
```

Outputs the finished site to `public/` (gitignored).

## Layout

```
content/            Markdown (_index.md home + pages)
layouts/            Self-contained templates (baseof/single/list + index)
static/             Assets copied verbatim (css/)
hugo.toml           Site config (baseURL, menu, params)
.htmltest.yml       Link/image lint config
.github/workflows/  CI: build + lint on PR, build + deploy on push to main
```

## CI / Deploy

`.github/workflows/deploy.yml`:

- **Pull request → main**: build + [htmltest](https://github.com/wjdp/htmltest)
  lint (broken internal links & images). No deploy.
- **Push / merge → main**: build, then `rsync` `public/` to the host over SSH.

Deploy target is set via `env` in the workflow
(`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`). The SSH deploy key's private half
is stored in the repo secret **`COMINVENT_DEPLOY_KEY`**; its public half must be
installed on the host's site user.
