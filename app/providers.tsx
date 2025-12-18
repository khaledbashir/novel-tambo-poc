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

export const TamboEnabledContext = createContext<boolean>(true);

const ToasterProvider = () => {
    const { theme } = useTheme() as {
        theme: "light" | "dark" | "system";
    };
    return <Toaster theme={theme} />;
};

const TamboProviderWrapper = ({ children }: { children: ReactNode }) => {
    const config = React.useMemo(() => getTamboConfig(), []);

    // Only render TamboProvider if API key is configured
    // Note: projectId is handled internally by the SDK, not passed as a prop
    const tamboEnabled = Boolean(config.apiKey && config.projectId);

    if (!tamboEnabled) {
        console.warn("Tambo provider not initialized - missing API key");
        return (
            <TamboEnabledContext.Provider value={false}>
                {children}
            </TamboEnabledContext.Provider>
        );
    }

    return (
        <TamboEnabledContext.Provider value={true}>
            <TamboProvider
                apiKey={config.apiKey!}
                tamboUrl={config.tamboUrl}
                components={config.components}
                tools={config.tools}
                contextHelpers={config.contextHelpers}
                streaming={true}
                autoGenerateThreadName={false}
                autoGenerateNameThreshold={3}
            >
                {children}
            </TamboProvider>
        </TamboEnabledContext.Provider>
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
