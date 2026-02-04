# GitHub Issue Cleaner Upper 🧹

A Chrome extension that filters out noisy automated timeline updates on GitHub issues, making it easier to focus on what matters.

![](demo.webp)

## Features

Hide configurable timeline events including:
- **Project Events**: Added to project, moved in project, status changes
- **Issue Events**: Labels added/removed, assignments, milestones, title renames
- **Other Events**: Cross-references, closed/reopened status

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `gh-issue-cleaner-upper` folder

### Usage

1. Click the extension icon in your Chrome toolbar
2. Toggle which timeline events you want to hide
3. Changes apply immediately to all open GitHub issue pages

## Configuration

| Filter | Default | Description |
|--------|---------|-------------|
| Added to project | ✅ Hidden | "added this to Project" events |
| Moved in project | ✅ Hidden | "moved this to Status" events |
| Status changed | ✅ Hidden | Project status field changes |
| Labeled | ✅ Hidden | Label additions |
| Unlabeled | ✅ Hidden | Label removals |
| Assigned | ✅ Hidden | Assignment changes |
| Milestoned | ✅ Hidden | Milestone additions |
| Title renamed | ✅ Hidden | Issue title changes |
| Cross-referenced | ❌ Shown | Mentions from other issues/PRs |
| Closed | ❌ Shown | Issue closed events |
| Reopened | ❌ Shown | Issue reopened events |

## Development

The extension uses:
- `manifest.json` - Chrome extension manifest v3
- `content.js` - Content script that detects and hides timeline events
- `popup.html/css/js` - Configuration popup UI
- `styles.css` - Injected styles for hiding elements

## License

MIT
