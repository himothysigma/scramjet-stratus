// GitHub Device Flow authentication for Scramjet Stratus
//
// USAGE:
//   bun github-auth.ts <client_id> <github_username> <repo_name>
//
// HOW IT WORKS:
// 1. You create a GitHub OAuth App at https://github.com/settings/applications/new
//    (Homepage URL: anything, Authorization callback URL: http://localhost:9999)
//    Copy the Client ID.
// 2. Run: bun github-auth.ts <client_id> your-username scramjet-stratus
// 3. The script prints a USER CODE (e.g. "ABCD-1234").
// 4. Open https://github.com/login/device in your browser, enter the code, authorize.
// 5. The script polls automatically, gets the access token, saves it to .github-token,
//    configures the git remote, and pushes.
//
// The token is stored in .github-token (gitignored). It has `repo` scope (full repo access).

const CLIENT_ID = process.argv[2]
const GH_USERNAME = process.argv[3]
const REPO_NAME = process.argv[4] || "scramjet-stratus"

if (!CLIENT_ID || !GH_USERNAME) {
  console.error("Usage: bun github-auth.ts <client_id> <github_username> [repo_name]")
  console.error("")
  console.error("Step 1: Create a GitHub OAuth App at https://github.com/settings/applications/new")
  console.error("        (Callback URL: http://localhost:9999)")
  console.error("Step 2: Copy the Client ID and pass it as the first argument.")
  process.exit(1)
}

const DEVICE_CODE_URL = "https://github.com/login/device/code"
const TOKEN_URL = "https://github.com/login/oauth/access_token"

async function jsonPost(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function main() {
  console.log(`[github-auth] Requesting device code (client_id=${CLIENT_ID})...`)
  const codeRes = await jsonPost(DEVICE_CODE_URL, {
    client_id: CLIENT_ID,
    scope: "repo",
  }) as any

  if (codeRes.error) {
    console.error(`[github-auth] Error: ${codeRes.error_description || codeRes.error}`)
    process.exit(1)
  }

  const { device_code, user_code, verification_uri, expires_in, interval } = codeRes
  console.log("")
  console.log("════════════════════════════════════════════════════════════")
  console.log("  GITHUB DEVICE AUTHORIZATION")
  console.log("════════════════════════════════════════════════════════════")
  console.log("")
  console.log(`  1. Open this URL in your browser:`)
  console.log(`     ${verification_uri}`)
  console.log("")
  console.log(`  2. Enter this code:`)
  console.log("")
  console.log(`          ┌─────────────────┐`)
  console.log(`          │   ${user_code}   │`)
  console.log(`          └─────────────────┘`)
  console.log("")
  console.log(`  Code expires in ${expires_in} seconds.`)
  console.log("  Waiting for authorization...")
  console.log("════════════════════════════════════════════════════════════")
  console.log("")

  // Poll for the token
  const pollInterval = (interval || 5) * 1000
  const deadline = Date.now() + (expires_in || 900) * 1000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval))
    const tokenRes = await jsonPost(TOKEN_URL, {
      client_id: CLIENT_ID,
      device_code: device_code,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }) as any

    if (tokenRes.access_token) {
      console.log("[github-auth] ✓ Authorization successful!")
      const token = tokenRes.access_token

      // Save token to .github-token (gitignored)
      await Bun.write(".github-token", token)
      console.log("[github-auth] ✓ Token saved to .github-token")

      // Ensure .gitignore has .github-token
      try {
        const gi = await Bun.file(".gitignore").text()
        if (!gi.includes(".github-token")) {
          await Bun.write(".gitignore", gi + "\n.github-token\n")
        }
      } catch {
        await Bun.write(".gitignore", ".github-token\nnode_modules\n.next\n")
      }

      // Configure git remote with token auth
      const remoteUrl = `https://${token}@github.com/${GH_USERNAME}/${REPO_NAME}.git`
      console.log(`[github-auth] ✓ Remote configured: https://****@github.com/${GH_USERNAME}/${REPO_NAME}.git`)

      // Run git commands
      const proc = Bun.spawnSync("bash", ["-c", `
        cd /home/z/my-project
        git init 2>/dev/null || true
        git config user.email "stratus@local" 2>/dev/null || true
        git config user.name "Stratus" 2>/dev/null || true
        git add -A
        git commit -m "Scramjet Stratus — cloud gaming, chat, proxy browser, roles, DMs" --allow-empty 2>/dev/null || true
        git branch -M main 2>/dev/null || true
        git remote remove origin 2>/dev/null || true
        git remote add origin "${remoteUrl}"
        git push -u origin main
      `], { stdout: "inherit", stderr: "inherit" })

      if (proc.exitCode === 0) {
        console.log("")
        console.log("════════════════════════════════════════════════════════════")
        console.log(`  ✓ PUSHED to https://github.com/${GH_USERNAME}/${REPO_NAME}`)
        console.log("════════════════════════════════════════════════════════════")
        console.log("")
        console.log("  To import to Replit:")
        console.log(`    1. Go to https://replit.com/github/${GH_USERNAME}/${REPO_NAME}`)
        console.log("    2. Click 'Import Repl'")
        console.log("    3. Click 'Run' (runs start.sh automatically)")
      } else {
        console.error("[github-auth] git push failed. Check the repo exists and the token has repo scope.")
      }
      return
    }

    if (tokenRes.error === "authorization_pending") {
      process.stdout.write(".")
      continue
    }
    if (tokenRes.error === "slow_down") {
      await new Promise((r) => setTimeout(r, 5000))
      continue
    }
    if (tokenRes.error === "expired_token") {
      console.error("\n[github-auth] Device code expired. Run the script again.")
      process.exit(1)
    }
    if (tokenRes.error === "access_denied") {
      console.error("\n[github-auth] Authorization denied.")
      process.exit(1)
    }
  }

  console.error("\n[github-auth] Timed out waiting for authorization.")
  process.exit(1)
}

main().catch((e) => {
  console.error("[github-auth] Fatal:", e)
  process.exit(1)
})
