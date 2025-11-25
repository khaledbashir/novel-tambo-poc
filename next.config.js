/** @type {import('next').NextConfig} */
const nextConfig = {
    redirects: async () => {
        return [
            {
                source: "/github",
                destination: "https://github.com/steven-tey/novel",
                permanent: true,
            },
            {
                source: "/sdk",
                destination: "https://www.npmjs.com/package/novel",
                permanent: true,
            },
            {
                source: "/npm",
                destination: "https://www.npmjs.com/package/novel",
                permanent: true,
            },
            {
                source: "/svelte",
                destination: "https://github.com/tglide/novel-svelte",
                permanent: false,
            },
            {
                source: "/vue",
                destination: "https://github.com/naveennaidu/novel-vue",
                permanent: false,
            },
            {
                source: "/vscode",
                destination:
                    "https://marketplace.visualstudio.com/items?itemName=bennykok.novel-vscode",
                permanent: false,
            },
            {
                source: "/feedback",
                destination: "https://github.com/steven-tey/novel/issues",
                permanent: true,
            },
            {
                source: "/deploy",
                destination: "https://vercel.com/templates/next.js/novel",
                permanent: true,
            },
        ];
    },
    productionBrowserSourceMaps: true,
    output: 'standalone', // Required for Docker deployment

    // Performance optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // CRITICAL: Exclude massive directories from Next.js compilation
    // These directories contain 1400+ files and were causing 30s+ dev startup
    webpack: (config, { isServer }) => {
        // Exclude massive monorepo directories from compilation
        config.watchOptions = {
            ...config.watchOptions,
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/.next/**',
                '**/tambo/**',           // 81MB, 850+ subdirectories
                '**/novel/**',           // 108KB but still a monorepo
                '**/my-tambo-app/**',    // 960MB! Separate app
                '**/frontend/**',        // 36KB, Separate frontend
            ],
        };

        // Exclude from module resolution
        config.externals = config.externals || [];

        return config;
    },
};

module.exports = nextConfig;
