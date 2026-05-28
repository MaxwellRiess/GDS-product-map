# GDS product map

An interactive internal tool that helps GDS product managers find out what other teams are working on, who is working on it, and where each product sits in the organisation.

## What it does

The product map visualises all GDS products organised by directorate, programme and product. PMs can filter by directorate or product status (live, beta, alpha, discovery, deprecated) and click through to individual product pages showing the product manager, tech lead, designer, GitHub repos, and any relevant notes.

## Who it's for

Product managers across GDS who want to:

- Understand what products exist across the organisation
- Find out who to contact about a product
- Avoid duplicating work being done elsewhere
- Get an overview of a directorate's portfolio

## Tech stack

- React 19 + Vite
- Tailwind CSS
- Static site deployed to GitHub Pages via GitHub Actions

## Project structure

```
app/                    React + Vite application
app/public/products.json  Single source of truth for all product data
.github/workflows/      GitHub Actions deployment pipeline
```

## Data model

All product data lives in [`app/public/products.json`](app/public/products.json). The hierarchy is:

```
directorate → programme → product
```

Each product has: name, description, status, product\_manager, tech\_lead, designer, github\_repos, url, notes.

The three directorates are seeded from the DSIT May 2026 organogram:

1. **GDS Digital Products** (Christine Bellamy) — GOV.UK & Publishing, One Login, Products & Services, Platform Engineering, Digital Capabilities
2. **Digital Transformation** (Emily Middleton) — Service Design, Public Sector AI, NDL, i.AI, Geospatial, National Cloud
3. **Digital Foundations** (Sarah Connolly) — Cyber & Digital Identity, Digital Inclusion, Digital Infrastructure

## Editing the data

PMs can edit product data directly in the app by signing in with a GitHub Personal Access Token (repo scope). Edits commit directly to `products.json` via the GitHub API. GitHub Actions rebuilds and redeploys automatically (typically under two minutes).

To add or update products manually, edit [`app/public/products.json`](app/public/products.json) and push to `main`.

## Local development

```bash
cd app
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that builds the Vite app and deploys it to GitHub Pages.
