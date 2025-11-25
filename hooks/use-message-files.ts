import { useCallback, useState } from "react";

/**
 * Represents a file staged for upload (images or PDFs)
 */
export interface StagedFile {
    id: string;
    name: string;
    dataUrl: string;
    file: File;
    size: number;
    type: string;
}

interface UseMessageFilesReturn {
    files: StagedFile[];
    addFile: (file: File) => Promise<void>;
    addFiles: (files: File[]) => Promise<void>;
    removeFile: (id: string) => void;
    clearFiles: () => void;
}

/**
 * Hook for managing files (images and PDFs) in message input
 * This is a fixed version that accepts both images and PDFs
 * 
 * @returns Object with files array and management functions
 */
export function useMessageFiles(): UseMessageFilesReturn {
    const [files, setFiles] = useState<StagedFile[]>([]);

    const fileToDataUrl = async (file: File): Promise<string> => {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const addFile = useCallback(async (file: File) => {
        // Accept images and PDFs
        const isValidFile = file.type.startsWith("image/") || file.type === "application/pdf";
        if (!isValidFile) {
            throw new Error("Only image and PDF files are allowed");
        }

        const dataUrl = await fileToDataUrl(file);
        const newFile: StagedFile = {
            id: crypto.randomUUID(),
            name: file.name,
            dataUrl,
            file,
            size: file.size,
            type: file.type,
        };

        setFiles((prev) => [...prev, newFile]);
    }, []);

    const addFiles = useCallback(async (fileList: File[]) => {
        // Accept both images and PDFs
        const validFiles = fileList.filter((file) =>
            file.type.startsWith("image/") || file.type === "application/pdf"
        );

        if (validFiles.length === 0) {
            throw new Error("No valid image or PDF files provided");
        }

        const newFiles = await Promise.all(
            validFiles.map(async (file) => {
                const dataUrl = await fileToDataUrl(file);
                return {
                    id: crypto.randomUUID(),
                    name: file.name,
                    dataUrl,
                    file,
                    size: file.size,
                    type: file.type,
                };
            }),
        );

        setFiles((prev) => [...prev, ...newFiles]);
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => prev.filter((file) => file.id !== id));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    return {
        files,
        addFile,
        addFiles,
        removeFile,
        clearFiles,
    };
}
