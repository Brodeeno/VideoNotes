const STORAGE_KEY = "videos";
export async function getVideos() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return (result[STORAGE_KEY] ?? []);
}
export async function saveVideos(videos) {
    await chrome.storage.local.set({
        [STORAGE_KEY]: videos
    });
}
export function createExportFile(videos) {
    return {
        format: "youtube-video-notes",
        version: 1,
        exportedAt: new Date().toISOString(),
        videos
    };
}
export function validateExportFile(data) {
    if (typeof data !== "object" ||
        data === null) {
        return false;
    }
    const value = data;
    if (value.format !==
        "youtube-video-notes") {
        return false;
    }
    if (value.version !== 1) {
        return false;
    }
    if (!Array.isArray(value.videos)) {
        return false;
    }
    return value.videos.every(video => typeof video === "object" &&
        video !== null &&
        typeof video.youtubeId === "string" &&
        typeof video.title === "string" &&
        typeof video.channelName === "string" &&
        typeof video.url === "string" &&
        typeof video.duration === "number" &&
        typeof video.currentTime === "number" &&
        typeof video.thumbnailUrl === "string" &&
        Array.isArray(video.notes));
}
export async function exportVideos(videos) {
    const data = createExportFile(videos);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date()
        .toISOString()
        .slice(0, 10);
    link.href =
        url;
    link.download =
        `youtube-video-notes-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
export async function importVideos(file) {
    const text = await file.text();
    let data;
    try {
        data =
            JSON.parse(text);
    }
    catch {
        throw new Error("Il file non contiene JSON valido.");
    }
    if (!validateExportFile(data)) {
        throw new Error("Il file non è un archivio YouTube Video Notes valido.");
    }
    return data.videos;
}
