export {};
console.log("Instagram Video Notes - Content Script caricato");

interface InstagramInfo {
  instagramId: string;

  title: string;

  channelName: string;

  url: string;

  duration: number | null;

  thumbnailUrl: string;
}

/*
 * ---------------------------------------------------------
 * Utility
 * ---------------------------------------------------------
 */

/*
function getCurrentInstagramPost(): HTMLElement | null {
    const postLink = document.querySelector<HTMLAnchorElement>(
        'a[href*="/reel/"], a[href*="/p/"]'
    );

    if (!postLink) {
        return null;
    }

    let element: HTMLElement | null = postLink;

    while (element) {
        if (element.querySelector('video')) {
            return element;
        }

        element = element.parentElement;
    }

    return null;
}
*/
/*
 * ---------------------------------------------------------
 * Estrazione thumbnail
 * ---------------------------------------------------------
 *
 * Funzione a parte (non solo dentro getInstagramInfo) perché
 * va richiamata "fresca" più volte durante il ciclo di vita
 * del post/reel aperto: la prima volta che gira potrebbe
 * essere troppo presto (video con preload="none", nessun
 * frame ancora decodificato), quindi la richiamiamo di nuovo
 * al momento del salvataggio della nota, quando il video ha
 * quasi certamente già iniziato la riproduzione.
 *
 * Priorità:
 * 1. poster del video attualmente aperto
 * 2. immagine "overlay" più vicina al <video> nel DOM
 *    (funziona sia per i Reels che per i video salvati,
 *    perché parte dal <video> stesso invece che cercare
 *    un link che punti alla pagina corrente — link che
 *    Instagram non renderizza mai quando sei già sulla
 *    pagina di quel post)
 * 3. frame catturato dal <video> via canvas — necessario
 *    quando Instagram usa uno stream via blob: URL, senza
 *    poster né <img> overlay nel DOM (caso più comune),
 *    e solo se il video ha già un frame decodificato
 *    (readyState >= 2)
 * 4. og:image della pagina (fallback finale: su una SPA
 *    come Instagram può essere stale/non aggiornato dopo
 *    una navigazione client-side, quindi va usato per
 *    ultimo)
 */

function isProfilePicture(img: HTMLImageElement): boolean {
  const alt = img.alt?.toLowerCase() ?? "";

  return (
    alt.includes("profile picture") || alt.includes("immagine del profilo")
  );
}

function extractThumbnailUrl(): string {
  let thumbnailUrl = "";

  const currentVideo = document.querySelector(
    "video",
  ) as HTMLVideoElement | null;

  // 1. Poster del video corrente
  if (currentVideo?.poster) {
    thumbnailUrl = currentVideo.poster;

    return thumbnailUrl;
  }

  // 2. Immagine più vicina al <video>, risalendo nel DOM
  if (currentVideo) {
    let ancestor: HTMLElement | null = currentVideo.parentElement;
    let depth = 0;
    let thumbnailImage: HTMLImageElement | null = null;

    while (ancestor && depth < 6 && !thumbnailImage) {
      const candidates = [
        ...ancestor.querySelectorAll<HTMLImageElement>("img"),
      ];

      const found = candidates.find((img) => img.src && !isProfilePicture(img));

      if (found) {
        thumbnailImage = found;
      }

      ancestor = ancestor.parentElement;
      depth++;
    }

    if (thumbnailImage?.src) {
      return thumbnailImage.src;
    }
  }

  // 3. Cattura un frame dal <video> (solo se ha già dati decodificati)
  if (
    currentVideo &&
    currentVideo.readyState >= 2 &&
    currentVideo.videoWidth > 0 &&
    currentVideo.videoHeight > 0
  ) {
    try {
      const canvas = document.createElement("canvas");

      canvas.width = currentVideo.videoWidth;
      canvas.height = currentVideo.videoHeight;

      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(currentVideo, 0, 0);

        thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);

        return thumbnailUrl;
      }
    } catch (error) {
      console.log("Frame capture failed:", error);
    }
  }

  // 4. Fallback: OpenGraph image
  const ogImage = document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content")
    ?.trim();

  if (ogImage) {
    return ogImage;
  }

  return "";
}

function getInstagramInfo(): InstagramInfo | null {
  const url = window.location.href;

  const match = url.match(/instagram\.com\/(?:reels|p)\/([^/?#]+)/i);

  if (!match) {
    return null;
  }

  const instagramId = match[1];

  /*
   * Titolo
   */
  const ogTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.trim();

  const title = ogTitle || document.title || "Instagram Reel";
  
  const thumbnailUrl = extractThumbnailUrl();

  /*
   * Account
   *
   * Instagram cambia spesso la struttura del DOM.
   * Proviamo prima alcuni selettori relativamente stabili.
   */
  let channelName = "";

  const usernameElement = document.querySelector('a[href^="/"][role="link"]');

  if (usernameElement) {
    const text = usernameElement.textContent?.trim();

    if (text && !text.includes(" ")) {
      channelName = text;
    }
  }

  /*
   * Fallback: proviamo a ricavare
   * il nome dal titolo OpenGraph.
   */
  if (!channelName && ogTitle) {
    const separator = ogTitle.indexOf("•");

    if (separator > 0) {
      channelName = ogTitle.substring(0, separator).trim();
    }
  }

  /*
   * Instagram: niente timestamp.
   *
   * La durata può essere recuperata
   * dall'elemento video se disponibile,
   * ma non è necessaria al funzionamento.
   */
  let duration: number | null = null;

  const video = document.querySelector("video") as HTMLVideoElement | null;

  if (video && Number.isFinite(video.duration) && video.duration > 0) {
    duration = video.duration;
  }

  return {
    instagramId,

    title,

    channelName,

    url,

    duration,

    thumbnailUrl,
  };
}

/*
 * ---------------------------------------------------------
 * Notifica
 * ---------------------------------------------------------
 */

/*
 * ---------------------------------------------------------
 * Dialog
 * ---------------------------------------------------------
 */

function openInstagramNoteDialog(info: InstagramInfo): void {
  document.querySelector(".instagram-notes-overlay")?.remove();

  const overlay = document.createElement("div");

  overlay.className = "instagram-notes-overlay";

  Object.assign(overlay.style, {
    position: "fixed",

    inset: "0",

    zIndex: "2147483646",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background: "rgba(0,0,0,.62)",

    backdropFilter: "blur(5px)",
  });

  const dialog = document.createElement("div");

  dialog.className = "instagram-notes-dialog";

  Object.assign(dialog.style, {
    width: "min(440px, calc(100vw - 32px))",

    boxSizing: "border-box",

    padding: "18px",

    borderRadius: "14px",

    background: "#181818",

    border: "1px solid #303030",

    color: "#fff",

    fontFamily: "Arial, Helvetica, sans-serif",

    boxShadow: "0 20px 60px rgba(0,0,0,.55)",
  });

  dialog.innerHTML = `
        <div
            style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-bottom:14px;
            "
        >
            <div>

                <div
                    style="
                        font-size:15px;
                        font-weight:600;
                        color:#fff;
                    "
                >
                    Add note
                </div>

                <div
                    style="
                        margin-top:3px;
                        font-size:12px;
                        color:#aaa;
                    "
                >
                    ${escapeHtml(info.channelName)}
                </div>

            </div>

            <button
                type="button"
                class="instagram-notes-close"
                aria-label="Close"
                style="
                    width:30px;
                    height:30px;
                    border:0;
                    border-radius:8px;
                    background:#252525;
                    color:#aaa;
                    cursor:pointer;
                    font-size:18px;
                    line-height:30px;
                "
            >
                ×
            </button>

        </div>


        <textarea
            class="instagram-notes-textarea"
            placeholder="Type a note..."
            rows="4"
            style="
                display:block;
                width:100%;
                min-width:0;
                box-sizing:border-box;
                resize:vertical;
                padding:11px 12px;
                border:1px solid #333;
                border-radius:9px;
                outline:none;
                background:#111;
                color:#fff;
                font-family:inherit;
                font-size:13px;
                line-height:1.45;
            "
        ></textarea>


        <div
            style="
                display:flex;
                justify-content:flex-end;
                gap:8px;
                margin-top:12px;
            "
        >

            <button
                type="button"
                class="instagram-notes-cancel"
                style="
                    padding:8px 12px;
                    border:0;
                    border-radius:8px;
                    background:#292929;
                    color:#ccc;
                    cursor:pointer;
                    font-size:13px;
                    font-weight:500;
                "
            >
                Cancel
            </button>


            <button
                type="button"
                class="instagram-notes-save"
                style="
                    padding:8px 14px;
                    border:0;
                    border-radius:8px;
                    background:#fff;
                    color:#111;
                    cursor:pointer;
                    font-size:13px;
                    font-weight:600;
                "
            >
                Save note
            </button>

        </div>
    `;

  overlay.appendChild(dialog);

  document.body.appendChild(overlay);

  const textarea = dialog.querySelector(
    ".instagram-notes-textarea",
  ) as HTMLTextAreaElement;

  const close = () => {
    overlay.remove();
  };

  dialog
    .querySelector(".instagram-notes-close")
    ?.addEventListener("click", close);

  dialog
    .querySelector(".instagram-notes-cancel")
    ?.addEventListener("click", close);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  dialog
    .querySelector(".instagram-notes-save")
    ?.addEventListener("click", async () => {
      const text = textarea.value.trim();

      if (!text) {
        textarea.focus();

        return;
      }

      const save = dialog.querySelector(
        ".instagram-notes-save",
      ) as HTMLButtonElement;

      save.disabled = true;

      save.textContent = "Saving...";

      try {
        // Ricalcolo la thumbnail proprio ora, al momento del
        // salvataggio: se all'apertura della dialog il video
        // non aveva ancora un frame pronto (readyState basso),
        // a questo punto molto probabilmente sì.
        const freshThumbnailUrl = extractThumbnailUrl();
        console.log(freshThumbnailUrl);
        const response = await chrome.runtime.sendMessage({
          type: "SAVE_CONTENT",

          content: {
            platform: "instagram",

            externalId: info.instagramId,

            title: info.title,

            channelName: info.channelName,

            url: info.url,

            duration: info.duration,

            thumbnailUrl: freshThumbnailUrl || info.thumbnailUrl,
          },

          note: {
            text,

            timestamp: null,
          },
        });

        if (!response?.success) {
          throw new Error(response?.error ?? "Error saving note.");
        }

        close();

        showToast("Note saved successfully.");
      } catch (error) {
        console.error("Error saving Instagram:", error);

        showToast(
          error instanceof Error &&
            error.message.includes("Extension context invalidated")
            ? "Extension updated. Refresh the page."
            : "Error saving note.",
          "error",
        );

        save.disabled = false;

        save.textContent = "Save note";
      }
    });

  textarea.focus();
}

/*
 * ---------------------------------------------------------
 * Escape HTML
 * ---------------------------------------------------------
 */

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
 * ---------------------------------------------------------
 * Pulsante
 * ---------------------------------------------------------
 */

function createInstagramNoteButton(): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "instagram-video-notes-button";

  button.type = "button";

  button.setAttribute("aria-label", "Aggiungi nota");

  button.innerHTML = `
        <svg
            class="instagram-video-notes-icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M6 3.75
                   H15.5
                   L19.25 7.5
                   V20.25
                   H6
                   V3.75Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
            />

            <path
                d="M15 3.75
                   V8
                   H19.25"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
            />

            <path
                d="M9 12
                   H16"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <path
                d="M9 15.5
                   H14"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        </svg>
    `;

  Object.assign(button.style, {
    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    width: "40px",

    height: "40px",

    minWidth: "40px",

    minHeight: "40px",

    marginBottom: "8px",

    padding: "0",

    boxSizing: "border-box",

    border: "1.5px solid rgba(193, 53, 132, .9)",

    borderRadius: "50%",

    background: "rgba(20, 20, 20, .72)",

    color: "#d946ef",

    cursor: "pointer",

    backdropFilter: "blur(8px)",

    WebkitBackdropFilter: "blur(8px)",

    boxShadow: "0 2px 10px rgba(0,0,0,.35), 0 0 8px rgba(193,53,132,.22)",

    transition:
      "transform .15s ease, background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease",
  });

  button.addEventListener("mouseenter", () => {
    button.style.background = "rgba(193, 53, 132, .18)";

    button.style.borderColor = "#d946ef";

    button.style.color = "#e879f9";

    button.style.boxShadow =
      "0 2px 12px rgba(0,0,0,.4), 0 0 12px rgba(193,53,132,.45)";

    button.style.transform = "scale(1.08)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = "rgba(20, 20, 20, .72)";

    button.style.borderColor = "rgba(193, 53, 132, .9)";

    button.style.color = "#d946ef";

    button.style.boxShadow =
      "0 2px 10px rgba(0,0,0,.35), 0 0 8px rgba(193,53,132,.22)";

    button.style.transform = "scale(1)";
  });

  button.addEventListener("mousedown", () => {
    button.style.transform = "scale(.92)";
  });

  button.addEventListener("mouseup", () => {
    button.style.transform = "scale(1.08)";
  });

  return button;
}

/*
 * ---------------------------------------------------------
 * Inserimento pulsante
 * ---------------------------------------------------------
 */

/*
 * Risale dall'elemento di partenza (tipicamente un'icona SVG)
 * verso l'alto nel DOM finché non trova un antenato il cui
 * fratello immediatamente successivo contiene, al suo interno,
 * un'icona SVG con uno degli aria-label indicati.
 *
 * Serve per individuare il "blocco" corretto di un'azione
 * nella sidebar dei Reel (es. il blocco "mi piace") quando
 * Instagram non usa tag o classi stabili per raggrupparle:
 * l'unica cosa affidabile è l'ordine reciproco tra i blocchi
 * (mi piace è sempre seguito da commenta, ecc.).
 */
function findBlockBeforeSiblingWithIcon(
  startElement: Element,
  nextBlockIconLabels: string[],
): Element | null {
  let node: Element | null = startElement;

  while (node && node.parentElement) {
    const nextSibling = node.nextElementSibling;

    if (nextSibling) {
      const hasMatchingIcon = nextBlockIconLabels.some((label) =>
        nextSibling.querySelector(`svg[aria-label="${label}"]`),
      );

      if (hasMatchingIcon) {
        return node;
      }
    }

    node = node.parentElement;
  }

  return null;
}

function insertNoteButton(): void {
  const info = getInstagramInfo();

  if (!info) {
    return;
  }

  /*
   * Evita duplicati.
   */
  if (document.querySelector(".instagram-video-notes-button")) {
    return;
  }

  const url = window.location.href;

  const isPost = /instagram\.com\/p\//i.test(url);

  const isReel = /instagram\.com\/reels\//i.test(url);

  /*
   * ---------------------------------------------------------
   * CASO /p/
   *
   * Il pulsante viene messo a destra
   * del pulsante "Condividi il post".
   * ---------------------------------------------------------
   */

  if (isPost) {
    /*
     * Instagram mette aria-label="Condividi il post"
     * direttamente sull'SVG, NON sul button.
     */
    /*const shareIcon = document.querySelector(
      'svg[aria-label="Condividi il post"]',
    );*/
    const shareIcon = Array.from(
      document.querySelectorAll("svg[aria-label]"),
    ).find((el) => {
      const label = el.getAttribute("aria-label")?.toLowerCase() ?? "";
      return label.includes("share") || label.includes("condividi");
    });

    console.log(shareIcon);

    if (!shareIcon) {
      return;
    }

    /*
     * Risaliamo dall'SVG al button.
     */
    const shareButton = shareIcon.closest("button");

    if (!shareButton) {
      return;
    }

    /*
     * Il button è contenuto nello span
     * che rappresenta l'elemento della barra.
     */
    const shareSpan = shareButton.closest("span");

    if (!shareSpan) {
      return;
    }

    /*
     * Crea il nostro pulsante.
     */
    const button = createInstagramNoteButton();

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const currentInfo = getInstagramInfo();

      if (currentInfo) {
        openInstagramNoteDialog(currentInfo);
      }
    });

    /*
     * Instagram utilizza uno span
     * come contenitore dei pulsanti.
     */
    const buttonSpan = document.createElement("span");

    buttonSpan.className = "instagram-video-notes-wrapper";

    buttonSpan.appendChild(button);

    /*
     * Inseriamo:
     *
     * Condividi
     *     ↓
     * Nostra Nota
     *     ↓
     * Rimuovi
     */
    shareSpan.insertAdjacentElement("afterend", buttonSpan);

    return;
  }

  /*
   * ---------------------------------------------------------
   * CASO /reel/
   *
   * Il pulsante viene messo sopra il pulsante "Mi piace".
   *
   * Instagram non usa <section> per raggruppare le azioni
   * della sidebar (mi piace, commenta, ripubblica, ecc.), ma
   * dei semplici <div> con classi atomiche generate che
   * cambiano spesso ad ogni deploy — quindi non possiamo
   * affidarci né a "section" né ai nomi di classe.
   *
   * L'unica cosa stabile è la relazione strutturale: il
   * blocco "mi piace" è sempre seguito, come fratello nel
   * DOM, dal blocco "commenta". Risaliamo quindi dall'icona
   * del like finché non troviamo l'antenato il cui fratello
   * successivo contiene l'icona "Commenta": quell'antenato
   * è il blocco giusto davanti al quale inserire il nostro
   * pulsante.
   * ---------------------------------------------------------
   */

  if (isReel) {
    /*
     * Instagram mette l'aria-label direttamente sull'SVG.
     * L'etichetta cambia in base allo stato (piaciuto o no)
     * e in base alla lingua, quindi copriamo entrambi i casi.
     */
    const likeIcon = document.querySelector(
      'svg[aria-label="Mi piace"], svg[aria-label="Non mi piace più"], svg[aria-label="Like"], svg[aria-label="Unlike"]',
    );

    const likeBlock = likeIcon
      ? findBlockBeforeSiblingWithIcon(likeIcon, ["Commenta", "Comment"])
      : null;

    const button = createInstagramNoteButton();

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const currentInfo = getInstagramInfo();

      if (currentInfo) {
        openInstagramNoteDialog(currentInfo);
      }
    });

    if (likeBlock) {
      const likeBlockElement = likeBlock as HTMLElement;

      /*
       * La sidebar dei Reel usa spesso `position: absolute` per
       * posizionare le icone (tipico del framework CSS-in-JS di
       * Instagram), quindi inserire il pulsante semplicemente
       * come "fratello nel DOM" non garantisce che appaia nel
       * punto giusto: senza una posizione esplicita può finire
       * ovunque, incluso in alto a sinistra della pagina.
       *
       * Ancoriamo quindi il pulsante via CSS direttamente al
       * blocco del like: se il blocco non ha già un contesto di
       * posizionamento, glielo diamo (position: relative, che
       * non altera il suo aspetto visivo), e posizioniamo il
       * pulsante in assoluto appena sopra di esso, centrato.
       */
      const currentPosition =
        window.getComputedStyle(likeBlockElement).position;

      if (currentPosition === "static" || !currentPosition) {
        likeBlockElement.style.position = "relative";
      }

      Object.assign(button.style, {
        position: "absolute",
        bottom: "100%",
        left: "0",
        right: "0",
        margin: "0 auto 8px auto",
        zIndex: "10",
      });

      likeBlockElement.appendChild(button);

      return;
    }

    /*
     * Fallback: se Instagram cambia la struttura e non
     * troviamo più il pulsante "Mi piace", torniamo al
     * comportamento precedente (meno preciso, ma meglio
     * di niente).
     */
    const candidates = ["article", "main", "[role='main']"];

    let container: Element | null = null;

    for (const selector of candidates) {
      const element = document.querySelector(selector);

      if (element) {
        container = element;

        break;
      }
    }

    if (!container) {
      return;
    }

    const actionCandidates = ["section", "[role='button']"];

    let actionContainer: Element | null = null;

    for (const selector of actionCandidates) {
      const elements = container.querySelectorAll(selector);

      if (elements.length > 0) {
        actionContainer = elements[elements.length - 1];

        break;
      }
    }

    if (actionContainer) {
      actionContainer.appendChild(button);
    } else {
      container.appendChild(button);
    }
  }
}

/*
 * ---------------------------------------------------------
 * Controllo pagina
 * ---------------------------------------------------------
 */

let lastUrlIG = window.location.href;

function checkPage(): void {
  const currentUrl = window.location.href;

  if (currentUrl !== lastUrlIG) {
    lastUrlIG = currentUrl;

    document.querySelector(".instagram-video-notes-button")?.remove();
  }

  if (!currentUrl.match(/instagram\.com\/(?:reels|p)\//i)) {
    return;
  }

  insertNoteButton();
}

/*
 * ---------------------------------------------------------
 * MutationObserver
 * ---------------------------------------------------------
 */
let observerTimeout: number | null = null;

const observer = new MutationObserver(() => {
  if (observerTimeout !== null) {
    window.clearTimeout(observerTimeout);
  }

  observerTimeout = window.setTimeout(() => {
    observerTimeout = null;

    checkPage();
  }, 150);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

/*
 * ---------------------------------------------------------
 * Navigazione Instagram
 * ---------------------------------------------------------
 *
 * Instagram usa una SPA, quindi una normale
 * navigazione non ricarica necessariamente
 * il content script.
 */

const originalPushState = history.pushState;

history.pushState = function (...args) {
  const result = originalPushState.apply(this, args);

  window.dispatchEvent(new Event("instagram-location-change"));

  return result;
};

const originalReplaceState = history.replaceState;

history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);

  window.dispatchEvent(new Event("instagram-location-change"));

  return result;
};

window.addEventListener("popstate", checkPage);

window.addEventListener("instagram-location-change", () => {
  window.setTimeout(checkPage, 300);
});

/*
 * ---------------------------------------------------------
 * Avvio
 * ---------------------------------------------------------
 */

console.log("VideoNotes initialized");

window.setTimeout(checkPage, 1000);

function ensureToastStyles(): void {
  if (document.getElementById("instagram-notes-toast-styles")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "instagram-notes-toast-styles";

  style.textContent = `
    .instagram-notes-toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .instagram-notes-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 220px;
      max-width: 340px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #181818;
      border: 1px solid #303030;
      color: #fff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      box-shadow: 0 12px 32px rgba(0,0,0,.5);
      pointer-events: auto;
      opacity: 1;
      transform: translateY(0);
      transition: opacity .25s ease, transform .25s ease;
    }

    .instagram-notes-toast.hide {
      opacity: 0;
      transform: translateY(8px);
    }

    .instagram-notes-toast-icon {
      flex: 0 0 auto;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }

    .instagram-notes-toast.success .instagram-notes-toast-icon {
      background: #2ecc71;
    }

    .instagram-notes-toast.error .instagram-notes-toast-icon {
      background: #e74c3c;
    }

    .instagram-notes-toast-message {
      flex: 1 1 auto;
      line-height: 1.4;
    }

    .instagram-notes-toast-close {
      flex: 0 0 auto;
      width: 22px;
      height: 22px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #aaa;
      cursor: pointer;
      font-size: 16px;
      line-height: 22px;
    }

    .instagram-notes-toast-close:hover {
      background: #252525;
      color: #fff;
    }
  `;

  document.head.appendChild(style);
}

function showToast(
  message: string,
  type: "success" | "error" = "success",
  duration: number = 3000,
): void {
  ensureToastStyles();

  let container = document.querySelector<HTMLDivElement>(
    ".instagram-notes-toast-container",
  );

  if (!container) {
    container = document.createElement("div");

    container.className = "instagram-notes-toast-container";

    document.body.appendChild(container);
  }

  const toast = document.createElement("div");

  toast.className = `instagram-notes-toast ${type}`;

  const icon = document.createElement("div");

  icon.className = "instagram-notes-toast-icon";

  icon.textContent = type === "success" ? "✓" : "!";

  const text = document.createElement("div");

  text.className = "instagram-notes-toast-message";

  text.textContent = message;

  const close = document.createElement("button");

  close.className = "instagram-notes-toast-close";

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
