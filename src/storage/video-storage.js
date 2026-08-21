const STORAGE_KEY = "SavedContents";
async function getVideos() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] ?? [];
}
async function saveVideos(videos) {
    await chrome.storage.local.set({
        [STORAGE_KEY]: videos
    });
}
export async function getAllVideos() {
    return getVideos();
}
export async function getVideo(id) {
    const videos = await getVideos();
    return videos.find(video => video.id === id);
}
export async function getVideoByYoutubeId(youtubeId) {
    const videos = await getVideos();
    return videos.find(video => video.youtubeId === youtubeId);
}
export async function addVideo(video) {
    const videos = await getVideos();
    const exists = videos.some(item => item.youtubeId ===
        video.youtubeId);
    if (exists) {
        throw new Error("Il video è già presente.");
    }
    videos.push(video);
    await saveVideos(videos);
}
export async function updateVideo(video) {
    const videos = await getVideos();
    const index = videos.findIndex(item => item.id === video.id);
    if (index === -1) {
        throw new Error("Video non trovato.");
    }
    videos[index] = {
        ...video,
        updatedAt: Date.now()
    };
    await saveVideos(videos);
}
export async function deleteVideo(id) {
    const videos = await getVideos();
    await saveVideos(videos.filter(video => video.id !== id));
}
export async function addNote(videoId, note) {
    const video = await getVideo(videoId);
    if (!video) {
        throw new Error("Video non trovato.");
    }
    video.notes.push(note);
    await updateVideo(video);
}
export async function updateNote(videoId, note) {
    const video = await getVideo(videoId);
    if (!video) {
        throw new Error("Video non trovato.");
    }
    const index = video.notes.findIndex(item => item.id === note.id);
    if (index === -1) {
        throw new Error("Nota non trovata.");
    }
    video.notes[index] = {
        ...note,
        updatedAt: Date.now()
    };
    await updateVideo(video);
}
export async function deleteNote(videoId, noteId) {
    const video = await getVideo(videoId);
    if (!video) {
        throw new Error("Video non trovato.");
    }
    video.notes =
        video.notes.filter(note => note.id !== noteId);
    await updateVideo(video);
}
