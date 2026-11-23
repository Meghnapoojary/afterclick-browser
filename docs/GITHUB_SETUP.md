# Create and push the AFTERCLICK GitHub repository

The source package is prepared for a first push. The repository is not created automatically by this project; create one in the GitHub account that will own the hackathon submission.

## Recommended repository settings

- Suggested repository name: `afterclick-browser`
- Description: `A desktop browser that turns intentions into verified outcomes.`
- Visibility: **Public** is recommended for hackathon evaluation so judges can inspect the code and download Releases.
- Do not initialize the GitHub repository with a README, `.gitignore` or license. This source folder already contains its own README and `.gitignore`.

## Prepare the local source folder

Open PowerShell in the project root and run:

```powershell
npm install
npm run check
npm run build
```

The `npm install` step creates `package-lock.json` for repeatable installs. Keep that generated file in the repository. Do not add `node_modules/`, `dist/` or `release/`; they are excluded by `.gitignore`.

## First push

After creating the empty repository on GitHub, use its HTTPS URL in place of the example below:

```powershell
git init -b main
git add .
git status
git commit -m "Initial commit: AFTERCLICK MVP 0.6.1"
git remote add origin https://github.com/Meghnapoojary/afterclick-browser.git
git push -u origin main
```

If Git asks who you are, configure your own Git identity first:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
```

## Build and publish the installer

The GitHub Actions workflow runs automatically for pushes to `main`, pull requests targeting `main`, and version tags. A normal branch push uploads the generated `.exe` as a workflow artifact.

To attach the installer to a GitHub Release after the branch build succeeds:

```powershell
git tag v0.6.1
git push origin v0.6.1
```

Open the repository's **Actions** tab to watch the build. Open **Releases** after the tagged workflow completes; the Windows setup `.exe` is attached there.

## Keep using the same repository

Continue committing all project changes to this same repository and branch. For the wHACKiest submission, use the same final repository URL throughout the process. Do not create a second repository for later builds.
