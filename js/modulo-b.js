import { PlataformaCursos } from "./platform.js";
import { loadPlatformState, savePlatformState } from "./storage.js";
import {
  escapeHtml,
  formatDate,
  getToday,
  readFormData,
  setSelectOptions,
  showAlert,
} from "./ui-utils.js";

const plataforma = new PlataformaCursos();
loadPlatformState(plataforma);

let selectedCertificateId = null;

const ui = {
  alertContainer: document.getElementById("alertContainer"),
  statUsuarios: document.getElementById("statUsuarios"),
  statMatriculas: document.getElementById("statMatriculas"),
  statProgresso: document.getElementById("statProgresso"),
  statCertificados: document.getElementById("statCertificados"),
  userForm: document.getElementById("userForm"),
  enrollmentForm: document.getElementById("enrollmentForm"),
  progressForm: document.getElementById("progressForm"),
  certificateForm: document.getElementById("certificateForm"),
  enrollmentUser: document.getElementById("enrollmentUser"),
  enrollmentCourse: document.getElementById("enrollmentCourse"),
  progressUser: document.getElementById("progressUser"),
  progressLesson: document.getElementById("progressLesson"),
  progressStatus: document.getElementById("progressStatus"),
  certificateUser: document.getElementById("certificateUser"),
  certificateCourse: document.getElementById("certificateCourse"),
  progressUserFilter: document.getElementById("progressUserFilter"),
  usersBody: document.getElementById("usersBody"),
  enrollmentsBody: document.getElementById("enrollmentsBody"),
  progressByUserBody: document.getElementById("progressByUserBody"),
  certificatesBody: document.getElementById("certificatesBody"),
  certificatePreview: document.getElementById("certificatePreview"),
  userDate: document.getElementById("userDate"),
  enrollmentDate: document.getElementById("enrollmentDate"),
  progressDate: document.getElementById("progressDate"),
};

function setDefaults() {
  const hoje = getToday();
  if (!ui.userDate.value) {
    ui.userDate.value = hoje;
  }
  if (!ui.enrollmentDate.value) {
    ui.enrollmentDate.value = hoje;
  }
  if (!ui.progressDate.value) {
    ui.progressDate.value = hoje;
  }
}

function persistAndRender() {
  savePlatformState(plataforma);
  renderEverything();
}

function getUserCourseOptions(idUsuario) {
  const usuarioId = Number(idUsuario);
  if (!usuarioId) {
    return [];
  }
  const cursos = plataforma
    .getMatriculas()
    .filter((matricula) => matricula.idUsuario === usuarioId)
    .map((matricula) => plataforma.getCursoById(matricula.idCurso))
    .filter(Boolean);

  const ids = new Set();
  return cursos
    .filter((curso) => {
      if (ids.has(curso.idCurso)) {
        return false;
      }
      ids.add(curso.idCurso);
      return true;
    })
    .map((curso) => ({
      value: curso.idCurso,
      label: `${curso.idCurso} - ${curso.titulo}`,
    }));
}

function getUserLessonOptions(idUsuario) {
  const usuarioId = Number(idUsuario);
  if (!usuarioId) {
    return [];
  }
  const aulas = plataforma.getAulasDisponiveisUsuario(usuarioId);
  return aulas.map((aula) => {
    const modulo = plataforma.getModuloById(aula.idModulo);
    const curso = modulo ? plataforma.getCursoById(modulo.idCurso) : null;
    return {
      value: aula.idAula,
      label: `${curso?.titulo ?? "Curso"} | M${modulo?.ordem ?? "?"} A${aula.ordem} - ${aula.titulo}`,
    };
  });
}

function renderStats() {
  ui.statUsuarios.textContent = String(plataforma.getUsuarios().length);
  ui.statMatriculas.textContent = String(plataforma.getMatriculas().length);
  ui.statProgresso.textContent = String(plataforma.getProgressoAulas().length);
  ui.statCertificados.textContent = String(plataforma.getCertificados().length);
}

function renderSelects() {
  const usuarios = plataforma.getUsuarios();
  const cursos = plataforma.getCursos();
  const usuarioOptions = usuarios.map((usuario) => ({
    value: usuario.idUsuario,
    label: `${usuario.idUsuario} - ${usuario.nomeCompleto}`,
  }));
  const cursoOptions = cursos.map((curso) => ({
    value: curso.idCurso,
    label: `${curso.idCurso} - ${curso.titulo}`,
  }));

  setSelectOptions(ui.enrollmentUser, usuarioOptions, { placeholder: "Selecione um usuario" });
  setSelectOptions(ui.enrollmentCourse, cursoOptions, { placeholder: "Selecione um curso" });
  setSelectOptions(ui.progressUser, usuarioOptions, { placeholder: "Selecione um usuario" });
  setSelectOptions(ui.certificateUser, usuarioOptions, { placeholder: "Selecione um usuario" });
  setSelectOptions(ui.progressUserFilter, usuarioOptions, { placeholder: "Filtrar usuario", optional: true });

  const lessonOptions = getUserLessonOptions(ui.progressUser.value);
  setSelectOptions(ui.progressLesson, lessonOptions, {
    placeholder: ui.progressUser.value
      ? lessonOptions.length > 0
        ? "Selecione uma aula"
        : "Usuario sem aulas matriculadas"
      : "Selecione um usuario",
  });

  const certificateCourseOptions = getUserCourseOptions(ui.certificateUser.value);
  setSelectOptions(ui.certificateCourse, certificateCourseOptions, {
    placeholder: ui.certificateUser.value
      ? certificateCourseOptions.length > 0
        ? "Selecione um curso"
        : "Usuario sem matriculas"
      : "Selecione um usuario",
  });
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

function renderEverything() {
  renderStats();
  renderSelects();
  renderUsersTable();
  renderEnrollmentsTable();
  renderProgressByUser();
  renderCertificatesTable();
}

function bindEvents() {
  ui.userForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addUsuario(readFormData(ui.userForm));
      ui.userForm.reset();
      setDefaults();
      persistAndRender();
      showAlert(ui.alertContainer, "Usuario cadastrado com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.enrollmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addMatricula(readFormData(ui.enrollmentForm));
      ui.enrollmentForm.reset();
      setDefaults();
      persistAndRender();
      showAlert(ui.alertContainer, "Matricula cadastrada com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.progressForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const usuarioSelecionado = ui.progressUser.value;
      plataforma.registrarProgressoAula(readFormData(ui.progressForm));
      ui.progressStatus.value = "";
      ui.progressDate.value = getToday();
      persistAndRender();
      ui.progressUser.value = usuarioSelecionado;
      renderSelects();
      showAlert(ui.alertContainer, "Progresso registrado com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.certificateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const certificado = plataforma.gerarCertificado(readFormData(ui.certificateForm));
      selectedCertificateId = certificado.idCertificado;
      persistAndRender();
      showAlert(ui.alertContainer, `Certificado emitido com sucesso. Codigo: ${certificado.codigoVerificacao}`);
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.progressUser.addEventListener("change", renderSelects);
  ui.certificateUser.addEventListener("change", renderSelects);
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
  setDefaults();
  bindEvents();
  renderEverything();
}

init();
