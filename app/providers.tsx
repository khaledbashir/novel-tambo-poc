"use client";

import React, {
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    createContext,
} from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
// Removed Vercel Analytics to fix 404 error
import { TamboProvider } from "@tambo-ai/react";
import useLocalStorage from "@/hooks/use-local-storage";
import { getTamboConfig } from "@/lib/tambo/setup";

export const AppContext = createContext<{
    font: string;
    setFont: Dispatch<SetStateAction<string>>;
}>({
    font: "Default",
    setFont: () => { },
});

const ToasterProvider = () => {
    const { theme } = useTheme() as {
        theme: "light" | "dark" | "system";
    };
    return <Toaster theme={theme} />;
};

const TamboProviderWrapper = ({ children }: { children: ReactNode }) => {
    const config = React.useMemo(() => getTamboConfig(), []);
    console.log("[Tambo Debug] Config Loaded:", {
        projectId: config.projectId,
        apiKeyLength: config.apiKey?.length,
        apiKeyStart: config.apiKey?.substring(0, 10),
        apiKeyEnd: config.apiKey?.substring(config.apiKey.length - 10)
    });

    // Only render TamboProvider if API key is configured
    // Note: projectId is handled internally by the SDK, not passed as a prop
    if (!config.apiKey) {
        console.warn("Tambo provider not initialized - missing API key");
        return <>{children}</>;
    }

    return (
        <TamboProvider
            apiKey={config.apiKey}
            tamboUrl={config.tamboUrl}
            components={config.components}
            tools={config.tools}
            contextHelpers={config.contextHelpers}
            streaming={true}
            autoGenerateThreadName={true}
            autoGenerateNameThreshold={3}
        >
            {children}
        </TamboProvider>
    );
};

export default function Providers({ children }: { children: ReactNode }) {
    const [font, setFontValue] = useLocalStorage<string>(
        "novel__font",
        "Default",
    );
    const setFont = React.useCallback(
        (value: React.SetStateAction<string>) => {
            if (typeof value === "function") {
                setFontValue(value(font));
            } else {
                setFontValue(value);
            }
        },
        [setFontValue, font],
    );

    return (
        <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
            defaultTheme="system"
        >
            <AppContext.Provider
                value={{
                    font,
                    setFont,
                }}
            >
                <TamboProviderWrapper>
                    <ToasterProvider />
                    {children}
                    {/* Vercel Analytics removed - {process.env.NODE_ENV === "production" && <Analytics />} */}
                </TamboProviderWrapper>
            </AppContext.Provider>
        </ThemeProvider>
    );
}
