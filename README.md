# Instant Domain Rating

A small Chrome extension that checks the Ahrefs domain rating for the active website only when the popup is opened.

## What It Does

- Pulls the hostname from the current tab.
- Calls `https://api.ahrefs.com/v3/public/domain-rating-free`.
- Shows the returned Ahrefs domain rating.
- Stores the Ahrefs API key in Chrome sync storage.
- Links settings and footer traffic to Truly Digital with UTM parameters.

## API Key

All data is provided by Ahrefs. You'll need a free API key for this extension to work:

1. Create a free account at ahrefs.com
2. Go to account settings => https://app.ahrefs.com/account/my-account
3. Select 'API keys' under workspace on the left hand side
4. Click on 'Generate API key for public endpoints'
5. Paste the API Key into the extension settings

The API request is made on demand from the popup. It does not run in the background for every site you visit. Normal use should not hit the Ahref limits


