# GitHub Issue Focus

A Chrome extension that filters out noisy automated timeline updates on GitHub issues, making it easier to focus on what matters.

![Demo](demo.webp)

## Features

Hide configurable timeline events including:

- **Project events**: Added to project, moved in project, status changes
- **Issue events**: Labels added/removed, assignments, milestones, title renames
- **Other events**: Cross-references, closed/reopened status

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

## License

MIT
