# MODULUS Deployment Guide

This guide outlines the steps to deploy the MODULUS application to a production environment. Since MODULUS is built with Next.js, Vercel is the recommended hosting platform, but the general principles apply to Railway or Render as well.

## 1. Hosting Requirements

- **Frontend/API**: [Vercel](https://vercel.com/) (Recommended for Next.js 14/15/16).
- **Database & Auth**: [Supabase](https://supabase.com/).
- **File Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (Compatible with S3 SDK).
- **Study Circles**: [LiveKit Cloud](https://livekit.io/cloud).

---

## 2. Environment Variables Checklist

Ensure these variables are added to your Vercel project settings:

### Supabase
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** Your Supabase service role key |

### Cloudflare R2 (S3 API)
| Variable | Value |
|---|---|
| `R2_ACCOUNT_ID` | Your Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Your R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | **Secret** Your R2 Secret Access Key |
| `R2_BUCKET_NAME` | Your R2 bucket name (e.g. `modulus-vault-v2`) |
| `R2_PUBLIC_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |

### LiveKit
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_LIVEKIT_URL` | Your LiveKit Cloud URL (starts with `wss://`) |
| `LIVEKIT_API_KEY` | Your LiveKit API Key |
| `LIVEKIT_API_SECRET` | **Secret** Your LiveKit API Secret |

### Auth (Google)
| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Your Google Cloud Console Client ID |
| `GOOGLE_CLIENT_SECRET` | **Secret** Your Google Cloud Console Client Secret |

---

## 3. Infrastructure Configuration

### A. Supabase Database
Ensure your production Supabase project has the necessary tables and RLS (Row Level Security) policies.
- Tables: `users`, `communities`, `community_members`, `files`, `vault_items`, `community_vault_items`, `folders`, `tasks`, `threads`, `replies`.
- **Note**: You must manually run your SQL migrations or use the Supabase CLI to push the local schema to production.

### B. Cloudflare R2 CORS Policies
**CRITICAL**: Browser-side uploads will fail unless you configure CORS in the Cloudflare R2 bucket settings.
1. Go to **R2 > Your Bucket > Settings**.
2. Add a CORS Policy for your production domain:
   ```json
   [
     {
       "AllowedOrigins": ["https://your-app.vercel.app", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### C. Google OAuth Redirects
In [Google Cloud Console](https://console.cloud.google.com/):
1. Update **Authorized Redirect URIs** to include your production Supabase URL:
   `https://<project-ref>.supabase.co/auth/v1/callback`

---

## 4. Deployment Steps (Vercel)

1. Connect your Github/Gitlab repository to Vercel.
2. Select the `modulus` directory.
3. Vercel should automatically detect the Next.js framework.
4. Paste all environment variables from your `.env` into the Vercel dashboard.
5. Click **Deploy**.

## 5. Verification Checklist

- [ ] Can users register/login via Email?
- [ ] Can users login via Google?
- [ ] Does file upload work to R2? (Check CORS if it fails)
- [ ] Do Study Circles (LiveKit) connect?
- [ ] Does the community vault display items correctly?

---

> [!NOTE]
> MODULUS has transitioned from a manual Socket.io setup to **LiveKit Cloud** for reliability and easier deployment. Make sure your LiveKit project is active.
