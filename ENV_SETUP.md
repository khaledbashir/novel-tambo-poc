# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in `/novel-tambo-poc/novel/apps/web/` with the following variables:

### Novel Editor AI (Z.AI via Vercel AI SDK)

```bash
# Z.AI API Key for Novel Editor inline AI features
# Using GLM-4.6 model via Z.AI
ZAI_API_KEY=your_zai_api_key_here
ZAI_API_URL=https://api.z.ai/api/coding/paas/v4
```

### Tambo AI Chat

```bash
# Tambo AI API Key
# Get your key from: https://tambo.co or your self-hosted instance
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here

# Optional: Tambo API URL (defaults to https://api.tambo.co)
# Use this if you're self-hosting Tambo
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co

# Optional: Tambo Project ID
NEXT_PUBLIC_TAMBO_PROJECT_ID=your_project_id_here
```

### Optional: Rate Limiting (Upstash KV)

```bash
# Only needed if you want to enable rate limiting for Novel AI
# Get from: https://upstash.com/
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here
```

## Setup Instructions

1. Create `.env.local` file in `/novel-tambo-poc/novel/apps/web/` with the following content:

```bash
# Z.AI Configuration for Novel Editor
ZAI_API_KEY=your_zai_api_key_here
ZAI_API_URL=https://api.z.ai/api/coding/paas/v4

# Tambo AI Chat
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co
```

2. Restart the development server:
   ```bash
   pnpm dev
   ```

**Note:** The `.env.local` file is git-ignored and won't be committed to the repository.

## Notes

- `.env.local` is git-ignored and won't be committed
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep your API keys secure and never commit them
