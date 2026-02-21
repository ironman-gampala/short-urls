(function () {
  const form = document.getElementById("shorten-form");
  const urlInput = document.getElementById("url-input");
  const submitBtn = document.getElementById("submit-btn");
  const messageEl = document.getElementById("message");
  const resultEl = document.getElementById("result");
  const shortLinkEl = document.getElementById("short-link");

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.className = "message " + (isError ? "error" : "info");
    messageEl.hidden = false;
  }

  function showResult(shortUrl) {
    resultEl.hidden = false;
    shortLinkEl.href = shortUrl;
    shortLinkEl.textContent = shortUrl;
  }

  function clearResult() {
    resultEl.hidden = true;
    shortLinkEl.href = "";
    shortLinkEl.textContent = "";
  }

  const codeInput = document.getElementById("code-input");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearResult();
    const url = urlInput.value.trim();
    if (!url) {
      showMessage("Please enter a URL.", true);
      return;
    }

    const code = codeInput.value.trim();
    const body = code ? { url, code } : { url };

    submitBtn.disabled = true;
    showMessage("Shortening…", false);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMessage(data.error || "Something went wrong.", true);
        return;
      }

      showMessage("Short link created.");
      showResult(data.shortUrl);
    } catch (err) {
      showMessage("Network error. Please try again.", true);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
