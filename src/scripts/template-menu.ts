// Builds the fill-in form for template entries and keeps #promptContent in sync.
const form = document.getElementById("templateForm");
const resetBtn = document.getElementById("resetTemplateBtn");
const promptEl = document.getElementById("promptContent");
const original = promptEl?.textContent ?? "";
const values = new Map<string, string>();

function extractVariables(text: string): string[] {
  const names = new Set<string>();
  for (const m of text.matchAll(/@(\w+)/g)) names.add(m[1]);
  return [...names];
}

function render() {
  if (!promptEl) return;
  let text = original;
  values.forEach((value, name) => {
    if (value) text = text.replace(new RegExp(`@${name}\\b`, "g"), () => value);
  });
  promptEl.textContent = text;
}

function buildField(name: string) {
  values.set(name, "");
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.htmlFor = `var-${name}`;
  label.className = "dossier__label";
  label.textContent = `@${name}`;

  const input = document.createElement("input");
  input.type = "text";
  input.id = `var-${name}`;
  input.name = name;
  input.autocomplete = "off";
  input.placeholder = `Value for @${name}`;
  input.setAttribute("data-slot", "input");
  input.className = "dossier__input";
  input.addEventListener("input", () => {
    values.set(name, input.value);
    render();
  });

  group.append(label, input);
  return group;
}

function init() {
  if (!form || !original) return;
  const names = extractVariables(original);
  if (names.length === 0) {
    const p = document.createElement("p");
    p.className = "dossier__note";
    p.textContent = "No template variables found in this prompt.";
    form.replaceChildren(p);
    return;
  }
  form.replaceChildren(...names.map(buildField));
}

resetBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  form?.querySelectorAll("input").forEach((i) => (i.value = ""));
  values.forEach((_, k) => values.set(k, ""));
  if (promptEl) promptEl.textContent = original;
});

init();
