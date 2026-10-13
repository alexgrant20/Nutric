# GitHub Actions → cPanel (SSH)

Workflow `.github/workflows/cpanel.yml` checks types, runs unit tests and builds
the Node.js production app. Every pull request produces a downloadable
`nutric-production` artifact. Pushes to `main` also deploy it over SSH: one `tar`
archive is streamed over SSH, then the workflow runs `npm ci --omit=dev` and restarts the app.
For a manual build, use Actions → Production build and cPanel SSH → Run workflow.
Select `main` and enable `deploy` to deploy it.

## SSH key (once)

1. In cPanel → SSH Access → Manage SSH Keys, generate a key (no passphrase),
   then Manage → Authorize. Download the private key.
2. The cPanel jail shell has no `rsync`; the workflow only needs `tar` and `bash`.
3. Get the host fingerprint line for `SSH_KNOWN_HOSTS`:
   `ssh-keyscan -p 22 HOST` (use your SSH port). This pins the server identity.

## GitHub configuration

Create the GitHub environment `production`. Add these secrets to that environment:

- `SSH_HOST`: SSH hostname, such as `nusantara.hostingceria.com`.
- `SSH_USER`: cPanel username.
- `SSH_PRIVATE_KEY`: full private key, including the BEGIN/END lines.
- `SSH_KNOWN_HOSTS`: output of `ssh-keyscan` from the step above.

Under repository Settings → Secrets and variables → Actions → Variables, add:

- `SITE_ORIGIN`: production origin, such as `https://www.example.com`, without a trailing slash. It must be a **repository variable** because the build job uses it before entering the production environment.
- `DEPLOY_DIR`: absolute application root, such as `/home/USER/nutric/app`, no trailing slash. It must match the Application root of the cPanel Node.js app.
- `SSH_PORT` (optional): `22` by default.
- `NODE_ACTIVATE` (optional): the command cPanel shows at the top of the Node.js app page, such as `source /home/USER/nodevenv/nutric/app/24/bin/activate`. Needed so `npm` is on the PATH over SSH.

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

## What each deployment does

The archive is unpacked into `.incoming/`, then `build/` and `drizzle/` are
replaced (stale files disappear) and the workflow copies `package.json`, `package-lock.json` and `app.cjs`. Then it runs
`npm ci --omit=dev` in `DEPLOY_DIR` and touches `tmp/restart.txt`, which makes
Passenger restart the app. Database, uploads, `.env`, `node_modules` and `tmp/`
are never overwritten or removed. Keep installation scripts enabled: native
dependencies must match the server's Linux platform. Do not copy Windows
`node_modules`.

Schedule deployments during maintenance because files are updated in place and
cannot switch a release atomically. Before deployments that change migrations,
make a consistent database backup. Migrations run automatically when the app
starts from its application root.

Verify `/en`, `/admin/login`, admin saves and image uploads after restarting.
If login/save reports an origin mismatch, check that `SITE_ORIGIN` matches the
public HTTPS domain exactly and rebuild. If GitHub reports a successful deployment but
the site returns 503, inspect cPanel's application log and the `npm ci` step output.

## Package contents and persistent files

The package contains only `build/`, `drizzle/`, `package.json`,
`package-lock.json` and `app.cjs`. The packager refuses to overwrite an existing
`.deploy` directory; use a clean checkout when preparing another release.
Database, uploads, `.env`, `node_modules` and Passenger's `tmp/` are not part
of the package and are never touched by the deployment.

Keep an older GitHub artifact for code rollback. A rollback does not undo a
database migration; restore a compatible database backup when necessary.

References: [adapter-node](https://svelte.dev/docs/kit/adapter-node),
[cPanel Node.js](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/),
[cPanel SSH access](https://docs.cpanel.net/cpanel/security/ssh-access/).
