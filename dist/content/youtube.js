console.log("VideoNotes - Content Script loaded");let v=!1,y=null,c=null;function C(t){if(!Number.isFinite(t)||t<0)return"00:00";const n=Math.floor(t/3600),e=Math.floor(t%3600/60),o=Math.floor(t%60);return n>0?`${n}:${e.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}`:`${e.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}`}function p(){return new URL(window.location.href).searchParams.get("v")??null}function N(){return document.querySelector("video.html5-main-video")}function S(){const t=p(),n=N();if(!t||!n)return null;const e=document.querySelector("yt-formatted-string.ytd-watch-metadata"),o=document.querySelector("ytd-channel-name a"),r=e?.textContent?.trim()??document.title.replace(" - YouTube","").trim(),a=o?.textContent?.trim()??"YouTube",l=Number.isFinite(n.duration)?n.duration:0,i=Number.isFinite(n.currentTime)?n.currentTime:0,s=`https://www.youtube.com/watch?v=${t}`,m=`https://i.ytimg.com/vi/${t}/hqdefault.jpg`;return{youtubeId:t,title:r,channelName:a,url:s,duration:l,currentTime:i,thumbnailUrl:m}}function f(t,n="success",e=3e3){let o=document.querySelector(".youtube-notes-toast-container");o||(o=document.createElement("div"),o.className="youtube-notes-toast-container",document.body.appendChild(o));const r=document.createElement("div");r.className=`youtube-notes-toast ${n}`;const a=document.createElement("div");a.className="youtube-notes-toast-icon",a.textContent=n==="success"?"✓":"!";const l=document.createElement("div");l.className="youtube-notes-toast-message",l.textContent=t;const i=document.createElement("button");i.className="youtube-notes-toast-close",i.type="button",i.textContent="×",r.appendChild(a),r.appendChild(l),r.appendChild(i),o.appendChild(r);let s=!1;const m=()=>{s||(s=!0,r.classList.add("hide"),setTimeout(()=>{r.remove(),o&&o.children.length===0&&o.remove()},250))};i.addEventListener("click",m),setTimeout(m,e)}function T(t){const n=document.querySelector(".youtube-notes-dialog-backdrop");n&&n.remove();const e=document.createElement("div");e.className="youtube-notes-dialog-backdrop",e.innerHTML=`
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
                ${C(t.currentTime)}
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
    `,document.body.appendChild(e);const o=e.querySelector(".youtube-notes-dialog"),r=e.querySelector("textarea"),a=e.querySelector(".youtube-notes-dialog-save"),l=e.querySelector(".youtube-notes-dialog-cancel"),i=e.querySelector(".youtube-notes-dialog-close");if(!o||!r||!a||!l||!i){console.error("Unable to initialize notes dialog."),e.remove();return}function s(){e.remove(),document.removeEventListener("keydown",m)}function m(u){if(u.key==="Escape"){u.preventDefault(),s();return}u.ctrlKey&&u.key==="Enter"&&(u.preventDefault(),a?.click())}i.addEventListener("click",s),l.addEventListener("click",s),e.addEventListener("click",u=>{u.target===e&&s()}),document.addEventListener("keydown",m),a.addEventListener("click",async()=>{const u=r.value.trim();if(!u){r.focus(),f("Insert a note.","error");return}if(a.disabled)return;a.disabled=!0,a.textContent="Saving...";const d=S();if(!d){f("Unable to retrieve video data.","error",5e3),a.disabled=!1,a.textContent="Save";return}try{const b=await chrome.runtime.sendMessage({type:"SAVE_CONTENT",content:{platform:"youtube",externalId:d.youtubeId,title:d.title,channelName:d.channelName,url:d.url,duration:d.duration,thumbnailUrl:d.thumbnailUrl},note:{text:u,timestamp:d.currentTime}});if(!b?.success)throw new Error(b?.error??"Error during save.");s(),f("Note saved successfully","success")}catch(b){console.error("Save error:",b);const h=b instanceof Error?b.message:String(b);if(h.includes("Extension context invalidated")){f("Extension was updated. Refresh the YouTube page and retry.","error",5e3);return}f(`Error: ${h}`,"error",5e3),a.disabled=!1,a.textContent="Save"}}),requestAnimationFrame(()=>{r.focus()})}function g(){if(c&&document.body.contains(c))return;const t=document.querySelector("h1.ytd-watch-metadata");if(!t)return;const n=t.querySelector(".youtube-notes-add-button");if(n){c=n;return}const e=document.createElement("button");e.type="button",e.className="youtube-notes-add-button",e.innerHTML=`
        <span
            class="youtube-notes-add-button-icon"
        >
            +
        </span>

        <span>
            Add note
        </span>
    `,e.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();const r=S();if(!r){f("Unable to retrieve video data.","error");return}T(r)}),t.appendChild(e),c=e}function w(){const t=p();if(!t)return;if(v&&y===t){g();return}v=!0,y=t,c=null;let n=0;const e=30,o=window.setInterval(()=>{n++,g(),(c||n>=e)&&clearInterval(o)},500)}function x(){p()!==y&&(v=!1,y=null,c&&(c.remove(),c=null),w())}window.addEventListener("yt-navigate-finish",()=>{setTimeout(x,300)});let E="";setInterval(()=>{const t=window.location.href;t!==E&&(E=t,setTimeout(x,300))},500);w();
