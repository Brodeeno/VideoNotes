/*
 * ============================================================
 * STORAGE
 * ============================================================
 */

const STORAGE_KEY = "SavedContents";

/*
 * ============================================================
 * INTERFACCE
 * ============================================================
 */

interface SaveContentMessage {
  type: "SAVE_CONTENT";

  content: {
    platform: "youtube" | "instagram";

    externalId: string;

    title: string;

    channelName: string;

    url: string;

    duration: number | null;

    thumbnailUrl: string;
  };

  note: {
    text: string;

    timestamp: number | null;
  };
}

interface StoredNote {
  id: string;

  text: string;

  timestamp: number | null;

  createdAt: number;

  updatedAt: number;
}

interface StoredContent {
  id: string;

  platform: "youtube" | "instagram";

  externalId: string;

  url: string;

  title: string;

  channelName: string;

  thumbnailUrl: string;

  duration: number | null;

  notes: StoredNote[];

  createdAt: number;

  updatedAt: number;
}

/*
 * ============================================================
 * DELETE MESSAGES
 * ============================================================
 */

interface DeleteContentMessage {
  type: "DELETE_CONTENT";

  platform: "youtube" | "instagram";

  externalId: string;
}

interface DeleteNoteMessage {
  type: "DELETE_NOTE";

  platform: "youtube" | "instagram";

  externalId: string;

  noteId: string;
}

interface UpdateNoteMessage {
  type: "UPDATE_NOTE";

  externalId: string;

  noteId: string;

  text: string;
}

/*
 * ============================================================
 * MESSAGGI
 * ============================================================
 */

type ExtensionMessage =
  | SaveContentMessage
  | DeleteContentMessage
  | DeleteNoteMessage
  | UpdateNoteMessage;

/*
 * ============================================================
 * HELPER STORAGE
 * ============================================================
 */

async function getContents(): Promise<StoredContent[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);

  const contents = result[STORAGE_KEY];

  if (!Array.isArray(contents)) {
    return [];
  }

  return contents as StoredContent[];
}

chrome.runtime.onInstalled.addListener(
    details => {

        if (
            details.reason ===
            "install"
        ) {

            chrome.tabs.create({
                url:
                    chrome.runtime.getURL(
                        "welcome/index.html"
                    )
            });

        }

    }
);

/*
 * ============================================================
 * SAVE CONTENT
 * ============================================================
 */

async function saveContent(message: SaveContentMessage): Promise<void> {
  const contents = await getContents();
  const now = Date.now();

  /*
   * Cerchiamo il contenuto usando:
   *
   * platform + externalId
   *
   * Questo evita collisioni tra YouTube
   * e Instagram.
   */

  let content = contents.find(
    (item) =>
      item.platform === message.content.platform &&
      item.externalId === message.content.externalId,
  );

  /*
   * ==========================================================
   * NUOVA NOTA
   * ==========================================================
   */

  const note: StoredNote = {
    id: crypto.randomUUID(),

    text: message.note.text,

    timestamp: message.note.timestamp,

    createdAt: now,

    updatedAt: now,
  };

  /*
   * ==========================================================
   * CONTENUTO GIÀ ESISTENTE
   * ==========================================================
   */

  if (content) {
    /*
     * Sicurezza per eventuali vecchi record.
     */

    if (!Array.isArray(content.notes)) {
      content.notes = [];
    }

    content.notes.push(note);

    /*
     * Aggiorniamo i dati del contenuto.
     */

    content.platform = message.content.platform;

    content.externalId = message.content.externalId;

    content.title = message.content.title;

    content.channelName = message.content.channelName;

    content.url = message.content.url;

    content.duration = message.content.duration;

    content.thumbnailUrl = message.content.thumbnailUrl;

    content.updatedAt = now;

    /*
     * Ordiniamo le note.
     *
     * YouTube:
     * timestamp crescente.
     *
     * Instagram:
     * timestamp null.
     *
     * Le note senza timestamp vengono
     * comunque mantenute.
     */

    content.notes.sort((first, second) => {
      if (first.timestamp === null && second.timestamp === null) {
        return first.createdAt - second.createdAt;
      }

      if (first.timestamp === null) {
        return 1;
      }

      if (second.timestamp === null) {
        return -1;
      }

      return first.timestamp - second.timestamp;
    });
  } else {
    /*
     * ==========================================================
     * NUOVO CONTENUTO
     * ==========================================================
     */
    content = {
      id: crypto.randomUUID(),

      platform: message.content.platform,

      externalId: message.content.externalId,

      url: message.content.url,

      title: message.content.title,

      channelName: message.content.channelName,

      thumbnailUrl: message.content.thumbnailUrl,

      duration: message.content.duration,

      notes: [note],

      createdAt: now,

      updatedAt: now,
    };

    contents.push(content);
  }

  /*
   * ==========================================================
   * SALVATAGGIO
   * ==========================================================
   */

  await chrome.storage.local.set({
    [STORAGE_KEY]: contents,
  });
}

/*
 * ============================================================
 * DELETE CONTENT
 * ============================================================
 */

async function deleteContent(
  platform: "youtube" | "instagram",

  externalId: string,
): Promise<void> {
  const contents = await getContents();

  const index = contents.findIndex(
    (content) =>
      content.platform === platform && content.externalId === externalId,
  );

  /*
   * Contenuto non trovato.
   */

  if (index === -1) {
    throw new Error("Contenuto non trovato.");
  }

  contents.splice(index, 1);

  await chrome.storage.local.set({
    [STORAGE_KEY]: contents,
  });
}

/*
 * ============================================================
 * DELETE NOTE
 * ============================================================
 */

async function deleteNote(
  platform: "youtube" | "instagram",

  externalId: string,

  noteId: string,
): Promise<void> {
  
  const contents = await getContents();

  /*
   * Cerchiamo il contenuto.
   */

  const content = contents.find(
    (item) => item.platform === platform && item.externalId === externalId,
  );

  if (!content) {
    throw new Error("Contenuto non trovato.");
  }

  /*
   * Sicurezza per vecchi record.
   */

  if (!Array.isArray(content.notes)) {
    throw new Error("Il contenuto non contiene note valide.");
  }

  /*
   * Cerchiamo la nota.
   */

  const noteIndex = content.notes.findIndex((note) => note.id === noteId);

  if (noteIndex === -1) {
    throw new Error("Nota non trovata.");
  }

  /*
   * Eliminiamo solamente la nota.
   */

  content.notes.splice(noteIndex, 1);

  content.updatedAt = Date.now();

  /*
   * Salviamo.
   */

  await chrome.storage.local.set({
    [STORAGE_KEY]: contents,
  });

}

/*
 * ============================================================
 * MESSAGE LISTENER
 * ============================================================
 */

async function updateNote(
  externalId: string,
  noteId: string,
  text: string,
): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);

  const videos = (result[STORAGE_KEY] as StoredContent[] | undefined) ?? [];

  const video = videos.find((item) => item.externalId === externalId);

  if (!video) {
    throw new Error("Video non trovato.");
  }

  const note = video.notes.find((item) => item.id === noteId);

  if (!note) {
    throw new Error("Nota non trovata.");
  }

  note.text = text;

  note.updatedAt = Date.now();

  video.updatedAt = Date.now();

  await chrome.storage.local.set({
    [STORAGE_KEY]: videos,
  });
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,

    _sender,

    sendResponse,
  ) => {
    
    /*
     * ========================================================
     * SAVE CONTENT
     * ========================================================
     */

    if (message.type === "SAVE_CONTENT") {
      saveContent(message)
        .then(() => {
          sendResponse({
            success: true,
          });
        })
        .catch((error) => {
          sendResponse({
            success: false,

            error: error instanceof Error ? error.message : String(error),
          });
        });

      /*
       * Manteniamo il canale aperto
       * per la risposta asincrona.
       */

      return true;
    }

    /*
     * ========================================================
     * DELETE CONTENT
     * ========================================================
     */

    if (message.type === "DELETE_CONTENT") {
      deleteContent(
        message.platform,

        message.externalId,
      )
        .then(() => {
          sendResponse({
            success: true,
          });
        })
        .catch((error) => {
          sendResponse({
            success: false,

            error: error instanceof Error ? error.message : String(error),
          });
        });

      return true;
    }

    /*
     * ========================================================
     * DELETE NOTE
     * ========================================================
     */

    if (message.type === "DELETE_NOTE") {
      deleteNote(
        message.platform,

        message.externalId,

        message.noteId,
      )
        .then(() => {
          sendResponse({
            success: true,
          });
        })
        .catch((error) => {
          sendResponse({
            success: false,

            error: error instanceof Error ? error.message : String(error),
          });
        });

      return true;
    }

    if (message?.type === "UPDATE_NOTE") {
      updateNote(message.externalId, message.noteId, message.text)
        .then(() => {
          sendResponse({
            success: true,
          });
        })
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });

      return true;
    }

    /*
     * ========================================================
     * MESSAGGIO SCONOSCIUTO
     * ========================================================
     */

    console.warn("Unrecognized message:", message);

    return false;
  },
);

/*
 * ============================================================
 * STARTUP
 * ============================================================
 */

/*
 * ============================================================
 * CLICK SULL'ICONA DELL'ESTENSIONE
 * ============================================================
 */

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("app/index.html");

  await chrome.tabs.create({
    url,
  });
});

console.log("Service Worker started.");
