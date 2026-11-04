export interface Web3FormOptions {
  /** id of the <form>. Its `action` is the endpoint, so the URL lives in one place. */
  formId: string;
  /** id of the status element (gets data-status, styled in hub.css). */
  resultId: string;
  pendingMessage: string;
  successMessage: string;
  errorMessage: string;
  /** Clear a success message after this many ms. Errors stay until the next submit. */
  clearSuccessAfterMs?: number;
}

/**
 * Validates, posts the form as JSON to web3forms and reports through
 * data-status="pending|success|error". Colours are styled in CSS, never here.
 */
export function setupWeb3Form(opts: Web3FormOptions) {
  const form = document.getElementById(opts.formId) as HTMLFormElement | null;
  const result = document.getElementById(opts.resultId);
  if (!form || !result) return;

  // Native validation stays on without JS; with JS we run it ourselves.
  form.noValidate = true;
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  let clearTimer: number | undefined;

  const show = (status: "pending" | "success" | "error", message: string) => {
    window.clearTimeout(clearTimer);
    result.dataset.status = status;
    result.textContent = message;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.querySelector<HTMLElement>(":invalid")?.focus();
      return;
    }

    show("pending", opts.pendingMessage);
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!response.ok) throw new Error(`web3forms returned ${response.status}`);
      show("success", opts.successMessage);
      form.reset();
      form.classList.remove("was-validated");
      if (opts.clearSuccessAfterMs) {
        clearTimer = window.setTimeout(() => {
          result.textContent = "";
          delete result.dataset.status;
        }, opts.clearSuccessAfterMs);
      }
    } catch (error) {
      console.error(error);
      show("error", opts.errorMessage);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
