# Hosting: manual steps

Status on 2026-11-03: steps 1-4 are done and the site is live at https://ai-hub.alecreimel.com with HTTPS enforced. **Still open: confirm the web3forms test email ("DEPLOY TEST - please ignore") arrived (step 5).**

If a certificate ever stalls with `https_certificate: null`, removing and re-adding the custom domain restarts issuance. That's what worked here, after about an hour of waiting.

## Required

Do these in order. Verifying the domain and setting it in Pages before the CNAME exists stops another GitHub account from claiming the subdomain.

### 1. Verify `alecreimel.com` with GitHub
1. Go to **GitHub > your profile Settings > Pages > Add a domain** (the account settings, not the repo's) and enter `alecreimel.com`.
2. Add the TXT record GitHub gives you in Cloudflare.
3. Click **Verify**. This can take a little while if DNS hasn't updated yet.

This covers subdomains too, so other accounts can't publish Pages sites on `ai-hub.alecreimel.com`.

### 2. Enable Pages and set the domain
Tell Claude verification is done, and it can do this part. To do it yourself, run:

```bash
gh api -X POST repos/areimel/alec-ai-hub/pages -f build_type=workflow
gh api -X PUT repos/areimel/alec-ai-hub/pages -f cname=ai-hub.alecreimel.com
```

### 3. Add the DNS record in Cloudflare
Only after step 2. In the `alecreimel.com` zone, go to **DNS > Records > Add record**:

| Type | Name | Target | Proxy status |
|---|---|---|---|
| CNAME | `ai-hub` | `areimel.github.io` | DNS only (grey cloud) |

Don't include the repo name in the target, and don't use a wildcard (`*`) record. Keep the proxy off, because GitHub can't issue its HTTPS certificate reliably while it's on.

Check that it resolves:

```bash
dig +short ai-hub.alecreimel.com
# First line should be: areimel.github.io.
```

### 4. Launch
Claude can do this part too. To do it yourself, run:

```bash
gh pr merge 2 --merge
gh run watch

# Once the certificate is issued (a few minutes to about an hour):
gh api -X PUT repos/areimel/alec-ai-hub/pages -F https_enforced=true
```

### 5. Check web3forms
The site's forms post to web3forms. If your access key restricts allowed domains, add `ai-hub.alecreimel.com`. Then send one test submission from the live site and confirm it arrives.

### If you ever move or disable the site
Delete the `ai-hub` CNAME in Cloudflare at the same time, so it doesn't point at a GitHub Pages site you no longer control.

## Check when you can

### Homelab / Coolify
If the `ai-hub.homelab.alecreimel.com` deploy rebuilds from `main`, merging will update it. It will still work, but its canonical URLs will point to the new domain. If it builds with its own pnpm settings, make sure it still installs now that `packageManager` is pinned to `pnpm@11.22.0`.

### Netlify
`company-ai-prompts.netlify.app` is being left running, as you chose.
- In the Netlify dashboard, check **Site configuration > Build & deploy**. If the site auto-deploys from this repo, merging will update it too, so stop builds if you want the old version left as is.
- Until it's retired, search engines will see both versions. When you're ready, either delete the site, or replace it with a redirect-only deploy that keeps old links working by using this `_redirects` file:

  ```
  /*  https://ai-hub.alecreimel.com/:splat  301!
  ```

## Optional

### Add the site to Google Search Console
Add `ai-hub.alecreimel.com` and submit `https://ai-hub.alecreimel.com/sitemap-index.xml`.

### Turn on the Cloudflare proxy later
Only do this after GitHub has issued the certificate and HTTPS works. Set the SSL/TLS mode to **Full (strict)**, because Flexible can cause redirect loops. DNS-only is fine to keep permanently, and it means certificate renewals can't be affected by the proxy.

## Content issues
The placeholder repo links, the `/features` link and the `/placeholder.jpg` fallback are fixed in [PR #3](https://github.com/areimel/alec-ai-hub/pull/3).

Still to decide: `/prompts/sample-post-1/` and `/prompts/ai-prompt-template/` are live and in the sitemap, and may be template leftovers.
