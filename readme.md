# 📝 [VideoNotes]

A simple, **privacy-first** Chrome extension to add and manage personal notes on **Instagram** and **YouTube** posts and videos.

🔒 Privacy First · 💾 Local storage only · ⚡ No external dependencies

---

## Features

- ✏️ Add and edit notes linked to specific posts/videos
- 👀 Dedicated interface to browse all saved notes
- 📌 Works on both Instagram and YouTube
- 🔒 No data ever sent to external servers: everything stays on your device

## Why "Privacy First"

This extension was built with a privacy-first approach:

- No personal data collection
- No tracking, analytics, or advertising
- Notes are saved exclusively via `chrome.storage.local`, so they never leave your browser

For more details, see the [Privacy Policy](./privacy-policy.md).

## Installation

### From the Chrome Web Store

🔗 *[Store link — to be added after publication]*

### Manual (developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/Brodeeno/VideoNotes.git
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Open Chrome and go to `chrome://extensions`
4. Enable **Developer mode** (top right corner)
5. Click **"Load unpacked"**
6. Select the generated `dist` folder

## Usage

1. Go to an Instagram post or a YouTube video
2. Click the extension icon (or the dedicated button in the interface)
3. Write your note: it will be saved automatically, locally
4. Open the dedicated interface to review, edit, or delete your saved notes

## Tech stack

- TypeScript
- Chrome Extension Manifest V3
- `chrome.storage.local` API

## Project structure

```
├── src/
│   ├── background.ts     # Service worker
│   ├── content/           # Content scripts (Instagram / YouTube)
│   └── ui/                 # Dedicated notes interface
├── welcome.html           # Post-install welcome page
├── manifest.json
└── privacy-policy.md
```

## Contributing

Contributions, bug reports, and suggestions are welcome! Feel free to open an issue or a pull request.

## Support this project

If you find this extension useful, consider buying me a coffee ☕

👉 [Support me on Ko-fi](https://ko-fi.com/brodeeno)

## License

*[Specify license here, e.g. MIT]*

## Privacy

See the [Privacy Policy](./privacy-policy.md) for details on how data is handled.

---

Made with ❤️ by [Brodeeno]