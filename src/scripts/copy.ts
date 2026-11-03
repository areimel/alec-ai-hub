const RESET_MS = 2000;

/**
 * Copies text and confirms on the button. Sets data-copied (styled in hub.css)
 * only when the clipboard write really succeeded.
 */
export async function copyWithConfirm(
  button: HTMLElement,
  text: string,
  confirmation = "Copied",
) {
  const label = button.dataset.label ?? button.textContent?.trim() ?? "";
  button.dataset.label = label;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = confirmation;
    button.dataset.copied = "true";
  } catch {
    button.textContent = "Copy failed";
    delete button.dataset.copied;
  }
  window.setTimeout(() => {
    button.textContent = label;
    delete button.dataset.copied;
  }, RESET_MS);
}
