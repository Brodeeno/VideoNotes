import type {
    SavedVideo,
    VideoNote
} from "../models/video";

const STORAGE_KEY = "SavedContents";

async function getVideos(): Promise<SavedVideo[]> {
    const result =
        await chrome.storage.local.get(
            STORAGE_KEY
        );

    return (
        result[STORAGE_KEY] as
            | SavedVideo[]
            | undefined
    ) ?? [];
}

async function saveVideos(
    videos: SavedVideo[]
): Promise<void> {

    await chrome.storage.local.set({
        [STORAGE_KEY]: videos
    });
}

export async function getAllVideos():
    Promise<SavedVideo[]> {

    return getVideos();
}

export async function getVideo(
    id: string
): Promise<SavedVideo | undefined> {

    const videos =
        await getVideos();

    return videos.find(
        video => video.id === id
    );
}

export async function getVideoByYoutubeId(
    youtubeId: string
): Promise<SavedVideo | undefined> {

    const videos =
        await getVideos();

    return videos.find(
        video =>
            video.youtubeId === youtubeId
    );
}

export async function addVideo(
    video: SavedVideo
): Promise<void> {

    const videos =
        await getVideos();

    const exists =
        videos.some(
            item =>
                item.youtubeId ===
                video.youtubeId
        );

    if (exists) {
        throw new Error(
            "Il video è già presente."
        );
    }

    videos.push(video);

    await saveVideos(videos);
}

export async function updateVideo(
    video: SavedVideo
): Promise<void> {

    const videos =
        await getVideos();

    const index =
        videos.findIndex(
            item =>
                item.id === video.id
        );

    if (index === -1) {
        throw new Error(
            "Video non trovato."
        );
    }

    videos[index] = {
        ...video,
        updatedAt: Date.now()
    };

    await saveVideos(videos);
}

export async function deleteVideo(
    id: string
): Promise<void> {

    const videos =
        await getVideos();

    await saveVideos(
        videos.filter(
            video =>
                video.id !== id
        )
    );
}

export async function addNote(
    videoId: string,
    note: VideoNote
): Promise<void> {

    const video =
        await getVideo(videoId);

    if (!video) {
        throw new Error(
            "Video non trovato."
        );
    }

    video.notes.push(note);

    await updateVideo(video);
}

export async function updateNote(
    videoId: string,
    note: VideoNote
): Promise<void> {

    const video =
        await getVideo(videoId);

    if (!video) {
        throw new Error(
            "Video non trovato."
        );
    }

    const index =
        video.notes.findIndex(
            item =>
                item.id === note.id
        );

    if (index === -1) {
        throw new Error(
            "Nota non trovata."
        );
    }

    video.notes[index] = {
        ...note,
        updatedAt: Date.now()
    };

    await updateVideo(video);
}

export async function deleteNote(
    videoId: string,
    noteId: string
): Promise<void> {

    const video =
        await getVideo(videoId);

    if (!video) {
        throw new Error(
            "Video non trovato."
        );
    }

    video.notes =
        video.notes.filter(
            note =>
                note.id !== noteId
        );

    await updateVideo(video);
}