export function getToday() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(valor) {
  const texto = String(valor ?? "");
  const partes = texto.split("-");
  if (partes.length !== 3) {
    return texto || "-";
  }
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatMoney(valor) {
  const numero = Number(valor ?? 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function showAlert(container, message, type = "success") {
  if (!container) {
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = `alert alert-${type} alert-dismissible fade show`;
  wrapper.role = "alert";
  wrapper.innerHTML = `${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>`;
  container.append(wrapper);

  setTimeout(() => {
    wrapper.remove();
  }, 4500);
}

export function setSelectOptions(selectElement, options, config = {}) {
  const { placeholder = "Selecione", keepValue = selectElement.value, optional = false } = config;
  const currentValue = String(keepValue ?? "");
  selectElement.innerHTML = "";

  if (placeholder !== null) {
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    if (!optional) {
      placeholderOption.disabled = true;
    }
    selectElement.append(placeholderOption);
  }

  for (const option of options) {
    const element = document.createElement("option");
    element.value = String(option.value);
    element.textContent = option.label;
    selectElement.append(element);
  }

  const hasValue = options.some((option) => String(option.value) === currentValue);
  selectElement.value = hasValue ? currentValue : "";
  selectElement.disabled = options.length === 0;
}

export function readFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}
