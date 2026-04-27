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

const ui = {
  alertContainer: document.getElementById("alertContainer"),
  statCategorias: document.getElementById("statCategorias"),
  statCursos: document.getElementById("statCursos"),
  statTrilhas: document.getElementById("statTrilhas"),
  statAulas: document.getElementById("statAulas"),
  categoryForm: document.getElementById("categoryForm"),
  courseForm: document.getElementById("courseForm"),
  trailForm: document.getElementById("trailForm"),
  trailCourseForm: document.getElementById("trailCourseForm"),
  moduleForm: document.getElementById("moduleForm"),
  lessonForm: document.getElementById("lessonForm"),
  courseCategory: document.getElementById("courseCategory"),
  trailCategory: document.getElementById("trailCategory"),
  trailCourseTrail: document.getElementById("trailCourseTrail"),
  trailCourseCourse: document.getElementById("trailCourseCourse"),
  moduleCourse: document.getElementById("moduleCourse"),
  lessonModule: document.getElementById("lessonModule"),
  categoryFilter: document.getElementById("categoryFilter"),
  structureCourseSelect: document.getElementById("structureCourseSelect"),
  categoryCoursesBody: document.getElementById("categoryCoursesBody"),
  trailOverviewBody: document.getElementById("trailOverviewBody"),
  courseStructure: document.getElementById("courseStructure"),
  courseDetailBody: document.getElementById("courseDetailBody"),
  coursePublishDate: document.getElementById("coursePublishDate"),
};

const detailModal = new bootstrap.Modal(document.getElementById("courseDetailModal"));

function setDefaults() {
  if (!ui.coursePublishDate.value) {
    ui.coursePublishDate.value = getToday();
  }
}

function persistAndRender() {
  savePlatformState(plataforma);
  renderEverything();
}

function renderStats() {
  ui.statCategorias.textContent = String(plataforma.getCategorias().length);
  ui.statCursos.textContent = String(plataforma.getCursos().length);
  ui.statTrilhas.textContent = String(plataforma.getTrilhas().length);
  ui.statAulas.textContent = String(plataforma.getAulas().length);
}

function renderSelects() {
  const categorias = plataforma.getCategorias();
  const cursos = plataforma.getCursos();
  const trilhas = plataforma.getTrilhas();
  const modulos = plataforma.getModulos();

  const categoriaOptions = categorias.map((item) => ({
    value: item.idCategoria,
    label: `${item.idCategoria} - ${item.nome}`,
  }));
  const cursoOptions = cursos.map((item) => ({
    value: item.idCurso,
    label: `${item.idCurso} - ${item.titulo}`,
  }));
  const trilhaOptions = trilhas.map((item) => ({
    value: item.idTrilha,
    label: `${item.idTrilha} - ${item.titulo}`,
  }));
  const moduloOptions = modulos.map((modulo) => {
    const curso = plataforma.getCursoById(modulo.idCurso);
    return {
      value: modulo.idModulo,
      label: `${curso?.titulo ?? "Curso"} | M${modulo.ordem} - ${modulo.titulo}`,
    };
  });

  setSelectOptions(ui.courseCategory, categoriaOptions, { placeholder: "Selecione uma categoria" });
  setSelectOptions(ui.trailCategory, categoriaOptions, { placeholder: "Selecione uma categoria" });
  setSelectOptions(ui.moduleCourse, cursoOptions, { placeholder: "Selecione um curso" });
  setSelectOptions(ui.lessonModule, moduloOptions, { placeholder: "Selecione um modulo" });
  setSelectOptions(ui.trailCourseCourse, cursoOptions, { placeholder: "Selecione um curso" });
  setSelectOptions(ui.trailCourseTrail, trilhaOptions, { placeholder: "Selecione uma trilha" });
  setSelectOptions(ui.categoryFilter, categoriaOptions, { placeholder: "Todas as categorias", optional: true });
  setSelectOptions(ui.structureCourseSelect, cursoOptions, {
    placeholder: "Selecione um curso para ver a estrutura",
    optional: true,
  });
}

function renderCategoryCourses() {
  const categoriaSelecionada = ui.categoryFilter.value;
  const cursos =
    categoriaSelecionada === ""
      ? plataforma.getCursos()
      : plataforma.getCursosPorCategoria(Number(categoriaSelecionada));

  if (cursos.length === 0) {
    ui.categoryCoursesBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-secondary py-3">Nenhum curso encontrado para o filtro atual.</td></tr>';
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
          <td class="text-end">
            <button class="btn btn-outline-secondary btn-sm view-course-btn" data-course-id="${curso.idCurso}" type="button">
              Detalhes
            </button>
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
          <td><div class="fw-semibold">${escapeHtml(item.trilha.titulo)}</div><small class="text-secondary">${escapeHtml(
            item.trilha.descricao || "-"
          )}</small></td>
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

function renderDetailModal(idCurso) {
  const estrutura = plataforma.getEstruturaCurso(idCurso);
  if (!estrutura) {
    ui.courseDetailBody.innerHTML = '<p class="text-secondary mb-0">Curso nao encontrado.</p>';
    return;
  }
  const categoria = plataforma.getCategoriaById(estrutura.curso.idCategoria);
  const modulosTexto =
    estrutura.modulos.length === 0
      ? "<p class='text-secondary mb-0'>Sem modulos cadastrados.</p>"
      : estrutura.modulos
          .map((modulo) => {
            const aulasTexto =
              modulo.aulas.length === 0
                ? "<li>Sem aulas.</li>"
                : modulo.aulas
                    .map(
                      (aula) =>
                        `<li>#${aula.ordem} - ${escapeHtml(aula.titulo)} (${escapeHtml(aula.tipoConteudo)}, ${
                          aula.duracaoMinutos
                        } min)</li>`
                    )
                    .join("");
            return `<div class="mb-2"><p class="fw-semibold mb-1">Modulo ${modulo.ordem}: ${escapeHtml(
              modulo.titulo
            )}</p><ul class="mb-0">${aulasTexto}</ul></div>`;
          })
          .join("");
  ui.courseDetailBody.innerHTML = `
    <div class="mb-3">
      <p class="mb-1"><strong>ID Curso:</strong> ${estrutura.curso.idCurso}</p>
      <p class="mb-1"><strong>Titulo:</strong> ${escapeHtml(estrutura.curso.titulo)}</p>
      <p class="mb-1"><strong>Categoria:</strong> ${escapeHtml(categoria?.nome ?? "-")}</p>
      <p class="mb-1"><strong>Nivel:</strong> ${escapeHtml(estrutura.curso.nivel)}</p>
      <p class="mb-1"><strong>Publicacao:</strong> ${formatDate(estrutura.curso.dataPublicacao)}</p>
      <p class="mb-1"><strong>Total Aulas:</strong> ${estrutura.curso.totalAulas}</p>
      <p class="mb-0"><strong>Total Horas:</strong> ${estrutura.curso.totalHoras}</p>
    </div>
    <hr />
    ${modulosTexto}
  `;
}

function renderEverything() {
  renderStats();
  renderSelects();
  renderCategoryCourses();
  renderTrailOverview();
  renderCourseStructure();
}

function bindEvents() {
  ui.categoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addCategoria(readFormData(ui.categoryForm));
      ui.categoryForm.reset();
      persistAndRender();
      showAlert(ui.alertContainer, "Categoria cadastrada com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.courseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addCurso(readFormData(ui.courseForm));
      ui.courseForm.reset();
      setDefaults();
      persistAndRender();
      showAlert(ui.alertContainer, "Curso cadastrado com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.trailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addTrilha(readFormData(ui.trailForm));
      ui.trailForm.reset();
      persistAndRender();
      showAlert(ui.alertContainer, "Trilha cadastrada com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.trailCourseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addCursoNaTrilha(readFormData(ui.trailCourseForm));
      ui.trailCourseForm.reset();
      persistAndRender();
      showAlert(ui.alertContainer, "Curso vinculado a trilha com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.moduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addModulo(readFormData(ui.moduleForm));
      ui.moduleForm.reset();
      persistAndRender();
      showAlert(ui.alertContainer, "Modulo cadastrado com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.lessonForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      plataforma.addAula(readFormData(ui.lessonForm));
      ui.lessonForm.reset();
      persistAndRender();
      showAlert(ui.alertContainer, "Aula cadastrada com sucesso.");
    } catch (error) {
      showAlert(ui.alertContainer, error.message, "danger");
    }
  });

  ui.categoryFilter.addEventListener("change", renderCategoryCourses);
  ui.structureCourseSelect.addEventListener("change", renderCourseStructure);

  ui.categoryCoursesBody.addEventListener("click", (event) => {
    const button = event.target.closest(".view-course-btn");
    if (!button) {
      return;
    }
    renderDetailModal(Number(button.dataset.courseId));
    detailModal.show();
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
