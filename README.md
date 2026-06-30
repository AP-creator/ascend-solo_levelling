# ASCEND — Training System

A bodyweight training app with a rank/level "System" theme. All data is stored
locally on your device — there's no account, no server, and nothing leaves
your phone unless you export a backup yourself.

## Install it on a permanent, free address (one-time setup, ~10 minutes)

This uses GitHub Pages: free forever, and unlike the previous Netlify-drop
method, the web address never changes — future updates just go to the same
place automatically, no reinstalling.

**1. Create a GitHub account** (skip if you already have one)
Go to **github.com** → Sign up. Free.

**2. Create a new repository**
Click the **+** icon top-right → **New repository**.
Name it `ascend-app`, leave it set to **Public**, leave everything else
unchecked, click **Create repository**.

**3. Get the app files onto your computer**
If you haven't already: open claude.ai on this computer, sign into the same
account, open this conversation, and download the `ascend-app` file again.
Unzip it — Windows: right-click → Extract All. Mac: double-click it. You'll
get a folder called `ascend-app`.

**4. Upload the files**
On your new repo's page, click **Add file** → **Upload files**.
Open the unzipped `ascend-app` folder, select *everything inside it*
(index.html, the css folder, the js folder, manifest.json, sw.js, the icons
folder, README.md — select all of them at once with Ctrl+A on Windows or
Cmd+A on Mac), then drag that whole selection onto the GitHub upload page.

Important: drag what's *inside* the folder, not the folder itself — index.html
needs to end up at the top level of the repo, not nested inside another
ascend-app folder.

Scroll down, click **Commit changes**.

**5. Turn on GitHub Pages**
Click the **Settings** tab on your repo → **Pages** (left sidebar, under
"Code and automation").
Under **Source**, make sure **Deploy from a branch** is selected.
Under **Branch**, choose **main** and **/ (root)**, click **Save**.
Wait a couple of minutes, then refresh that Settings → Pages screen — it'll
show "Your site is live at https://yourusername.github.io/ascend-app/".

**6. Install it on your phone**
Open that address in Chrome on your phone.
Tap **⋮** (top-right) → **Add to Home Screen** (or **Install app**) → **Add**.

Done. That address is permanent — bookmark it, you won't need these setup
steps again.

## Getting future updates

When I send you a fix: download the new zip, unzip it, go back to your
repo on github.com, click **Add file** → **Upload files**, and drag in just
the changed file(s) (same method as step 4). Commit. The live site updates
within about a minute — open the app again on your phone and the fix is just
there. No reinstalling, no new address.

## If you already installed the earlier Netlify version

That was a different, temporary web address, so it won't carry over
automatically. If you'd already logged any progress there: open it, go to
Settings → **Export backup**, save that file. Once the GitHub Pages version
is installed, go to its Settings → **Import backup** and pick that same file
to bring your progress across. Then delete the old Netlify home screen icon
so you don't end up with two.

## Notes on the design

- **Storage**: everything lives in IndexedDB on-device. Use Settings → Export
  backup to save a `.json` file periodically — clearing your browser's site
  data would otherwise erase your progress with no way to recover it.
- **Penalty Quest**: missing a scheduled training day resets your streak and
  issues a mandatory makeup circuit that gates the next day's regular quests
  until cleared. There's an escape hatch in Settings → "Clear pending Penalty
  Quest" if it's ever not the right call for you.
- **Exercises**: an original bodyweight database, not pulled from any
  third-party site's content (Darebee's license explicitly prohibits
  inclusion of their material in apps, even free ones — worth a look at
  darebee.com directly if you want their specific named programs).
