import { PlataformaCursos } from "./platform.js";
import { loadPlatformState } from "./storage.js";
import { escapeHtml, formatDate, formatMoney, setSelectOptions } from "./ui-utils.js";

const plataforma = new PlataformaCursos();
loadPlatformState(plataforma);

let selectedCertificateId = null;

const ui = {
  categoryFilter: document.getElementById("categoryFilter"),
  structureCourseSelect: document.getElementById("structureCourseSelect"),
  progressUserFilter: document.getElementById("progressUserFilter"),
  categoryCoursesBody: document.getElementById("categoryCoursesBody"),
  trailOverviewBody: document.getElementById("trailOverviewBody"),
  courseStructure: document.getElementById("courseStructure"),
  usersBody: document.getElementById("usersBody"),
  enrollmentsBody: document.getElementById("enrollmentsBody"),
  progressByUserBody: document.getElementById("progressByUserBody"),
  certificatesBody: document.getElementById("certificatesBody"),
  certificatePreview: document.getElementById("certificatePreview"),
  plansBody: document.getElementById("plansBody"),
  subscriptionsBody: document.getElementById("subscriptionsBody"),
  paymentsBody: document.getElementById("paymentsBody"),
  financialSummary: document.getElementById("financialSummary"),
};

function renderSelects() {
  const categorias = plataforma.getCategorias();
  const cursos = plataforma.getCursos();
  const usuarios = plataforma.getUsuarios();

  const categoriaOptions = categorias.map((item) => ({
    value: item.idCategoria,
    label: `${item.idCategoria} - ${item.nome}`,
  }));
  const cursoOptions = cursos.map((item) => ({
    value: item.idCurso,
    label: `${item.idCurso} - ${item.titulo}`,
  }));
  const usuarioOptions = usuarios.map((item) => ({
    value: item.idUsuario,
    label: `${item.idUsuario} - ${item.nomeCompleto}`,
  }));

  setSelectOptions(ui.categoryFilter, categoriaOptions, { placeholder: "Todas as categorias", optional: true });
  setSelectOptions(ui.structureCourseSelect, cursoOptions, {
    placeholder: "Selecione um curso para ver a estrutura",
    optional: true,
  });
  setSelectOptions(ui.progressUserFilter, usuarioOptions, { placeholder: "Filtrar usuario", optional: true });
}

function renderCategoryCourses() {
  const categoriaSelecionada = ui.categoryFilter.value;
  const cursos =
    categoriaSelecionada === ""
      ? plataforma.getCursos()
      : plataforma.getCursosPorCategoria(Number(categoriaSelecionada));

  if (cursos.length === 0) {
    ui.categoryCoursesBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Nenhum curso encontrado para o filtro atual.</td></tr>';
    return;
  }

  ui.categoryCoursesBody.innerHTML = cursos
    .map((curso) => {
      const categoria = plataforma.getCategoriaById(curso.idCategoria);
      return `
        <tr>
          <td>${curso.idCurso}</td>
          <td>
            <div class="fw-semibold">${escapeHtml(curso.titulo)}</div>
            <small class="text-secondary">${escapeHtml(categoria?.nome ?? "Sem categoria")}</small>
          </td>
          <td>${escapeHtml(curso.nivel)}</td>
          <td>
            <span class="d-block">${curso.totalAulas} aulas</span>
            <small class="text-secondary">${curso.totalHoras.toFixed(1)} h</small>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderTrailOverview() {
  const resumo = plataforma.getResumoTrilhas();
  if (resumo.length === 0) {
    ui.trailOverviewBody.innerHTML =
      '<tr><td colspan="3" class="text-center text-secondary py-3">Nenhuma trilha cadastrada.</td></tr>';
    return;
  }

  ui.trailOverviewBody.innerHTML = resumo
    .map((item) => {
      const cursos =
        item.cursosVinculados.length === 0
          ? '<span class="text-secondary">Sem cursos vinculados</span>'
          : item.cursosVinculados
              .map(
                (vinculo) =>
                  `<span class="course-chip"><span class="order-badge">${vinculo.ordem}</span>${escapeHtml(
                    vinculo.curso?.titulo ?? "Curso nao encontrado"
                  )}</span>`
              )
              .join("");

      return `
        <tr>
          <td>
            <div class="fw-semibold">${escapeHtml(item.trilha.titulo)}</div>
            <small class="text-secondary">${escapeHtml(item.trilha.descricao || "-")}</small>
          </td>
          <td>${escapeHtml(item.categoria?.nome ?? "-")}</td>
          <td>${cursos}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCourseStructure() {
  const idCurso = ui.structureCourseSelect.value;
  if (!idCurso) {
    ui.courseStructure.innerHTML =
      '<p class="empty-state mb-0">Selecione um curso para ver a estrutura de modulos e aulas.</p>';
    return;
  }
  const estrutura = plataforma.getEstruturaCurso(Number(idCurso));
  if (!estrutura) {
    ui.courseStructure.innerHTML = '<p class="empty-state mb-0">Curso nao encontrado.</p>';
    return;
  }
  if (estrutura.modulos.length === 0) {
    ui.courseStructure.innerHTML = '<p class="empty-state mb-0">Este curso ainda nao possui modulos cadastrados.</p>';
    return;
  }

  ui.courseStructure.innerHTML = `
    <div class="mb-3">
      <h3 class="h6 mb-1">${escapeHtml(estrutura.curso.titulo)}</h3>
      <p class="small text-secondary mb-0">
        Publicado em ${formatDate(estrutura.curso.dataPublicacao)} | ${estrutura.curso.totalAulas} aulas | ${
    estrutura.curso.totalHoras
  } h
      </p>
    </div>
    <div class="d-grid gap-3">
      ${estrutura.modulos
        .map((modulo) => {
          const aulasHtml =
            modulo.aulas.length === 0
              ? '<li class="list-group-item text-secondary">Sem aulas neste modulo.</li>'
              : modulo.aulas
                  .map(
                    (aula) => `
                      <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <span class="badge text-bg-secondary me-2">A${aula.ordem}</span>
                          <span>${escapeHtml(aula.titulo)}</span>
                          <small class="text-secondary ms-2">(${escapeHtml(aula.tipoConteudo)})</small>
                        </div>
                        <small class="text-secondary">${aula.duracaoMinutos} min</small>
                      </li>
                    `
                  )
                  .join("");
          return `
            <article class="module-block">
              <p class="module-title mb-2">Modulo ${modulo.ordem}: ${escapeHtml(modulo.titulo)}</p>
              <ul class="list-group list-group-flush">${aulasHtml}</ul>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderUsersTable() {
  const usuarios = plataforma.getUsuarios();
  if (usuarios.length === 0) {
    ui.usersBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Nenhum usuario cadastrado.</td></tr>';
    return;
  }
  ui.usersBody.innerHTML = usuarios
    .map(
      (usuario) => `
      <tr>
        <td>${usuario.idUsuario}</td>
        <td>${escapeHtml(usuario.nomeCompleto)}</td>
        <td>${escapeHtml(usuario.email)}</td>
        <td>${formatDate(usuario.dataCadastro)}</td>
      </tr>
    `
    )
    .join("");
}

function renderEnrollmentsTable() {
  const matriculas = plataforma.getMatriculasDetalhadas();
  if (matriculas.length === 0) {
    ui.enrollmentsBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-secondary py-3">Nenhuma matricula cadastrada.</td></tr>';
    return;
  }
  ui.enrollmentsBody.innerHTML = matriculas
    .map((item) => {
      const statusClass = item.progresso.status === "Concluido" ? "ok" : "warn";
      return `
        <tr>
          <td>${item.matricula.idMatricula}</td>
          <td>${escapeHtml(item.usuario?.nomeCompleto ?? "-")}</td>
          <td>${escapeHtml(item.curso?.titulo ?? "-")}</td>
          <td>
            <span class="status-pill ${statusClass}">${item.progresso.percentual}%</span>
            <small class="d-block text-secondary">${item.progresso.aulasConcluidas}/${item.progresso.totalAulasCurso} aulas</small>
          </td>
          <td>${item.matricula.dataConclusao ? formatDate(item.matricula.dataConclusao) : "-"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderProgressByUser() {
  const idUsuario = ui.progressUserFilter.value;
  if (!idUsuario) {
    ui.progressByUserBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Selecione um usuario para visualizar o progresso.</td></tr>';
    return;
  }
  const registros = plataforma.getProgressoDetalhadoPorUsuario(Number(idUsuario));
  if (registros.length === 0) {
    ui.progressByUserBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Usuario sem progresso registrado.</td></tr>';
    return;
  }
  ui.progressByUserBody.innerHTML = registros
    .map((item) => {
      const statusClass = item.progresso.status === "Concluido" ? "ok" : "warn";
      return `
        <tr>
          <td>${escapeHtml(item.curso?.titulo ?? "-")}</td>
          <td>
            <div>M${item.modulo?.ordem ?? "-"} - ${escapeHtml(item.modulo?.titulo ?? "-")}</div>
            <small class="text-secondary">A${item.aula?.ordem ?? "-"} - ${escapeHtml(item.aula?.titulo ?? "-")}</small>
          </td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(item.progresso.status)}</span></td>
          <td>${item.progresso.dataConclusao ? formatDate(item.progresso.dataConclusao) : "-"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCertificatePreview(idCertificado) {
  if (!idCertificado) {
    ui.certificatePreview.innerHTML = "Nenhum certificado selecionado.";
    return;
  }
  const certificado = plataforma.getCertificadoById(idCertificado);
  if (!certificado) {
    ui.certificatePreview.innerHTML = "Certificado nao encontrado.";
    return;
  }
  const usuario = plataforma.getUsuarioById(certificado.idUsuario);
  const curso = plataforma.getCursoById(certificado.idCurso);
  ui.certificatePreview.innerHTML = `
    <article class="certificate-card">
      <p class="certificate-title mb-2">Certificado de Conclusao</p>
      <p class="mb-1"><strong>Aluno:</strong> ${escapeHtml(usuario?.nomeCompleto ?? "-")}</p>
      <p class="mb-1"><strong>Curso:</strong> ${escapeHtml(curso?.titulo ?? "-")}</p>
      <p class="mb-2"><strong>Emissao:</strong> ${formatDate(certificado.dataEmissao)}</p>
      <p class="small text-secondary mb-1">Codigo de verificacao</p>
      <p class="certificate-code mb-0">${escapeHtml(certificado.codigoVerificacao)}</p>
    </article>
  `;
}

function renderCertificatesTable() {
  const detalhes = plataforma.getCertificadosDetalhados();
  if (detalhes.length === 0) {
    ui.certificatesBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-secondary py-3">Nenhum certificado emitido.</td></tr>';
    selectedCertificateId = null;
    renderCertificatePreview(null);
    return;
  }
  if (!detalhes.some((item) => item.certificado.idCertificado === selectedCertificateId)) {
    selectedCertificateId = detalhes[0].certificado.idCertificado;
  }
  ui.certificatesBody.innerHTML = detalhes
    .map((item) => {
      const id = item.certificado.idCertificado;
      const activeClass = id === selectedCertificateId ? "table-active" : "";
      return `
        <tr class="${activeClass}">
          <td>${id}</td>
          <td>${escapeHtml(item.usuario?.nomeCompleto ?? "-")}</td>
          <td>${escapeHtml(item.curso?.titulo ?? "-")}</td>
          <td class="text-end">
            <button class="btn btn-outline-secondary btn-sm view-certificate-btn" data-certificate-id="${id}" type="button">
              Visualizar
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
  renderCertificatePreview(selectedCertificateId);
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
  renderSelects();
  renderCategoryCourses();
  renderTrailOverview();
  renderCourseStructure();
  renderUsersTable();
  renderEnrollmentsTable();
  renderProgressByUser();
  renderCertificatesTable();
  renderPlansTable();
  renderSubscriptionsTable();
  renderPaymentsTable();
}

function bindEvents() {
  ui.categoryFilter.addEventListener("change", renderCategoryCourses);
  ui.structureCourseSelect.addEventListener("change", renderCourseStructure);
  ui.progressUserFilter.addEventListener("change", renderProgressByUser);

  ui.certificatesBody.addEventListener("click", (event) => {
    const button = event.target.closest(".view-certificate-btn");
    if (!button) {
      return;
    }
    selectedCertificateId = Number(button.dataset.certificateId);
    renderCertificatesTable();
  });

  window.addEventListener("storage", () => {
    loadPlatformState(plataforma);
    renderEverything();
  });
}

function init() {
  bindEvents();
  renderEverything();
}

init();
