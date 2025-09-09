# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated deployment and CI/CD.

## Workflows

### `deploy.yml`
- **Trigger**: Push to `master` branch
- **Purpose**: Automatically deploy to Railway when code is pushed
- **Requirements**: 
  - `RAILWAY_TOKEN` secret must be set in repository settings
  - Railway CLI is used for deployment

## Setup Instructions

1. **Generate Railway Token:**
   - Go to Railway project settings
   - Navigate to "Tokens" section
   - Generate a new project token

2. **Add Token to GitHub Secrets:**
   - Go to GitHub repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Add new secret: `RAILWAY_TOKEN`
   - Paste the Railway token value

3. **Push to Master:**
   - Any push to the `master` branch will trigger automatic deployment
   - Check the "Actions" tab in GitHub to monitor deployment status
