import { PlataformaCursos } from "./platform.js";
import { loadPlatformState, savePlatformState } from "./storage.js";
import {
  escapeHtml,
  formatDate,
  formatMoney,
  getToday,
  readFormData,
  setSelectOptions,
  showAlert,
} from "./ui-utils.js";

const plataforma = new PlataformaCursos();
loadPlatformState(plataforma);

let lastCheckoutData = null;

const ui = {
  alertContainer: document.getElementById("alertContainer"),
  statPlanos: document.getElementById("statPlanos"),
  statAssinaturas: document.getElementById("statAssinaturas"),
  statPagamentos: document.getElementById("statPagamentos"),
  statReceita: document.getElementById("statReceita"),
  planForm: document.getElementById("planForm"),
  checkoutForm: document.getElementById("checkoutForm"),
  checkoutUser: document.getElementById("checkoutUser"),
  checkoutPlan: document.getElementById("checkoutPlan"),
  checkoutStartDate: document.getElementById("checkoutStartDate"),
  plansBody: document.getElementById("plansBody"),
  subscriptionsBody: document.getElementById("subscriptionsBody"),
  paymentsBody: document.getElementById("paymentsBody"),
  financialSummary: document.getElementById("financialSummary"),
  checkoutResult: document.getElementById("checkoutResult"),
};

function setDefaults() {
  if (!ui.checkoutStartDate.value) {
    ui.checkoutStartDate.value = getToday();
  }
}

function persistAndRender() {
  savePlatformState(plataforma);
  renderEverything();
}

function renderStats() {
  const resumo = plataforma.getResumoFinanceiro();
  ui.statPlanos.textContent = String(resumo.totalPlanos);
  ui.statAssinaturas.textContent = String(resumo.totalAssinaturas);
  ui.statPagamentos.textContent = String(resumo.totalPagamentos);
  ui.statReceita.textContent = formatMoney(resumo.receitaTotal);
}

function renderSelects() {
  const usuarios = plataforma.getUsuarios();
  const planos = plataforma.getPlanos();
  const usuarioOptions = usuarios.map((usuario) => ({
    value: usuario.idUsuario,
    label: `${usuario.idUsuario} - ${usuario.nomeCompleto}`,
  }));
  const planoOptions = planos.map((plano) => ({
    value: plano.idPlano,
    label: `${plano.idPlano} - ${plano.nome} (${formatMoney(plano.preco)})`,
  }));

  setSelectOptions(ui.checkoutUser, usuarioOptions, { placeholder: "Selecione um usuario" });
  setSelectOptions(ui.checkoutPlan, planoOptions, { placeholder: "Selecione um plano" });
}

function renderCheckoutResult() {
  if (!lastCheckoutData) {
    ui.checkoutResult.textContent = "Nenhum checkout realizado ainda.";
    return;
  }
  const assinatura = plataforma.getAssinaturaById(lastCheckoutData.idAssinatura);
  const pagamento = plataforma.getPagamentoById(lastCheckoutData.idPagamento);
  if (!assinatura || !pagamento) {
    ui.checkoutResult.textContent = "Checkout nao encontrado.";
    return;
  }
  const usuario = plataforma.getUsuarioById(assinatura.idUsuario);
  const plano = plataforma.getPlanoById(assinatura.idPlano);

  ui.checkoutResult.innerHTML = `
    <div class="text-start">
      <p class="mb-1"><strong>Assinatura #${assinatura.idAssinatura}</strong> para ${escapeHtml(usuario?.nomeCompleto ?? "-")}</p>
      <p class="mb-1">Plano: <strong>${escapeHtml(plano?.nome ?? "-")}</strong> (${formatMoney(plano?.preco ?? 0)})</p>
      <p class="mb-1">Periodo: ${formatDate(assinatura.dataInicio)} ate ${formatDate(assinatura.dataFim)}</p>
      <p class="mb-1">Pagamento #${pagamento.idPagamento} em ${formatDate(pagamento.dataPagamento)} via ${escapeHtml(
    pagamento.metodoPagamento
  )}</p>
      <p class="transaction-inline mb-0">Transacao: ${escapeHtml(pagamento.idTransacaoGateway)}</p>
    </div>
  `;
}

function renderPlansTable() {
  const planos = plataforma.getPlanos();
  if (planos.length === 0) {
    ui.plansBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Nenhum plano cadastrado.</td></tr>';
    return;
  }
  ui.plansBody.innerHTML = planos
    .map(
      (plano) => `
        <tr>
          <td>${plano.idPlano}</td>
          <td><div class="fw-semibold">${escapeHtml(plano.nome)}</div><small class="text-secondary">${escapeHtml(
            plano.descricao || "-"
          )}</small></td>
          <td><span class="money-text">${formatMoney(plano.preco)}</span></td>
          <td>${plano.duracaoMeses} meses</td>
        </tr>
      `
    )
    .join("");
}

function renderSubscriptionsTable() {
  const detalhes = plataforma.getAssinaturasDetalhadas();
  if (detalhes.length === 0) {
    ui.subscriptionsBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Nenhuma assinatura registrada.</td></tr>';
    return;
  }
  ui.subscriptionsBody.innerHTML = detalhes
    .map(
      (item) => `
        <tr>
          <td>${item.assinatura.idAssinatura}</td>
          <td>${escapeHtml(item.usuario?.nomeCompleto ?? "-")}</td>
          <td>${escapeHtml(item.plano?.nome ?? "-")}</td>
          <td>
            <small class="d-block">${formatDate(item.assinatura.dataInicio)}</small>
            <small class="text-secondary">ate ${formatDate(item.assinatura.dataFim)}</small>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderPaymentsTable() {
  const detalhes = plataforma.getPagamentosDetalhados();
  if (detalhes.length === 0) {
    ui.paymentsBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Nenhum pagamento registrado.</td></tr>';
    ui.financialSummary.textContent = "Sem movimentacoes financeiras.";
    return;
  }

  ui.paymentsBody.innerHTML = detalhes
    .map(
      (item) => `
        <tr>
          <td>${item.pagamento.idPagamento}</td>
          <td>
            <div>${escapeHtml(item.usuario?.nomeCompleto ?? "-")}</div>
            <small class="transaction-inline">${escapeHtml(item.pagamento.idTransacaoGateway)}</small>
          </td>
          <td><span class="money-text">${formatMoney(item.pagamento.valorPago)}</span></td>
          <td>
            <div>${escapeHtml(item.pagamento.metodoPagamento)}</div>
            <small class="text-secondary">${formatDate(item.pagamento.dataPagamento)}</small>
          </td>
        </tr>
      `
    )
    .join("");

  const resumo = plataforma.getResumoFinanceiro();
  ui.financialSummary.innerHTML = `
    <div class="text-start">
      <p class="mb-1"><strong>Receita total:</strong> <span class="money-text">${formatMoney(resumo.receitaTotal)}</span></p>
      <p class="mb-0 text-secondary">${resumo.totalPagamentos} pagamento(s) | ${resumo.totalAssinaturas} assinatura(s)</p>
    </div>
  `;
}

function renderEverything() {
  renderStats();
  renderSelects();
  renderCheckoutResult();
  renderPlansTable();
  renderSubscriptionsTable();
  renderPaymentsTable();
}

function bindEvents() {
  ui.planForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addPlano(readFormData(ui.planForm));
      ui.planForm.reset();
      persistAndRender();
      showAlert(ui.alertContainer, "Plano cadastrado com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const { assinatura, pagamento } = plataforma.simularCheckout(readFormData(ui.checkoutForm));
      lastCheckoutData = {
        idAssinatura: assinatura.idAssinatura,
        idPagamento: pagamento.idPagamento,
      };
      ui.checkoutForm.reset();
      setDefaults();
      persistAndRender();
      showAlert(ui.alertContainer, `Checkout concluido. Transacao ${pagamento.idTransacaoGateway}`);
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  window.addEventListener("storage", () => {
    loadPlatformState(plataforma);
    renderEverything();
  });
}

function init() {
  setDefaults();
  bindEvents();
  renderEverything();
}

init();
