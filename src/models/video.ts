export interface VideoNote {
    id: string;

    text: string;

    /**
     * Secondi dall'inizio del video.
     */
    timestamp: number | null;

    createdAt: number;

    updatedAt: number;
}

export interface SavedVideo {
    id: string;

    youtubeId: string;

    url: string;

    title: string;

    channelName: string;

    thumbnailUrl: string;

    /**
     * Durata totale in secondi.
     */
    duration: number;

    notes: VideoNote[];

    createdAt: number;

    updatedAt: number;
}