console.log("VideoNotes - Content Script loaded");
let initialized = false;
let currentVideoId = null;
let noteButton = null;
/* =========================================================
   UTILITY
   ========================================================= */
function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
}
function getVideoId() {
    const url = new URL(window.location.href);
    return url.searchParams.get("v") ?? null;
}
function getVideoElement() {
    return document.querySelector("video.html5-main-video");
}
function getVideoInfo() {
    const videoId = getVideoId();
    const video = getVideoElement();
    if (!videoId || !video) {
        return null;
    }
    const titleElement = document.querySelector("yt-formatted-string.ytd-watch-metadata");
    const channelElement = document.querySelector("ytd-channel-name a");
    const title = titleElement?.textContent?.trim() ??
        document.title.replace(" - YouTube", "").trim();
    const channelName = channelElement?.textContent?.trim() ?? "YouTube";
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const currentTime = Number.isFinite(video.currentTime)
        ? video.currentTime
        : 0;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return {
        youtubeId: videoId,
        title,
        channelName,
        url,
        duration,
        currentTime,
        thumbnailUrl,
    };
}
/* =========================================================
   TOAST
   ========================================================= */
function showToast(message, type = "success", duration = 3000) {
    let container = document.querySelector(".youtube-notes-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "youtube-notes-toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `youtube-notes-toast ${type}`;
    const icon = document.createElement("div");
    icon.className = "youtube-notes-toast-icon";
    icon.textContent = type === "success" ? "✓" : "!";
    const text = document.createElement("div");
    text.className = "youtube-notes-toast-message";
    text.textContent = message;
    const close = document.createElement("button");
    close.className = "youtube-notes-toast-close";
    close.type = "button";
    close.textContent = "×";
    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(close);
    container.appendChild(toast);
    let removed = false;
    const removeToast = () => {
        if (removed) {
            return;
        }
        removed = true;
        toast.classList.add("hide");
        setTimeout(() => {
            toast.remove();
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 250);
    };
    close.addEventListener("click", removeToast);
    setTimeout(removeToast, duration);
}
/* =========================================================
   NOTE DIALOG
   ========================================================= */
function openNoteDialog(info) {
    /*
     * Evita di avere due dialog
     * contemporaneamente.
     */
    const existing = document.querySelector(".youtube-notes-dialog-backdrop");
    if (existing) {
        existing.remove();
    }
    const backdrop = document.createElement("div");
    backdrop.className = "youtube-notes-dialog-backdrop";
    backdrop.innerHTML = `
        <div
            class="youtube-notes-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Add note"
        >

            <div
                class="youtube-notes-dialog-header"
            >

                <h2
                    class="youtube-notes-dialog-title"
                >
                    Add note
                </h2>

                <button
                    type="button"
                    class="youtube-notes-dialog-close"
                    aria-label="Chiudi"
                >
                    ×
                </button>

            </div>

            <div
                class="youtube-notes-dialog-timestamp"
            >
                ${formatTime(info.currentTime)}
            </div>

            <textarea
                placeholder="Type a note..."
                maxlength="1000"
                autofocus
            ></textarea>

            <div
                class="youtube-notes-dialog-footer"
            >

                <span
                    class="youtube-notes-dialog-hint"
                >
                    Ctrl + Enter
                </span>

                <button
                    type="button"
                    class="youtube-notes-dialog-cancel"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="youtube-notes-dialog-save"
                >
                    Save
                </button>

            </div>

        </div>
    `;
    document.body.appendChild(backdrop);
    const dialog = backdrop.querySelector(".youtube-notes-dialog");
    const textarea = backdrop.querySelector("textarea");
    const save = backdrop.querySelector(".youtube-notes-dialog-save");
    const cancel = backdrop.querySelector(".youtube-notes-dialog-cancel");
    const close = backdrop.querySelector(".youtube-notes-dialog-close");
    if (!dialog || !textarea || !save || !cancel || !close) {
        console.error("Unable to initialize notes dialog.");
        backdrop.remove();
        return;
    }
    /* =====================================================
         CLOSE
         ===================================================== */
    function closeDialog() {
        backdrop.remove();
        document.removeEventListener("keydown", handleKeyDown);
    }
    function handleKeyDown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeDialog();
            return;
        }
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            save?.click();
        }
    }
    close.addEventListener("click", closeDialog);
    cancel.addEventListener("click", closeDialog);
    /*
     * Click sul backdrop.
     */
    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) {
            closeDialog();
        }
    });
    document.addEventListener("keydown", handleKeyDown);
    /* =====================================================
         SAVE
         ===================================================== */
    save.addEventListener("click", async () => {
        const text = textarea.value.trim();
        if (!text) {
            textarea.focus();
            showToast("Insert a note.", "error");
            return;
        }
        /*
         * Evita doppi click.
         */
        if (save.disabled) {
            return;
        }
        save.disabled = true;
        save.textContent = "Saving...";
        /*
         * Aggiorniamo il timestamp
         * subito prima del salvataggio,
         * così se l'utente ha tenuto aperto
         * il dialog qualche secondo usiamo
         * il timestamp corretto.
         */
        const currentInfo = getVideoInfo();
        if (!currentInfo) {
            showToast("Unable to retrieve video data.", "error", 5000);
            save.disabled = false;
            save.textContent = "Save";
            return;
        }
        try {
            const response = await chrome.runtime.sendMessage({
                type: "SAVE_CONTENT",
                content: {
                    platform: "youtube",
                    externalId: currentInfo.youtubeId,
                    title: currentInfo.title,
                    channelName: currentInfo.channelName,
                    url: currentInfo.url,
                    duration: currentInfo.duration,
                    thumbnailUrl: currentInfo.thumbnailUrl,
                },
                note: {
                    text,
                    timestamp: currentInfo.currentTime,
                },
            });
            if (!response?.success) {
                throw new Error(response?.error ?? "Error during save.");
            }
            /*
             * Salvataggio riuscito.
             */
            closeDialog();
            showToast("Note saved successfully", "success");
        }
        catch (error) {
            console.error("Save error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            /*
             * Caso specifico:
             * l'estensione è stata ricaricata
             * mentre YouTube era aperto.
             */
            if (errorMessage.includes("Extension context invalidated")) {
                showToast("Extension was updated. Refresh the YouTube page and retry.", "error", 5000);
                return;
            }
            showToast(`Error: ${errorMessage}`, "error", 5000);
            save.disabled = false;
            save.textContent = "Save";
        }
    });
    /*
     * Focus automatico.
     */
    requestAnimationFrame(() => {
        textarea.focus();
    });
}
/* =========================================================
   NOTE BUTTON
   ========================================================= */
function createNoteButton() {
    if (noteButton && document.body.contains(noteButton)) {
        return;
    }
    const title = document.querySelector("h1.ytd-watch-metadata");
    if (!title) {
        return;
    }
    /*
     * Evita duplicati.
     */
    const existing = title.querySelector(".youtube-notes-add-button");
    if (existing) {
        noteButton = existing;
        return;
    }
    /*
     * Creiamo il pulsante.
     */
    const button = document.createElement("button");
    button.type = "button";
    button.className = "youtube-notes-add-button";
    button.innerHTML = `
        <span
            class="youtube-notes-add-button-icon"
        >
            +
        </span>

        <span>
            Add note
        </span>
    `;
    button.addEventListener("click", (event) => {
        /*
         * Evita che il click
         * venga interpretato da YouTube
         * come click sul titolo.
         */
        event.preventDefault();
        event.stopPropagation();
        const info = getVideoInfo();
        if (!info) {
            showToast("Unable to retrieve video data.", "error");
            return;
        }
        openNoteDialog(info);
    });
    /*
     * Inseriamo il pulsante direttamente
     * alla fine del contenuto del titolo.
     */
    title.appendChild(button);
    noteButton = button;
}
/* =========================================================
   INITIALIZATION
   ========================================================= */
function initialize() {
    const videoId = getVideoId();
    if (!videoId) {
        return;
    }
    /*
     * Se siamo ancora sullo stesso video
     * non dobbiamo reinizializzare tutto.
     */
    if (initialized && currentVideoId === videoId) {
        createNoteButton();
        return;
    }
    initialized = true;
    currentVideoId = videoId;
    noteButton = null;
    /*
     * YouTube carica il DOM dinamicamente.
     * Quindi proviamo più volte a trovare
     * la toolbar.
     */
    let attempts = 0;
    const maxAttempts = 30;
    const interval = window.setInterval(() => {
        attempts++;
        createNoteButton();
        if (noteButton || attempts >= maxAttempts) {
            clearInterval(interval);
        }
    }, 500);
}
/* =========================================================
   YOUTUBE SPA NAVIGATION
   ========================================================= */
function handleNavigation() {
    const videoId = getVideoId();
    if (videoId !== currentVideoId) {
        initialized = false;
        currentVideoId = null;
        if (noteButton) {
            noteButton.remove();
            noteButton = null;
        }
        initialize();
    }
}
/*
 * YouTube è una SPA:
 * il cambio video non necessariamente
 * ricarica la pagina.
 */
window.addEventListener("yt-navigate-finish", () => {
    setTimeout(handleNavigation, 300);
});
/*
 * Fallback per eventuali cambiamenti
 * URL non intercettati dall'evento YouTube.
 */
let lastUrl = "";
setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(handleNavigation, 300);
    }
}, 500);
/* =========================================================
   START
   ========================================================= */
initialize();
export {};
