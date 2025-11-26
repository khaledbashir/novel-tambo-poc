// Global storage for uploaded brief (Plan B to avoid Tambo context attachment loops)
let uploadedBriefText: string | null = null;

export function setUploadedBrief(text: string) {
    uploadedBriefText = text;
    console.log('[BriefStorage] Brief stored:', text.substring(0, 100) + '...');
}

export function getUploadedBrief(): string | null {
    return uploadedBriefText;
}

export function clearUploadedBrief() {
    uploadedBriefText = null;
}
