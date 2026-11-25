// Links that aren't ready yet stay "#" until these are filled in.
const SITE = {
  // Notarized .dmg on GitHub Releases. Tag-specific: releases/latest skips prereleases, so update
  // the tag here with each new release.
  downloadURL: "https://github.com/NeoLinearPad/NeoLinearPad/releases/download/v1.0/Neo-LinearPad.dmg",
  // Checkout link of the product. Polar: a Checkout Link (https://buy.polar.sh/polar_cl_…), whose
  // Success URL is https://neolinearpad.com/thanks.html?checkout_id={CHECKOUT_ID}.
  checkoutURL: "https://buy.polar.sh/polar_cl_mDtcVjB6m9XSSQkve1hj6mQmcCN8rubk8ueK73zvhvY",
  // Polar only: the Worker (tools/key-worker) that turns the checkout id into the license key.
  keyEndpoint: "https://key.neolinearpad.com/key",
};

// Opens a dialog with the dialog itself focused, not its first button (the browser's default
// would draw a focus ring on the close button). Tab still reaches the buttons.
function openDialog(dialog) {
  dialog.showModal();
  dialog.focus();
}

// Buttons with data-open="<dialog id>" open that dialog; [data-close], Esc,
// or a click outside the dialog close it.
document.querySelectorAll("[data-open]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.open);
  if (!dialog) return;
  button.addEventListener("click", () => openDialog(dialog));
});

// index.html#get (the app's purchase links) opens with the trial / buy choice showing.
if (location.hash === "#get") {
  const dialog = document.getElementById("get-dialog");
  if (dialog) openDialog(dialog);
  // Once closed, drop #get so a reload shows the plain page.
  dialog?.addEventListener("close", () => history.replaceState(null, "", location.pathname), { once: true });
}

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();  // the backdrop counts as the dialog itself
  });
});

// Links with data-open-guide="<details id>" open that guide (expanded) and scroll to it.
// Opening the page with that id in the address (#install-guide) does the same.
function openGuide(id, smooth) {
  const guide = document.getElementById(id);
  if (!(guide instanceof HTMLDetailsElement)) return false;
  guide.open = true;
  guide.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  return true;
}
document.querySelectorAll("[data-open-guide]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (openGuide(link.dataset.openGuide, true)) {
      event.preventDefault();
      history.replaceState(null, "", "#" + link.dataset.openGuide);
    }
  });
});
if (location.hash.length > 1) openGuide(location.hash.slice(1), false);

// "Close the guide" buttons: close the guide they sit in and bring its heading back into view.
// Their dashed pill outline is an SVG sized to the button (CSS "dashed" can't set dash length).
document.querySelectorAll("[data-close-guide]").forEach((button) => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  const rect = document.createElementNS(ns, "rect");
  svg.append(rect);
  button.prepend(svg);
  const fit = () => {
    const w = button.offsetWidth, h = button.offsetHeight;  // border box
    if (!w || !h) return;
    for (const [k, v] of Object.entries({ x: 0.75, y: 0.75, width: w - 1.5, height: h - 1.5, rx: (h - 1.5) / 2 })) {
      rect.setAttribute(k, v);
    }
  };
  new ResizeObserver(fit).observe(button);
  fit();

  button.addEventListener("click", () => {
    const guide = button.closest("details");
    if (!guide) return;
    guide.open = false;
    // Bring the heading to about 40% down the screen (not the very top), so it's easy to spot
    // and what comes after it is right there to read.
    const top = guide.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    if (location.hash === "#" + guide.id) history.replaceState(null, "", location.pathname);
  });
});

// Download links.
if (SITE.downloadURL) {
  document.querySelectorAll("[data-download]").forEach((link) => { link.href = SITE.downloadURL; });
}

// Buy links. Polar: the checkout opens in this tab and comes back to thanks.html.
// Lemon Squeezy (old): its checkout opens on top of the page (lemon.js overlay).
if (SITE.checkoutURL) {
  const isLemon = new URL(SITE.checkoutURL).hostname.endsWith("lemonsqueezy.com");
  document.querySelectorAll("[data-checkout]").forEach((link) => {
    const url = new URL(SITE.checkoutURL);
    if (isLemon) {
      url.searchParams.set("embed", "1");
      link.classList.add("lemonsqueezy-button");
    }
    // Polar shows its checkout in the visitor's browser language (14 languages, English otherwise;
    // Settings → Preview Features → Localized Checkout must be on). No ?locale= on purpose: the
    // browser language is used even on our English page. Browser translation can't translate it.
    link.href = url.toString();
    link.addEventListener("click", () => document.querySelector("dialog[open]")?.close());
  });
  if (isLemon) {
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    document.head.append(script);
  }
}

const isEnglish = document.documentElement.lang === "en";

// The language switch remembers the choice, so the root page (/) sends the visitor there next time.
document.querySelectorAll("[data-lang]").forEach((link) => {
  link.addEventListener("click", () => {
    try { localStorage.setItem("lang", link.dataset.lang); } catch {}
  });
});

// "Copy" buttons: data-copy="<element id>" copies that element's text.
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy)?.textContent.trim() ?? "";
    try {
      await navigator.clipboard.writeText(text);
      const label = button.textContent;
      button.textContent = isEnglish ? "Copied" : "コピーしました";
      setTimeout(() => { button.textContent = label; }, 1600);
    } catch {
      // Clipboard blocked: leave the text for the visitor to select by hand.
    }
  });
});

// After-purchase page: Lemon Squeezy sends buyers to thanks.html?key=<license key>
// (its link field doesn't accept "#"; "#key=" also works). A key in "?" is removed from the
// address bar right away, so it isn't left in bookmarks or picked up by analytics later.
const setup = document.getElementById("setup");
if (setup) {
  // The key arrives as ?key= (old Lemon Squeezy links, our own links) or #key= (language switch),
  // or, with Polar, as ?checkout_id= that the Worker turns into the key. Both are removed from the
  // address bar right away so they don't stay in bookmarks or history.
  const query = new URLSearchParams(location.search);
  const fromLink = query.get("key") ?? new URLSearchParams(location.hash.slice(1)).get("key");
  const checkoutFromLink = query.get("checkout_id");
  if (query.has("key") || query.has("checkout_id")) history.replaceState(null, "", location.pathname);

  // Kept in this tab only (sessionStorage), so a reload or the language switch still has them.
  // Closing the tab forgets them.
  const remember = (name, value) => { try { sessionStorage.setItem(name, value); } catch {} };
  const recall = (name) => { try { return sessionStorage.getItem(name) ?? ""; } catch { return ""; } };
  if (fromLink) remember("licenseKey", fromLink);
  if (checkoutFromLink) remember("checkoutID", checkoutFromLink);
  const key = fromLink ?? recall("licenseKey");
  const checkoutID = checkoutFromLink ?? recall("checkoutID");

  const looksLikeKey = (value) => /^[A-Za-z0-9_-]{8,100}$/.test(value);
  const showKey = (value) => {
    setup.dataset.hasKey = "yes";
    document.getElementById("license-key").textContent = value;
    document.getElementById("activate").href = `neolinearpad://activate?key=${encodeURIComponent(value)}`;
    // Switching language keeps the key (in "#", so it stays out of server logs).
    const langLink = document.querySelector(".lang-switch");
    if (langLink) langLink.href = langLink.href.split("#")[0] + `#key=${encodeURIComponent(value)}`;
  };

  if (looksLikeKey(key)) {
    showKey(key);
  } else {
    // Polar: ask the Worker for the key. Right after payment it may take a few seconds to exist,
    // so the page says it's getting the key instead of pointing to the email straight away.
    setup.dataset.hasKey = checkoutID && SITE.keyEndpoint ? "loading" : "no";
    if (checkoutID && SITE.keyEndpoint) {
      const giveUp = () => { setup.dataset.hasKey = "no"; };
      const fetchKey = async (triesLeft) => {
        try {
          const response = await fetch(`${SITE.keyEndpoint}?checkout_id=${encodeURIComponent(checkoutID)}`);
          if (response.status === 200) {
            const { key: fetched } = await response.json();
            if (looksLikeKey(fetched)) {
              remember("licenseKey", fetched);
              showKey(fetched);
            }
            return;
          }
          if (response.status === 404) return giveUp();  // unknown or old: the email has the key
        } catch {
          // network trouble: try again
        }
        if (triesLeft > 0) setTimeout(() => fetchKey(triesLeft - 1), 2000);
        else giveUp();
      };
      fetchKey(20);
    }
  }
  // Start the download once the page has finished loading (the steps below explain what to do
  // with it). Starting it earlier makes Safari stop loading the rest of the page, leaving the
  // icon broken.
  let downloaded = false;
  try { downloaded = sessionStorage.getItem("downloadStarted") === "yes"; } catch {}
  if (SITE.downloadURL && !downloaded) {
    const start = () => {
      try { sessionStorage.setItem("downloadStarted", "yes"); } catch {}
      location.assign(SITE.downloadURL);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  }
}
