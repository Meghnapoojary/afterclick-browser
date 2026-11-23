# Changelog

## 0.6.2 — Release pipeline fix

- Prevented Electron Builder from attempting an implicit GitHub publish during installer packaging; GitHub Actions now owns release publication.
- Switched the Windows workflow to `npm ci` for lockfile-based dependency installation.


## 0.6.1 — Repository and Windows packaging

- Added Electron Builder configuration for a Windows x64 NSIS installer.
- Added branded Windows application icon and Windows App User Model ID.
- Added `build-installer.bat`, `npm run dist:win`, and an optional portable build command.
- Added GitHub Actions to build an installer on main-branch pushes and publish the installer to GitHub Releases for version tags.
- Added first-push and release instructions.

## 0.6.0 — Outcome recovery and printable acknowledgement

- Improved right-panel text contrast and typography.
- Assigned the three mascots to contextual idle, active, research and verification states.
- Added a visible booking event stream for confirmation loss and independent ledger reconciliation.
- Added a printable appointment acknowledgement.
