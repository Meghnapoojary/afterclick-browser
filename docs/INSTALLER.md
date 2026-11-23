# Building the AFTERCLICK Windows installer

AFTERCLICK uses Electron Builder with the Windows NSIS target. The installer is a conventional `.exe` setup wizard, not a hosted web app.

## Requirements

- Windows 10 or 11 (x64)
- Node.js 22.12 or newer
- npm 10 or newer
- Internet access during the first dependency installation/build so npm and Electron Builder can download required packages and build tools

## Build locally

From the project root, either double-click `build-installer.bat`, or run:

```powershell
npm install
npm run dist:win
```

The build first runs the TypeScript/Vite production build, then packages the Electron app. The installer is written to:

```text
release/AFTERCLICK-Setup-0.6.1-x64.exe
```

To create an unpacked package directory for troubleshooting:

```powershell
npm run pack:win
```

To create a portable executable instead of an installer:

```powershell
npm run dist:win:portable
```

## GitHub Actions

The workflow at `.github/workflows/windows-installer.yml` builds a Windows x64 NSIS installer when code is pushed to `main`, or when manually started from the Actions tab. Each successful run uploads an `AFTERCLICK-Windows-Installer` artifact.

To publish a downloadable GitHub Release:

1. Update the `version` in `package.json`.
2. Commit and push the change to `main`.
3. Create and push a version tag that matches the package version, for example:

   ```bash
   git tag v0.6.1
   git push origin v0.6.1
   ```

4. The workflow builds the installer and attaches the `.exe` to the GitHub Release for that tag.

The release workflow uses the repository-provided `GITHUB_TOKEN`; no personal access token or additional secret is required.

## Signing note

The installer is not code-signed in this MVP because no Windows code-signing certificate has been configured. Windows SmartScreen or antivirus software may show an unfamiliar-app warning. Do not tell users to bypass warnings unless they have verified that the installer came from the official AFTERCLICK repository and that its release checksum/source is trusted. A production public release should use an Authenticode certificate and publish checksums.

## What is included

The packaged application includes the compiled React/Vite renderer, Electron main/preload files, and the local mascot assets. Source maps, development scripts, tests, docs and the repository's GitHub workflow are not copied into the installed application.
