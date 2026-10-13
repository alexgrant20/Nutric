# GitHub Actions → cPanel

Workflow `.github/workflows/cpanel.yml` checks types, runs unit tests and builds
the Node.js production app. Every pull request produces a downloadable
`nutric-production` artifact. Pushes to `main` also upload it over FTPS.
For a manual build, use Actions → Production build and cPanel FTP → Run workflow.
Select `main` and enable `deploy` to upload it.

## GitHub configuration

Create the GitHub environment `production`. Add these secrets to that environment:

- `FTP_SERVER`: hostname only, such as `ftp.example.com`.
- `FTP_USERNAME`: account restricted to the application's deployment directory.
- `FTP_PASSWORD`: FTP account password.

Under repository Settings → Secrets and variables → Actions → Variables, add:

- `SITE_ORIGIN`: production origin, such as `https://www.example.com`, without a trailing slash. It must be a **repository variable** because the build job uses it before entering the production environment.
- `FTP_SERVER_DIR`: dedicated application folder as seen by the FTP account, ending in `/`, such as `/nutric/app/`. This is not necessarily the absolute SSH path. Do not point it at the FTP root or a directory shared with another website.
- `FTP_PROTOCOL` (optional): `ftps` by default; `ftp` or `ftps-legacy` only if required by your host. This action does not support SFTP.
- `FTP_PORT` (optional): `21` by default.

If your default branch has another name, update both `branches: [main]` and
the deployment condition in the workflow. Protect `main` with the build check.

## cPanel setup (once)

1. Enable Node.js **24** in cPanel. Create a production Node.js application with
   an application root such as `/home/USER/nutric/app` outside `public_html`, the
   desired domain and startup file `app.cjs`. Hosting providers expose this as
   Setup Node.js App or Application Manager. Confirm your host permits the custom
   startup file and has the required SQLite native dependencies/build tools.
2. Create `/home/USER/nutric/shared/uploads`, writable by the application user.
   Set application environment variables:

   ```dotenv
   NODE_ENV=production
   DATABASE_PATH=/home/USER/nutric/shared/nutric.db
   UPLOAD_DIR=/home/USER/nutric/shared/uploads
   BODY_SIZE_LIMIT=20M
   NEWSLETTER_ENABLED=false
   ```

   cPanel supplies the port. `SITE_ORIGIN` is set at build time in GitHub; changing
   the domain requires rebuilding. Alternatively `.env` in the application root
   is loaded by `app.cjs`; it is never uploaded or removed by this workflow.
3. Initialize content once: seed locally, stop the local app, then transfer
   `data/nutric.db` and the complete contents of `data/uploads/` into the matching
   shared paths. Stopping the app allows SQLite to close/checkpoint its WAL;
   otherwise use SQLite's backup API instead of copying an active database.
   This also transfers the admin account. Without this step a new database has
   no content or admin account. Do not reseed on deployment.
4. For automatic translation, supply `LIBRETRANSLATE_URL` pointing to a reachable
   private LibreTranslate service, and `LIBRETRANSLATE_API_KEY` if needed.
   This workflow does not deploy Docker or language models. cPanel localhost
   cannot reach the translator running on your own computer.

## After each upload

Use cPanel's Node.js environment activation command (shown by your hosting
provider), then run inside the **application root**:

```sh
cd /home/USER/nutric/app
npm ci --omit=dev
```

Then restart the application in cPanel. Keep installation scripts enabled:
native dependencies must match the server's Linux platform. Do not copy Windows
`node_modules`. The packaged manifest removes the development
`prepare` script; production install does not need SvelteKit build tools.

FTP only transfers files; dependency installation and restart remain manual.
Schedule uploads during maintenance because FTP updates files in place and
cannot switch a release atomically. Before deployments that change migrations,
make a consistent database backup. Migrations run automatically when the app
starts from its application root.

Verify `/en`, `/admin/login`, admin saves and image uploads after restarting.
If login/save reports an origin mismatch, check that `SITE_ORIGIN` matches the
public HTTPS domain exactly and rebuild. If GitHub reports upload success but
the site returns 503, inspect cPanel's application log and dependency install.

## Package contents and persistent files

The package contains only `build/`, `drizzle/`, `package.json`,
`package-lock.json` and `app.cjs`. The packager refuses to overwrite an existing
`.deploy` directory; use a clean checkout when preparing another release.
Database, uploads, `.env`, `node_modules` and Passenger's `tmp/` are excluded
from FTP synchronization. Never enable `dangerous-clean-slate`.

Keep an older GitHub artifact for code rollback. A rollback does not undo a
database migration; restore a compatible database backup when necessary.

References: [adapter-node](https://svelte.dev/docs/kit/adapter-node),
[cPanel Node.js](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/),
[FTP Deploy Action](https://github.com/SamKirkland/FTP-Deploy-Action).
