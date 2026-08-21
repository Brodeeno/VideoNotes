import "./app.css";

interface Note {
  id: string;
  text: string;
  timestamp: number | null;
  createdAt: number;
  updatedAt: number;
}

interface SavedContent {
  id: string;

  platform: "youtube" | "instagram";

  externalId: string;

  url: string;

  title: string;

  channelName: string;

  thumbnailUrl: string;

  duration: number | null;

  notes: Note[];

  createdAt: number;

  updatedAt: number;
}

interface ExportFile {
  format: "youtube-video-notes";
  version: 1;
  exportedAt: string;
  videos: SavedContent[];
}

const STORAGE_KEY = "SavedContents";

const searchInput = document.querySelector<HTMLInputElement>("#search");

const sortSelect = document.querySelector<HTMLSelectElement>("#sort");

const videoList = document.querySelector<HTMLElement>("#video-list");

const exportButton = document.getElementById(
  "export-button",
) as HTMLButtonElement | null;

const importButton = document.getElementById(
  "import-button",
) as HTMLButtonElement | null;

const importFile = document.getElementById(
  "import-file",
) as HTMLInputElement | null;

let videos: SavedContent[] = [];

console.log("APP STARTED");

// ============================================================
// STORAGE
// ============================================================

async function getVideos(): Promise<SavedContent[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);

  const stored = result[STORAGE_KEY];

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored as SavedContent[];
}

async function saveVideos(value: SavedContent[]): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: value,
  });
}

// ============================================================
// LOAD
// ============================================================

async function loadVideos(): Promise<void> {
  videos = await getVideos();

  render();
}

// ============================================================
// TOAST
// ============================================================

function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const existing = document.querySelector(".app-toast");

  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");

  toast.className = `app-toast ${type}`;

  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3000);
}

// ============================================================
// EXPORT
// ============================================================

async function exportAllVideos(): Promise<void> {
  if (videos.length === 0) {
    showToast("No videos to export.", "error");

    return;
  }

  const exportData: ExportFile = {
    format: "youtube-video-notes",

    version: 1,

    exportedAt: new Date().toISOString(),

    videos: videos,
  };

  const json = JSON.stringify(exportData, null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const date = new Date().toISOString().slice(0, 10);

  link.href = url;

  link.download = `youtube-video-notes-${date}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  showToast(
    `${videos.length} ${videos.length === 1 ? "video" : "videos"} exported.`,
  );
}

// ============================================================
// IMPORT
// ============================================================

async function readImportFile(file: File): Promise<SavedContent[]> {
  const text = await file.text();

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Selected file does not contain valid JSON.");
  }

  if (!isValidExportFile(data)) {
    throw new Error("Selected file is not a valid VideoNotes archive.");
  }

  return data.videos;
}

function isValidExportFile(data: unknown): data is ExportFile {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const value = data as Partial<ExportFile>;

  if (value.format !== "youtube-video-notes") {
    return false;
  }

  if (value.version !== 1) {
    return false;
  }

  if (!Array.isArray(value.videos)) {
    return false;
  }

  return value.videos.every(isValidVideo);
}

function isValidVideo(video: unknown): video is SavedContent {
  if (typeof video !== "object" || video === null) {
    return false;
  }

  const value = video as Partial<SavedContent>;

  if (typeof value.id !== "string") {
    return false;
  }

  if (value.platform !== "youtube" && value.platform !== "instagram") {
    return false;
  }

  if (typeof value.externalId !== "string") {
    return false;
  }

  if (typeof value.url !== "string") {
    return false;
  }

  if (typeof value.title !== "string") {
    return false;
  }

  if (typeof value.channelName !== "string") {
    return false;
  }

  if (typeof value.thumbnailUrl !== "string") {
    return false;
  }

  /*
   * YouTube:
   * duration = number
   *
   * Instagram:
   * duration può essere null.
   */

  if (value.duration !== null && typeof value.duration !== "number") {
    return false;
  }

  if (!Array.isArray(value.notes)) {
    return false;
  }

  if (typeof value.createdAt !== "number") {
    return false;
  }

  if (typeof value.updatedAt !== "number") {
    return false;
  }

  return value.notes.every(isValidNote);
}

function isValidNote(note: unknown): note is Note {
  if (typeof note !== "object" || note === null) {
    return false;
  }

  const value = note as Partial<Note>;

  if (typeof value.id !== "string") {
    return false;
  }

  if (typeof value.text !== "string") {
    return false;
  }

  if (value.timestamp !== null && typeof value.timestamp !== "number") {
    return false;
  }

  if (typeof value.createdAt !== "number") {
    return false;
  }

  if (typeof value.updatedAt !== "number") {
    return false;
  }

  return true;
}

// ============================================================
// IMPORT MODAL
// ============================================================

function showImportModal(videoCount: number): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");

    backdrop.className = "import-modal-backdrop";

    backdrop.innerHTML = `
        <div
          class="import-modal"
          role="dialog"
          aria-modal="true"
        >

          <div class="import-modal-header">

            <h2 class="import-modal-title">
              Import archive
            </h2>

            <button
              class="import-modal-close"
              type="button"
              aria-label="Close"
            >
              ×
            </button>

          </div>

          <div class="import-modal-content">

            <p class="import-modal-description">
              You're about to import a VideoNotes archive.
            </p>

            <div class="import-modal-count">

              <span class="import-modal-count-number">
                ${videoCount}
              </span>

              <span class="import-modal-count-label">
                ${videoCount === 1 ? "video" : "videos"}
              </span>

            </div>

            <div class="import-modal-info">

              <span class="import-modal-info-icon">
                ⓘ
              </span>

              <span>
                Already existing videos will be kept.
                Duplicated notes will be ignored.
              </span>

            </div>

          </div>

          <div class="import-modal-footer">

            <button
              class="
                import-modal-button
                import-modal-cancel
              "
              type="button"
            >
              Cancel
            </button>

            <button
              class="
                import-modal-button
                import-modal-confirm
              "
              type="button"
            >
              Import
            </button>

          </div>

        </div>
      `;

    document.body.appendChild(backdrop);

    const closeButton = backdrop.querySelector<HTMLButtonElement>(
      ".import-modal-close",
    );

    const cancelButton = backdrop.querySelector<HTMLButtonElement>(
      ".import-modal-cancel",
    );

    const confirmButton = backdrop.querySelector<HTMLButtonElement>(
      ".import-modal-confirm",
    );

    let resolved = false;

    const close = (value: boolean) => {
      if (resolved) {
        return;
      }

      resolved = true;

      backdrop.classList.remove("show");

      setTimeout(() => {
        backdrop.remove();
      }, 200);

      resolve(value);
    };

    closeButton?.addEventListener("click", () => close(false));

    cancelButton?.addEventListener("click", () => close(false));

    confirmButton?.addEventListener("click", () => close(true));

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        close(false);
      }
    });

    requestAnimationFrame(() => {
      backdrop.classList.add("show");
    });

    confirmButton?.focus();
  });
}

// ============================================================
// MERGE IMPORT
// ============================================================

async function mergeImportedVideos(
  importedVideos: SavedContent[],
): Promise<void> {
  const currentVideos = await getVideos();

  const mergedVideos = [...currentVideos];

  let addedVideos = 0;

  let addedNotes = 0;

  for (const importedVideo of importedVideos) {
    /*
     * IMPORTANTE:
     *
     * externalId da solo non basta.
     *
     * Lo stesso ID potrebbe esistere
     * su piattaforme differenti.
     */

    const existingVideo = mergedVideos.find(
      (video) =>
        video.platform === importedVideo.platform &&
        video.externalId === importedVideo.externalId,
    );

    if (!existingVideo) {
      mergedVideos.push({
        ...importedVideo,

        notes: importedVideo.notes.map((note) => ({
          ...note,
        })),
      });

      addedVideos++;

      addedNotes += importedVideo.notes.length;

      continue;
    }

    for (const importedNote of importedVideo.notes) {
      const noteExists = existingVideo.notes.some(
        (note) => note.id === importedNote.id,
      );

      if (!noteExists) {
        existingVideo.notes.push({
          ...importedNote,
        });

        addedNotes++;
      }
    }

    existingVideo.title = importedVideo.title;

    existingVideo.channelName = importedVideo.channelName;

    existingVideo.url = importedVideo.url;

    existingVideo.thumbnailUrl = importedVideo.thumbnailUrl;

    existingVideo.duration = importedVideo.duration;

    existingVideo.updatedAt = Math.max(
      existingVideo.updatedAt,
      importedVideo.updatedAt,
    );
  }

  await saveVideos(mergedVideos);

  await loadVideos();

  showToast(
    `Import completed: ${addedVideos} ${
      addedVideos === 1 ? "video" : "videos"
    } and ${addedNotes} ${addedNotes === 1 ? "note" : "notes"} added.`,
  );
}

// ============================================================
// IMPORT BUTTON
// ============================================================

importButton?.addEventListener("click", () => {
  if (!importFile) {
    return;
  }

  importFile.value = "";

  importFile.click();
});

importFile?.addEventListener("change", async () => {
  const file = importFile.files?.[0];

  if (!file) {
    return;
  }

  try {
    const importedVideos = await readImportFile(file);

    if (importedVideos.length === 0) {
      showToast("Archive does not contain any video.", "error");

      return;
    }

    const confirmed = await showImportModal(importedVideos.length);

    if (!confirmed) {
      return;
    }

    await mergeImportedVideos(importedVideos);
  } catch (error) {
    console.error("Import error:", error);

    showToast(
      error instanceof Error ? error.message : "Error during import.",
      "error",
    );
  }
});

// ============================================================
// EXPORT BUTTON
// ============================================================

exportButton?.addEventListener("click", async () => {
  try {
    await exportAllVideos();
  } catch (error) {
    console.error("Export error:", error);

    showToast("Error during export.", "error");
  }
});

// ============================================================
// DELETE NOTE
// ============================================================

document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;

  const button = target.closest<HTMLButtonElement>(".delete-note-button");

  if (!button) {
    return;
  }

  const platform = button.dataset.platform;

  const externalId = button.dataset.externalId;

  const noteId = button.dataset.noteId;

  if (!platform || !externalId || !noteId) {
    return;
  }

  const video = videos.find(
    (item) => item.platform === platform && item.externalId === externalId,
  );

  const confirmed = await showConfirmModal(
    "Delete this note?",
    "The note will be permanently deleted.",
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;

  try {
    await sendDeleteMessage({
      type: "DELETE_NOTE",

      platform: platform as "youtube" | "instagram",

      externalId,

      noteId,
    });

    if (video) {
      video.notes = video.notes.filter((note) => note.id !== noteId);
    }

    render();

    let finalMessage = "Note deleted.";

    /*
     * Se era l'ultima nota,
     * chiediamo se eliminare
     * anche il contenuto.
     */

    if (video && video.notes.length === 0) {
      const deleteVideo = await showConfirmModal(
        "Delete parent video?",
        "This was the last note for this content. Do you wish to delete the video as well?",
      );

      if (deleteVideo) {
        await sendDeleteMessage({
          type: "DELETE_CONTENT",

          platform: video.platform,

          externalId: video.externalId,
        });

        videos = videos.filter(
          (item) =>
            !(
              item.platform === video.platform &&
              item.externalId === video.externalId
            ),
        );

        render();

        finalMessage = "Content and note deleted.";
      }
    }

    showToast(finalMessage);
  } catch (error) {
    console.error("Note delete error:", error);

    showToast("Error during note deletion.", "error");

    button.disabled = false;
  }
});

// ============================================================
// DELETE CONTENT
// ============================================================

document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;

  const button = target.closest<HTMLButtonElement>(".delete-video-button");

  if (!button) {
    return;
  }

  const platform = button.dataset.platform;

  const externalId = button.dataset.externalId;

  if (!platform || !externalId) {
    return;
  }

  const video = videos.find(
    (item) => item.platform === platform && item.externalId === externalId,
  );

  const title = video?.title ?? "this content";

  const confirmed = await showConfirmModal(
    "Delete this content?",
    `“${title}” and all related notes will be deleted.`,
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;

  try {
    await sendDeleteMessage({
      type: "DELETE_CONTENT",

      platform: platform as "youtube" | "instagram",

      externalId,
    });

    videos = videos.filter(
      (item) => !(item.platform === platform && item.externalId === externalId),
    );

    render();

    showToast("Content deleted.");
  } catch (error) {
    console.error("Content delete error:", error);

    showToast("Error during content deletion.", "error");

    button.disabled = false;
  }
});

// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return (
      `${hours}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${secs.toString().padStart(2, "0")}`
    );
  }

  return (
    `${minutes.toString().padStart(2, "0")}:` +
    `${secs.toString().padStart(2, "0")}`
  );
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// RENDER
// ============================================================

function render(): void {
  if (!videoList) {
    return;
  }

  const search = searchInput?.value.trim().toLowerCase() ?? "";

  let filtered = videos.filter((content) => {
    if (!search) {
      return true;
    }

    return (
      content.title.toLowerCase().includes(search) ||
      content.channelName.toLowerCase().includes(search) ||
      content.notes.some((note) => note.text.toLowerCase().includes(search))
    );
  });

  const sort = sortSelect?.value ?? "date-desc";

  filtered = [...filtered];

  switch (sort) {
    case "date-asc":
      filtered.sort((a, b) => a.createdAt - b.createdAt);

      break;

    case "title-asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title));

      break;

    case "title-desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title));

      break;

    default:
      filtered.sort((a, b) => b.createdAt - a.createdAt);

      break;
  }

  if (filtered.length === 0) {
    videoList.innerHTML = `
      <div class="empty-state">

        <h2>
          No videos saved
        </h2>

        <p>
          Head on YouTube or Instagram and add a note to some content.
        </p>

      </div>
    `;

    return;
  }

  videoList.innerHTML = filtered
    .map((content) => {
      /*
       * Ordine delle note:
       *
       * timestamp presenti:
       * dal più piccolo al più grande.
       *
       * timestamp null:
       * in fondo.
       */

      const notes = [...content.notes]
        .sort((a, b) => {
          if (a.timestamp === null) {
            return 1;
          }

          if (b.timestamp === null) {
            return -1;
          }

          return a.timestamp - b.timestamp;
        })
        .map((note) => {
          /*
           * Timestamp solo YouTube.
           */

          const timestamp =
            content.platform === "youtube" && note.timestamp !== null
              ? `
                        <a
                          href="${escapeHtml(content.url)}&t=${Math.floor(
                            note.timestamp,
                          )}s"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ▶
                          ${formatTime(note.timestamp)}
                        </a>
                      `
              : "";

          return `
                    <li class="note-item"
    data-external-id="${escapeHtml(content.externalId)}"
    data-note-id="${escapeHtml(note.id)}"
>

                      <div class="note-content">

                        ${timestamp}

                        <span class="note-text">
                          ${escapeHtml(note.text)}
                        </span>

                      </div>

                      <button
                        class="delete-note-button"
                        data-platform="${escapeHtml(content.platform)}"
                        data-external-id="${escapeHtml(content.externalId)}"
                        data-note-id="${escapeHtml(note.id)}"
                        title="Delete note"
                      >

                        <img
                          src="${chrome.runtime.getURL(
                            "content/assets/delete.png",
                          )}"
                          style="filter:invert(1);"
                          alt="Delete note"
                        >

                      </button>

                    </li>
                  `;
        })
        .join("");

      const duration =
        content.duration !== null
          ? `
                <span class="video-duration">
                  ${formatTime(content.duration)}
                </span>
              `
          : "";

      const platformLabel =
        content.platform === "instagram" ? "Instagram" : "YouTube";

      return `
            <article
              class="video-card"
              data-platform="${escapeHtml(content.platform)}"
            >

              <div class="video-thumbnail-wrapper">

                <img
                  src="${escapeHtml(content.thumbnailUrl)}"
                  class="video-thumbnail"
                  alt=""
                >

                ${duration}

              </div>


              <div class="video-content">

                <h2>
                  ${escapeHtml(content.title)}
                </h2>


                <div class="video-channel">

                  ${escapeHtml(content.channelName)}

                  <span>
                    ·
                    ${platformLabel}
                  </span>

                </div>


                <div class="video-meta">

                  ${content.notes.length}

                  ${content.notes.length === 1 ? "note" : "notes"}

                </div>


                <div class="video-notes">

                  <h3>
                    Notes
                  </h3>

                  <ul>
                    ${notes}
                  </ul>

                </div>


                <div class="video-actions">

                  <a
                    href="${escapeHtml(content.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ▶ Go to content
                  </a>


                  <button
                    class="delete-video-button"
                    data-platform="${escapeHtml(content.platform)}"
                    data-external-id="${escapeHtml(content.externalId)}"
                    title="Delete content"
                  >

                    <img
                      src="${chrome.runtime.getURL(
                        "content/assets/delete.png",
                      )}"
                      style="filter:invert(1);"
                      alt="Delete content"
                    >

                    Delete content

                  </button>

                </div>

              </div>

            </article>
          `;
    })
    .join("");
}

// ============================================================
// SEARCH / SORT
// ============================================================

searchInput?.addEventListener("input", render);

sortSelect?.addEventListener("change", render);

// ============================================================
// SERVICE WORKER
// ============================================================

async function updateNote(
  externalId: string,
  noteId: string,
  text: string,
): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: "UPDATE_NOTE",

    externalId,

    noteId,

    text,
  });
  
  if (!response?.success) {
    throw new Error(
      response?.error ?? "Errore durante la modifica della nota.",
    );
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;

  const noteText = target.closest<HTMLElement>(".note-text");

  if (!noteText) {
    return;
  }

  /*
   * Evita di riaprire una nota
   * già in modalità modifica.
   */

  if (noteText.dataset.editing === "true") {
    return;
  }

  const noteItem = noteText.closest<HTMLElement>(".note-item");

  if (!noteItem) {
    return;
  }

  const externalId = noteItem.dataset.externalId;

  const noteId = noteItem.dataset.noteId;

  if (!externalId || !noteId) {
    return;
  }

  const video = videos.find((video) => video.externalId === externalId);

  if (!video) {
    return;
  }

  const note = video.notes.find((note) => note.id === noteId);

  if (!note) {
    return;
  }

  startNoteEditing(noteItem, note, externalId);
});

function startNoteEditing(
  noteItem: HTMLElement,
  note: Note,
  externalId: string,
): void {
  const noteContent = noteItem.querySelector<HTMLElement>(".note-content");

  if (!noteContent) {
    return;
  }

Object.assign(
    noteContent.style,
    {
        width: "100%",
        minWidth: "0",
        flex: "1 1 auto",
        boxSizing: "border-box",
    },
);
  /*
   * Evita di creare più editor
   * sulla stessa nota.
   */

  if (noteItem.dataset.editing === "true") {
    return;
  }

  noteItem.dataset.editing = "true";

  const originalText = note.text;

  /*
   * Sostituiamo solamente il testo.
   */

  const textElement = noteItem.querySelector<HTMLElement>(".note-text");

  if (!textElement) {
    return;
  }

  textElement.style.display = "none";

  const editor = document.createElement("textarea");

  editor.className = "note-edit-input";

  editor.value = originalText;

  editor.rows = 1;

  editor.setAttribute("aria-label", "Modifica nota");

  Object.assign(
    editor.style,
    {
        display: "block",

        width: "0",

        minWidth: "0",

        flex: "1 1 0%",

        height: "42px",

        minHeight: "42px",

        boxSizing: "border-box",

        resize: "none",

        padding: "9px 10px",

        border:
            "1px solid rgba(193, 53, 132, .65)",

        borderRadius: "7px",

        outline: "none",

        background:
            "rgba(255,255,255,.06)",

        color: "#fff",

        fontFamily: "inherit",

        fontSize: "inherit",

        lineHeight: "1.4",

        overflow: "hidden",
    },
);

  /*
   * Pulsante conferma.
   */

  const confirmButton = document.createElement("button");

  confirmButton.type = "button";

  confirmButton.className = "note-edit-confirm";

  confirmButton.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12.5
           L9.5 17
           L19 7"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  confirmButton.setAttribute("aria-label", "Conferma modifica");

  Object.assign(confirmButton.style, {
    flexShrink: "0",

    width: "32px",

    height: "38px",

    padding: "0",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    border: "1px solid rgba(193, 53, 132, .65)",

    borderRadius: "7px",

    background: "rgba(193, 53, 132, .12)",

    color: "#d946ef",

    cursor: "pointer",

    transition: "background .15s ease, transform .15s ease",
  });

  confirmButton.addEventListener("mouseenter", () => {
    confirmButton.style.background = "rgba(193, 53, 132, .28)";

    confirmButton.style.transform = "scale(1.05)";
  });

  confirmButton.addEventListener("mouseleave", () => {
    confirmButton.style.background = "rgba(193, 53, 132, .12)";

    confirmButton.style.transform = "scale(1)";
  });

  /*
   * Container dell'editor.
   */
const editorContainer =
    document.createElement("div");

editorContainer.className =
    "note-edit-container";

Object.assign(
    editorContainer.style,
    {
        display: "flex",

        flexDirection: "row",

        alignItems: "stretch",

        width: "100%",

        minWidth: "0",

        flex: "1 1 auto",

        gap: "7px",

        boxSizing: "border-box",
    },
);

  editorContainer.appendChild(editor);

  editorContainer.appendChild(confirmButton);

  /*
   * Inseriamo l'editor al posto del testo.
   */

  textElement.after(editorContainer);

  /*
   * Auto-height della textarea.
   */

  const resizeEditor = () => {
    editor.style.height = "auto";

    editor.style.height = `${editor.scrollHeight}px`;
  };

  editor.addEventListener("input", resizeEditor);

  resizeEditor();

  /*
   * Chiude la modalità modifica
   * senza salvare.
   */

  let finished = false;

  const cancelEditing = () => {
    if (finished) {
      return;
    }

    finished = true;

    editorContainer.remove();

    textElement.style.display = "";

    delete noteItem.dataset.editing;
  };

  /*
   * Salvataggio.
   */

  const saveEditing = async () => {
    if (finished) {
      return;
    }

    const newText = editor.value.trim();

    /*
     * Testo vuoto:
     * annulliamo la modifica.
     */

    if (!newText) {
      cancelEditing();

      return;
    }

    /*
     * Nessuna modifica.
     */

    if (newText === originalText) {
      cancelEditing();

      return;
    }

    confirmButton.disabled = true;

    editor.disabled = true;

    try {
      await updateNote(externalId, note.id, newText);

      /*
       * Aggiorniamo anche
       * il dato locale.
       */

      note.text = newText;

      note.updatedAt = Date.now();

      finished = true;

      /*
       * Ridisegniamo la pagina.
       */

      render();

      showToast("Nota modificata.");
    } catch (error) {
      console.error("Note update error:", error);

      confirmButton.disabled = false;

      editor.disabled = false;

      showToast(
        error instanceof Error ? error.message : "Errore durante la modifica.",
        "error",
      );
    }
  };

  confirmButton.addEventListener("click", (event) => {
    event.preventDefault();

    event.stopPropagation();

    void saveEditing();
  });

  /*
   * Enter = salva
   * Shift + Enter = nuova riga
   */

  editor.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();

      cancelEditing();

      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      void saveEditing();
    }
  });

  /*
   * Click fuori dall'editor:
   * annulla.
   */

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target as Node;

    if (editorContainer.contains(target)) {
      return;
    }

    document.removeEventListener("click", onDocumentClick, true);

    cancelEditing();
  };

  /*
   * Capture = true così intercettiamo
   * il click prima degli altri handler.
   */

  document.addEventListener("click", onDocumentClick, true);

  /*
   * Focus + selezione del testo.
   */

  editor.focus();

  editor.select();
}

async function sendDeleteMessage(
  message:
    | {
        type: "DELETE_CONTENT";

        platform: "youtube" | "instagram";

        externalId: string;
      }
    | {
        type: "DELETE_NOTE";

        platform: "youtube" | "instagram";

        externalId: string;

        noteId: string;
      },
): Promise<void> {
  const response = await chrome.runtime.sendMessage(message);

  if (!response?.success) {
    throw new Error(response?.error ?? "Delete error.");
  }
}

// ============================================================
// CONFIRM MODAL
// ============================================================

function showConfirmModal(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");

    backdrop.className = "confirm-modal-backdrop";

    backdrop.innerHTML = `
        <div
          class="confirm-modal"
          role="dialog"
          aria-modal="true"
        >

          <div class="confirm-modal-header">

            <div class="confirm-modal-icon">
              !
            </div>

            <h2 class="confirm-modal-title">
              ${escapeHtml(title)}
            </h2>

          </div>

          <div class="confirm-modal-content">

            <p class="confirm-modal-message">
              ${escapeHtml(message)}
            </p>

          </div>

          <div class="confirm-modal-footer">

            <button
              type="button"
              class="
                confirm-modal-button
                confirm-modal-cancel
              "
            >
              Cancel
            </button>

            <button
              type="button"
              class="
                confirm-modal-button
                confirm-modal-delete
              "
            >
              Delete
            </button>

          </div>

        </div>
      `;

    document.body.appendChild(backdrop);

    const cancelButton = backdrop.querySelector<HTMLButtonElement>(
      ".confirm-modal-cancel",
    );

    const deleteButton = backdrop.querySelector<HTMLButtonElement>(
      ".confirm-modal-delete",
    );

    let resolved = false;

    const close = (value: boolean) => {
      if (resolved) {
        return;
      }

      resolved = true;

      backdrop.classList.remove("show");

      setTimeout(() => {
        backdrop.remove();
      }, 200);

      resolve(value);
    };

    cancelButton?.addEventListener("click", () => close(false));

    deleteButton?.addEventListener("click", () => close(true));

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        close(false);
      }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    document.addEventListener("keydown", onKeyDown, {
      once: true,
    });

    requestAnimationFrame(() => {
      backdrop.classList.add("show");
    });

    deleteButton?.focus();
  });
}

// ============================================================
// START
// ============================================================

loadVideos().catch((error) => {
  console.error("ERROR READING STORAGE:", error);

  showToast("Unable to read saved content.", "error");
});
