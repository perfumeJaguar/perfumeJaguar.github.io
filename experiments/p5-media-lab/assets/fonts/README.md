# Webfont library

Reusable free/open webfont registry for DODREI and future site experiments.

Families currently registered in `webfonts.css`:

- IBM Plex Mono — primary DODREI runtime font
- Space Mono
- Share Tech Mono
- VT323

All are consumed as hosted webfonts through Google Fonts and have monospace fallbacks. Keeping the shared registry in the repository makes the same typography choices reusable across other pages without duplicating font declarations.

## Runtime choice

DODREI uses **IBM Plex Mono**. The other families are intentionally not applied to the artwork yet.

## Binary font files

The current GitHub connector used for this project writes UTF-8 text files and does not support committing binary `.woff2` / `.ttf` payloads. For that reason this directory currently stores the reusable webfont registry and documentation, not copied font binaries. If the repository is later updated through a binary-capable local Git/Codex workflow, the same directory can be used for self-hosted font files without changing the higher-level project structure.
