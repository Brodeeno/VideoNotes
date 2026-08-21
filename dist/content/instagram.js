console.log("Instagram Video Notes - Content Script caricato");function w(e){const t=e.alt?.toLowerCase()??"";return t.includes("profile picture")||t.includes("immagine del profilo")}function v(){let e="";const t=document.querySelector("video");if(t?.poster)return e=t.poster,e;if(t){let n=t.parentElement,o=0,a=null;for(;n&&o<6&&!a;){const i=[...n.querySelectorAll("img")].find(l=>l.src&&!w(l));i&&(a=i),n=n.parentElement,o++}if(a?.src)return a.src}if(t&&t.readyState>=2&&t.videoWidth>0&&t.videoHeight>0)try{const n=document.createElement("canvas");n.width=t.videoWidth,n.height=t.videoHeight;const o=n.getContext("2d");if(o)return o.drawImage(t,0,0),e=n.toDataURL("image/jpeg",.85),e}catch(n){console.log("Frame capture failed:",n)}const r=document.querySelector('meta[property="og:image"]')?.getAttribute("content")?.trim();return r||""}function f(){const e=window.location.href,t=e.match(/instagram\.com\/(?:reels|p)\/([^/?#]+)/i);if(!t)return null;const r=t[1],n=document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim(),o=n||document.title||"Instagram Reel",a=v();let s="";const i=document.querySelector('a[href^="/"][role="link"]');if(i){const c=i.textContent?.trim();c&&!c.includes(" ")&&(s=c)}if(!s&&n){const c=n.indexOf("•");c>0&&(s=n.substring(0,c).trim())}let l=null;const d=document.querySelector("video");return d&&Number.isFinite(d.duration)&&d.duration>0&&(l=d.duration),{instagramId:r,title:o,channelName:s,url:e,duration:l,thumbnailUrl:a}}function b(e){document.querySelector(".instagram-notes-overlay")?.remove();const t=document.createElement("div");t.className="instagram-notes-overlay",Object.assign(t.style,{position:"fixed",inset:"0",zIndex:"2147483646",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.62)",backdropFilter:"blur(5px)"});const r=document.createElement("div");r.className="instagram-notes-dialog",Object.assign(r.style,{width:"min(440px, calc(100vw - 32px))",boxSizing:"border-box",padding:"18px",borderRadius:"14px",background:"#181818",border:"1px solid #303030",color:"#fff",fontFamily:"Arial, Helvetica, sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,.55)"}),r.innerHTML=`
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
                    ${k(e.channelName)}
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
    `,t.appendChild(r),document.body.appendChild(t);const n=r.querySelector(".instagram-notes-textarea"),o=()=>{t.remove()};r.querySelector(".instagram-notes-close")?.addEventListener("click",o),r.querySelector(".instagram-notes-cancel")?.addEventListener("click",o),t.addEventListener("click",a=>{a.target===t&&o()}),r.querySelector(".instagram-notes-save")?.addEventListener("click",async()=>{const a=n.value.trim();if(!a){n.focus();return}const s=r.querySelector(".instagram-notes-save");s.disabled=!0,s.textContent="Saving...";try{const i=v();console.log(i);const l=await chrome.runtime.sendMessage({type:"SAVE_CONTENT",content:{platform:"instagram",externalId:e.instagramId,title:e.title,channelName:e.channelName,url:e.url,duration:e.duration,thumbnailUrl:i||e.thumbnailUrl},note:{text:a,timestamp:null}});if(!l?.success)throw new Error(l?.error??"Error saving note.");o(),y("Note saved successfully.")}catch(i){console.error("Error saving Instagram:",i),y(i instanceof Error&&i.message.includes("Extension context invalidated")?"Extension updated. Refresh the page.":"Error saving note.","error"),s.disabled=!1,s.textContent="Save note"}}),n.focus()}function k(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function h(){const e=document.createElement("button");return e.className="instagram-video-notes-button",e.type="button",e.setAttribute("aria-label","Aggiungi nota"),e.innerHTML=`
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
    `,Object.assign(e.style,{display:"flex",alignItems:"center",justifyContent:"center",width:"40px",height:"40px",minWidth:"40px",minHeight:"40px",marginBottom:"8px",padding:"0",boxSizing:"border-box",border:"1.5px solid rgba(193, 53, 132, .9)",borderRadius:"50%",background:"rgba(20, 20, 20, .72)",color:"#d946ef",cursor:"pointer",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",boxShadow:"0 2px 10px rgba(0,0,0,.35), 0 0 8px rgba(193,53,132,.22)",transition:"transform .15s ease, background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease"}),e.addEventListener("mouseenter",()=>{e.style.background="rgba(193, 53, 132, .18)",e.style.borderColor="#d946ef",e.style.color="#e879f9",e.style.boxShadow="0 2px 12px rgba(0,0,0,.4), 0 0 12px rgba(193,53,132,.45)",e.style.transform="scale(1.08)"}),e.addEventListener("mouseleave",()=>{e.style.background="rgba(20, 20, 20, .72)",e.style.borderColor="rgba(193, 53, 132, .9)",e.style.color="#d946ef",e.style.boxShadow="0 2px 10px rgba(0,0,0,.35), 0 0 8px rgba(193,53,132,.22)",e.style.transform="scale(1)"}),e.addEventListener("mousedown",()=>{e.style.transform="scale(.92)"}),e.addEventListener("mouseup",()=>{e.style.transform="scale(1.08)"}),e}function E(e,t){let r=e;for(;r&&r.parentElement;){const n=r.nextElementSibling;if(n&&t.some(a=>n.querySelector(`svg[aria-label="${a}"]`)))return r;r=r.parentElement}return null}function S(){if(!f()||document.querySelector(".instagram-video-notes-button"))return;const t=window.location.href,r=/instagram\.com\/p\//i.test(t),n=/instagram\.com\/reels\//i.test(t);if(r){const o=Array.from(document.querySelectorAll("svg[aria-label]")).find(d=>{const c=d.getAttribute("aria-label")?.toLowerCase()??"";return c.includes("share")||c.includes("condividi")});if(console.log(o),!o)return;const a=o.closest("button");if(!a)return;const s=a.closest("span");if(!s)return;const i=h();i.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation();const c=f();c&&b(c)});const l=document.createElement("span");l.className="instagram-video-notes-wrapper",l.appendChild(i),s.insertAdjacentElement("afterend",l);return}if(n){const o=document.querySelector('svg[aria-label="Mi piace"], svg[aria-label="Non mi piace più"], svg[aria-label="Like"], svg[aria-label="Unlike"]'),a=o?E(o,["Commenta","Comment"]):null,s=h();if(s.addEventListener("click",m=>{m.preventDefault(),m.stopPropagation();const u=f();u&&b(u)}),a){const m=a,u=window.getComputedStyle(m).position;(u==="static"||!u)&&(m.style.position="relative"),Object.assign(s.style,{position:"absolute",bottom:"100%",left:"0",right:"0",margin:"0 auto 8px auto",zIndex:"10"}),m.appendChild(s);return}const i=["article","main","[role='main']"];let l=null;for(const m of i){const u=document.querySelector(m);if(u){l=u;break}}if(!l)return;const d=["section","[role='button']"];let c=null;for(const m of d){const u=l.querySelectorAll(m);if(u.length>0){c=u[u.length-1];break}}c?c.appendChild(s):l.appendChild(s)}}let x=window.location.href;function g(){const e=window.location.href;e!==x&&(x=e,document.querySelector(".instagram-video-notes-button")?.remove()),e.match(/instagram\.com\/(?:reels|p)\//i)&&S()}let p=null;const C=new MutationObserver(()=>{p!==null&&window.clearTimeout(p),p=window.setTimeout(()=>{p=null,g()},150)});C.observe(document.documentElement,{childList:!0,subtree:!0});const I=history.pushState;history.pushState=function(...e){const t=I.apply(this,e);return window.dispatchEvent(new Event("instagram-location-change")),t};const N=history.replaceState;history.replaceState=function(...e){const t=N.apply(this,e);return window.dispatchEvent(new Event("instagram-location-change")),t};window.addEventListener("popstate",g);window.addEventListener("instagram-location-change",()=>{window.setTimeout(g,300)});console.log("VideoNotes initialized");window.setTimeout(g,1e3);function L(){if(document.getElementById("instagram-notes-toast-styles"))return;const e=document.createElement("style");e.id="instagram-notes-toast-styles",e.textContent=`
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
  `,document.head.appendChild(e)}function y(e,t="success",r=3e3){L();let n=document.querySelector(".instagram-notes-toast-container");n||(n=document.createElement("div"),n.className="instagram-notes-toast-container",document.body.appendChild(n));const o=document.createElement("div");o.className=`instagram-notes-toast ${t}`;const a=document.createElement("div");a.className="instagram-notes-toast-icon",a.textContent=t==="success"?"✓":"!";const s=document.createElement("div");s.className="instagram-notes-toast-message",s.textContent=e;const i=document.createElement("button");i.className="instagram-notes-toast-close",i.type="button",i.textContent="×",o.appendChild(a),o.appendChild(s),o.appendChild(i),n.appendChild(o);let l=!1;const d=()=>{l||(l=!0,o.classList.add("hide"),setTimeout(()=>{o.remove(),n&&n.children.length===0&&n.remove()},250))};i.addEventListener("click",d),setTimeout(d,r)}
