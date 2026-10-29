// Links that aren't ready yet stay "#" until these are filled in.
const SITE = {
  // Latest notarized .dmg on GitHub Releases (fixed file name, so it always points to the newest).
  downloadURL: "",
  // Lemon Squeezy checkout link for the product ("Share" link in the dashboard). Test-mode links
  // work the same way.
  checkoutURL: "",
};

// Buttons with data-open="<dialog id>" open that dialog; [data-close], Esc,
// or a click outside the dialog close it.
document.querySelectorAll("[data-open]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.open);
  if (!dialog) return;
  button.addEventListener("click", () => dialog.showModal());
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();  // the backdrop counts as the dialog itself
  });
});

// Download links.
if (SITE.downloadURL) {
  document.querySelectorAll("[data-download]").forEach((link) => { link.href = SITE.downloadURL; });
}

// Buy links open Lemon Squeezy's checkout on top of the page (lemon.js overlay).
if (SITE.checkoutURL) {
  document.querySelectorAll("[data-checkout]").forEach((link) => {
    const url = new URL(SITE.checkoutURL);
    url.searchParams.set("embed", "1");
    link.href = url.toString();
    link.classList.add("lemonsqueezy-button");
    link.addEventListener("click", () => document.querySelector("dialog[open]")?.close());
  });
  const script = document.createElement("script");
  script.src = "https://app.lemonsqueezy.com/js/lemon.js";
  script.defer = true;
  document.head.append(script);
}

// "Copy" buttons: data-copy="<element id>" copies that element's text.
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy)?.textContent.trim() ?? "";
    try {
      await navigator.clipboard.writeText(text);
      const label = button.textContent;
      button.textContent = "コピーしました";
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
  const fromQuery = new URLSearchParams(location.search).get("key");
  const key = fromQuery ?? new URLSearchParams(location.hash.slice(1)).get("key") ?? "";
  if (fromQuery) history.replaceState(null, "", location.pathname);
  const looksLikeKey = /^[A-Za-z0-9-]{8,64}$/.test(key);
  setup.dataset.hasKey = looksLikeKey ? "yes" : "no";
  if (looksLikeKey) {
    document.getElementById("license-key").textContent = key;
    document.getElementById("activate").href = `neolinearpad://activate?key=${encodeURIComponent(key)}`;
  }
  // Start the download right away (the steps below explain what to do with it).
  if (SITE.downloadURL) location.assign(SITE.downloadURL);
}
