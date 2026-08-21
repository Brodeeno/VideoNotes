(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))e(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&e(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function e(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();const x="SavedContents",I=document.querySelector("#search"),S=document.querySelector("#sort"),y=document.querySelector("#video-list"),T=document.getElementById("export-button"),D=document.getElementById("import-button"),g=document.getElementById("import-file");let m=[];console.log("APP STARTED");async function A(){const t=(await chrome.storage.local.get(x))[x];return Array.isArray(t)?t:[]}async function C(r){await chrome.storage.local.set({[x]:r})}async function N(){m=await A(),v()}function f(r,t="success"){const n=document.querySelector(".app-toast");n&&n.remove();const e=document.createElement("div");e.className=`app-toast ${t}`,e.textContent=r,document.body.appendChild(e),requestAnimationFrame(()=>{e.classList.add("show")}),setTimeout(()=>{e.classList.remove("show"),setTimeout(()=>{e.remove()},250)},3e3)}async function O(){if(m.length===0){f("No videos to export.","error");return}const r={format:"youtube-video-notes",version:1,exportedAt:new Date().toISOString(),videos:m},t=JSON.stringify(r,null,2),n=new Blob([t],{type:"application/json"}),e=URL.createObjectURL(n),o=document.createElement("a"),s=new Date().toISOString().slice(0,10);o.href=e,o.download=`youtube-video-notes-${s}.json`,document.body.appendChild(o),o.click(),o.remove(),URL.revokeObjectURL(e),f(`${m.length} ${m.length===1?"video":"videos"} exported.`)}async function V(r){const t=await r.text();let n;try{n=JSON.parse(t)}catch{throw new Error("Selected file does not contain valid JSON.")}if(!M(n))throw new Error("Selected file is not a valid VideoNotes archive.");return n.videos}function M(r){if(typeof r!="object"||r===null)return!1;const t=r;return t.format!=="youtube-video-notes"||t.version!==1||!Array.isArray(t.videos)?!1:t.videos.every(j)}function j(r){if(typeof r!="object"||r===null)return!1;const t=r;return typeof t.id!="string"||t.platform!=="youtube"&&t.platform!=="instagram"||typeof t.externalId!="string"||typeof t.url!="string"||typeof t.title!="string"||typeof t.channelName!="string"||typeof t.thumbnailUrl!="string"||t.duration!==null&&typeof t.duration!="number"||!Array.isArray(t.notes)||typeof t.createdAt!="number"||typeof t.updatedAt!="number"?!1:t.notes.every(q)}function q(r){if(typeof r!="object"||r===null)return!1;const t=r;return!(typeof t.id!="string"||typeof t.text!="string"||t.timestamp!==null&&typeof t.timestamp!="number"||typeof t.createdAt!="number"||typeof t.updatedAt!="number")}function R(r){return new Promise(t=>{const n=document.createElement("div");n.className="import-modal-backdrop",n.innerHTML=`
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
                ${r}
              </span>

              <span class="import-modal-count-label">
                ${r===1?"video":"videos"}
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
      `,document.body.appendChild(n);const e=n.querySelector(".import-modal-close"),o=n.querySelector(".import-modal-cancel"),s=n.querySelector(".import-modal-confirm");let a=!1;const i=l=>{a||(a=!0,n.classList.remove("show"),setTimeout(()=>{n.remove()},200),t(l))};e?.addEventListener("click",()=>i(!1)),o?.addEventListener("click",()=>i(!1)),s?.addEventListener("click",()=>i(!0)),n.addEventListener("click",l=>{l.target===n&&i(!1)}),requestAnimationFrame(()=>{n.classList.add("show")}),s?.focus()})}async function B(r){const n=[...await A()];let e=0,o=0;for(const s of r){const a=n.find(i=>i.platform===s.platform&&i.externalId===s.externalId);if(!a){n.push({...s,notes:s.notes.map(i=>({...i}))}),e++,o+=s.notes.length;continue}for(const i of s.notes)a.notes.some(u=>u.id===i.id)||(a.notes.push({...i}),o++);a.title=s.title,a.channelName=s.channelName,a.url=s.url,a.thumbnailUrl=s.thumbnailUrl,a.duration=s.duration,a.updatedAt=Math.max(a.updatedAt,s.updatedAt)}await C(n),await N(),f(`Import completed: ${e} ${e===1?"video":"videos"} and ${o} ${o===1?"note":"notes"} added.`)}D?.addEventListener("click",()=>{g&&(g.value="",g.click())});g?.addEventListener("change",async()=>{const r=g.files?.[0];if(r)try{const t=await V(r);if(t.length===0){f("Archive does not contain any video.","error");return}if(!await R(t.length))return;await B(t)}catch(t){console.error("Import error:",t),f(t instanceof Error?t.message:"Error during import.","error")}});T?.addEventListener("click",async()=>{try{await O()}catch(r){console.error("Export error:",r),f("Error during export.","error")}});document.addEventListener("click",async r=>{const n=r.target.closest(".delete-note-button");if(!n)return;const e=n.dataset.platform,o=n.dataset.externalId,s=n.dataset.noteId;if(!e||!o||!s)return;const a=m.find(l=>l.platform===e&&l.externalId===o);if(await w("Delete this note?","The note will be permanently deleted.")){n.disabled=!0;try{await E({type:"DELETE_NOTE",platform:e,externalId:o,noteId:s}),a&&(a.notes=a.notes.filter(u=>u.id!==s)),v();let l="Note deleted.";a&&a.notes.length===0&&await w("Delete parent video?","This was the last note for this content. Do you wish to delete the video as well?")&&(await E({type:"DELETE_CONTENT",platform:a.platform,externalId:a.externalId}),m=m.filter(p=>!(p.platform===a.platform&&p.externalId===a.externalId)),v(),l="Content and note deleted."),f(l)}catch(l){console.error("Note delete error:",l),f("Error during note deletion.","error"),n.disabled=!1}}});document.addEventListener("click",async r=>{const n=r.target.closest(".delete-video-button");if(!n)return;const e=n.dataset.platform,o=n.dataset.externalId;if(!e||!o)return;const a=m.find(l=>l.platform===e&&l.externalId===o)?.title??"this content";if(await w("Delete this content?",`“${a}” and all related notes will be deleted.`)){n.disabled=!0;try{await E({type:"DELETE_CONTENT",platform:e,externalId:o}),m=m.filter(l=>!(l.platform===e&&l.externalId===o)),v(),f("Content deleted.")}catch(l){console.error("Content delete error:",l),f("Error during content deletion.","error"),n.disabled=!1}}});function k(r){if(r===null||!Number.isFinite(r))return"00:00";const t=Math.floor(r/3600),n=Math.floor(r%3600/60),e=Math.floor(r%60);return t>0?`${t}:${n.toString().padStart(2,"0")}:${e.toString().padStart(2,"0")}`:`${n.toString().padStart(2,"0")}:${e.toString().padStart(2,"0")}`}function d(r){return r.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function v(){if(!y)return;const r=I?.value.trim().toLowerCase()??"";let t=m.filter(e=>r?e.title.toLowerCase().includes(r)||e.channelName.toLowerCase().includes(r)||e.notes.some(o=>o.text.toLowerCase().includes(r)):!0);const n=S?.value??"date-desc";switch(t=[...t],n){case"date-asc":t.sort((e,o)=>e.createdAt-o.createdAt);break;case"title-asc":t.sort((e,o)=>e.title.localeCompare(o.title));break;case"title-desc":t.sort((e,o)=>o.title.localeCompare(e.title));break;default:t.sort((e,o)=>o.createdAt-e.createdAt);break}if(t.length===0){y.innerHTML=`
      <div class="empty-state">

        <h2>
          No videos saved
        </h2>

        <p>
          Head on YouTube or Instagram and add a note to some content.
        </p>

      </div>
    `;return}y.innerHTML=t.map(e=>{const o=[...e.notes].sort((i,l)=>i.timestamp===null?1:l.timestamp===null?-1:i.timestamp-l.timestamp).map(i=>{const l=e.platform==="youtube"&&i.timestamp!==null?`
                        <a
                          href="${d(e.url)}&t=${Math.floor(i.timestamp)}s"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ▶
                          ${k(i.timestamp)}
                        </a>
                      `:"";return`
                    <li class="note-item"
    data-external-id="${d(e.externalId)}"
    data-note-id="${d(i.id)}"
>

                      <div class="note-content">

                        ${l}

                        <span class="note-text">
                          ${d(i.text)}
                        </span>

                      </div>

                      <button
                        class="delete-note-button"
                        data-platform="${d(e.platform)}"
                        data-external-id="${d(e.externalId)}"
                        data-note-id="${d(i.id)}"
                        title="Delete note"
                      >

                        <img
                          src="${chrome.runtime.getURL("content/assets/delete.png")}"
                          style="filter:invert(1);"
                          alt="Delete note"
                        >

                      </button>

                    </li>
                  `}).join(""),s=e.duration!==null?`
                <span class="video-duration">
                  ${k(e.duration)}
                </span>
              `:"",a=e.platform==="instagram"?"Instagram":"YouTube";return`
            <article
              class="video-card"
              data-platform="${d(e.platform)}"
            >

              <div class="video-thumbnail-wrapper">

                <img
                  src="${d(e.thumbnailUrl)}"
                  class="video-thumbnail"
                  alt=""
                >

                ${s}

              </div>


              <div class="video-content">

                <h2>
                  ${d(e.title)}
                </h2>


                <div class="video-channel">

                  ${d(e.channelName)}

                  <span>
                    ·
                    ${a}
                  </span>

                </div>


                <div class="video-meta">

                  ${e.notes.length}

                  ${e.notes.length===1?"note":"notes"}

                </div>


                <div class="video-notes">

                  <h3>
                    Notes
                  </h3>

                  <ul>
                    ${o}
                  </ul>

                </div>


                <div class="video-actions">

                  <a
                    href="${d(e.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ▶ Go to content
                  </a>


                  <button
                    class="delete-video-button"
                    data-platform="${d(e.platform)}"
                    data-external-id="${d(e.externalId)}"
                    title="Delete content"
                  >

                    <img
                      src="${chrome.runtime.getURL("content/assets/delete.png")}"
                      style="filter:invert(1);"
                      alt="Delete content"
                    >

                    Delete content

                  </button>

                </div>

              </div>

            </article>
          `}).join("")}I?.addEventListener("input",v);S?.addEventListener("change",v);async function U(r,t,n){const e=await chrome.runtime.sendMessage({type:"UPDATE_NOTE",externalId:r,noteId:t,text:n});if(!e?.success)throw new Error(e?.error??"Errore durante la modifica della nota.")}document.addEventListener("click",async r=>{const n=r.target.closest(".note-text");if(!n||n.dataset.editing==="true")return;const e=n.closest(".note-item");if(!e)return;const o=e.dataset.externalId,s=e.dataset.noteId;if(!o||!s)return;const a=m.find(l=>l.externalId===o);if(!a)return;const i=a.notes.find(l=>l.id===s);i&&H(e,i,o)});function H(r,t,n){const e=r.querySelector(".note-content");if(!e||(Object.assign(e.style,{width:"100%",minWidth:"0",flex:"1 1 auto",boxSizing:"border-box"}),r.dataset.editing==="true"))return;r.dataset.editing="true";const o=t.text,s=r.querySelector(".note-text");if(!s)return;s.style.display="none";const a=document.createElement("textarea");a.className="note-edit-input",a.value=o,a.rows=1,a.setAttribute("aria-label","Modifica nota"),Object.assign(a.style,{display:"block",width:"0",minWidth:"0",flex:"1 1 0%",height:"42px",minHeight:"42px",boxSizing:"border-box",resize:"none",padding:"9px 10px",border:"1px solid rgba(193, 53, 132, .65)",borderRadius:"7px",outline:"none",background:"rgba(255,255,255,.06)",color:"#fff",fontFamily:"inherit",fontSize:"inherit",lineHeight:"1.4",overflow:"hidden"});const i=document.createElement("button");i.type="button",i.className="note-edit-confirm",i.innerHTML=`
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
  `,i.setAttribute("aria-label","Conferma modifica"),Object.assign(i.style,{flexShrink:"0",width:"32px",height:"38px",padding:"0",display:"flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box",border:"1px solid rgba(193, 53, 132, .65)",borderRadius:"7px",background:"rgba(193, 53, 132, .12)",color:"#d946ef",cursor:"pointer",transition:"background .15s ease, transform .15s ease"}),i.addEventListener("mouseenter",()=>{i.style.background="rgba(193, 53, 132, .28)",i.style.transform="scale(1.05)"}),i.addEventListener("mouseleave",()=>{i.style.background="rgba(193, 53, 132, .12)",i.style.transform="scale(1)"});const l=document.createElement("div");l.className="note-edit-container",Object.assign(l.style,{display:"flex",flexDirection:"row",alignItems:"stretch",width:"100%",minWidth:"0",flex:"1 1 auto",gap:"7px",boxSizing:"border-box"}),l.appendChild(a),l.appendChild(i),s.after(l);const u=()=>{a.style.height="auto",a.style.height=`${a.scrollHeight}px`};a.addEventListener("input",u),u();let p=!1;const b=()=>{p||(p=!0,l.remove(),s.style.display="",delete r.dataset.editing)},L=async()=>{if(p)return;const c=a.value.trim();if(!c){b();return}if(c===o){b();return}i.disabled=!0,a.disabled=!0;try{await U(n,t.id,c),t.text=c,t.updatedAt=Date.now(),p=!0,v(),f("Nota modificata.")}catch(h){console.error("Note update error:",h),i.disabled=!1,a.disabled=!1,f(h instanceof Error?h.message:"Errore durante la modifica.","error")}};i.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),L()}),a.addEventListener("keydown",c=>{if(c.key==="Escape"){c.preventDefault(),b();return}c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),L())});const $=c=>{const h=c.target;l.contains(h)||(document.removeEventListener("click",$,!0),b())};document.addEventListener("click",$,!0),a.focus(),a.select()}async function E(r){const t=await chrome.runtime.sendMessage(r);if(!t?.success)throw new Error(t?.error??"Delete error.")}function w(r,t){return new Promise(n=>{const e=document.createElement("div");e.className="confirm-modal-backdrop",e.innerHTML=`
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
              ${d(r)}
            </h2>

          </div>

          <div class="confirm-modal-content">

            <p class="confirm-modal-message">
              ${d(t)}
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
      `,document.body.appendChild(e);const o=e.querySelector(".confirm-modal-cancel"),s=e.querySelector(".confirm-modal-delete");let a=!1;const i=u=>{a||(a=!0,e.classList.remove("show"),setTimeout(()=>{e.remove()},200),n(u))};o?.addEventListener("click",()=>i(!1)),s?.addEventListener("click",()=>i(!0)),e.addEventListener("click",u=>{u.target===e&&i(!1)});const l=u=>{u.key==="Escape"&&i(!1)};document.addEventListener("keydown",l,{once:!0}),requestAnimationFrame(()=>{e.classList.add("show")}),s?.focus()})}N().catch(r=>{console.error("ERROR READING STORAGE:",r),f("Unable to read saved content.","error")});
