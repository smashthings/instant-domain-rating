# Truly Digital Ahrefs Domain Rating Extension

A small Chrome extension that checks the Ahrefs domain rating for the active website only when the popup is opened.

## What It Does

- Pulls the hostname from the current tab.
- Calls `https://api.ahrefs.com/v3/public/domain-rating-free`.
- Also attempts `https://api.ahrefs.com/v3/site-explorer/backlinks-stats` for backlink and referring-domain totals.
- Stores the Ahrefs API key in Chrome sync storage.
- Links settings and footer traffic to Truly Digital with UTM parameters.

## Local Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this folder.
5. Open the extension settings page and save your Ahrefs API key.

The API request is made on demand from the popup. It does not run in the background for every site you visit.
