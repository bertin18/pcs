import {
  Aula,
  Assinatura,
  Categoria,
  Certificado,
  Curso,
  Matricula,
  Modulo,
  Pagamento,
  Plano,
  ProgressoAula,
  Trilha,
  TrilhaCurso,
  Usuario,
} from "./entities.js";

const NIVEIS_PERMITIDOS = ["Iniciante", "Intermediario", "Avancado"];
const TIPOS_CONTEUDO = ["Video", "Texto", "Quiz"];
const STATUS_PROGRESSO = ["Concluido", "EmAndamento"];
const METODOS_PAGAMENTO = ["CartaoCredito", "Pix", "Boleto", "CarteiraDigital"];

export class PlataformaCursos {
  constructor() {
    this.categorias = [];
    this.cursos = [];
    this.modulos = [];
    this.aulas = [];
    this.trilhas = [];
    this.trilhasCursos = [];
    this.usuarios = [];
    this.matriculas = [];
    this.progressoAulas = [];
    this.certificados = [];
    this.planos = [];
    this.assinaturas = [];
    this.pagamentos = [];

    this._ids = this._getDefaultIds();
  }

  _getDefaultIds() {
    return {
      categoria: 1,
      curso: 1,
      modulo: 1,
      aula: 1,
      trilha: 1,
      usuario: 1,
      matricula: 1,
      certificado: 1,
      plano: 1,
      assinatura: 1,
      pagamento: 1,
    };
  }

  _nextId(chave) {
    const valor = this._ids[chave];
    this._ids[chave] += 1;
    return valor;
  }

  _normalizeText(valor) {
    return String(valor ?? "").trim();
  }

  _toPositiveInteger(valor, campo) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
      throw new Error(`${campo} deve ser um inteiro positivo.`);
    }
    return numero;
  }

  _toPositiveNumber(valor, campo) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) {
      throw new Error(`${campo} deve ser um numero positivo.`);
    }
    return Number(numero.toFixed(2));
  }

  _today() {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  _toValidDate(valor, campo) {
    const texto = this._normalizeText(valor);
    const valido = /^\d{4}-\d{2}-\d{2}$/.test(texto);
    if (!valido) {
      throw new Error(`${campo} invalida. Use o formato YYYY-MM-DD.`);
    }
    return texto;
  }

  _toOptionalDate(valor, campo) {
    const texto = this._normalizeText(valor);
    if (!texto) {
      return "";
    }
    return this._toValidDate(texto, campo);
  }

  _addMonths(dataISO, quantidadeMeses) {
    const partes = dataISO.split("-").map(Number);
    const [ano, mes, dia] = partes;
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    data.setUTCMonth(data.getUTCMonth() + quantidadeMeses);
    const anoFim = data.getUTCFullYear();
    const mesFim = String(data.getUTCMonth() + 1).padStart(2, "0");
    const diaFim = String(data.getUTCDate()).padStart(2, "0");
    return `${anoFim}-${mesFim}-${diaFim}`;
  }

  _validateDateOrder(dataInicio, dataFim, campoInicio, campoFim) {
    if (!dataInicio || !dataFim) {
      return;
    }
    if (dataFim < dataInicio) {
      throw new Error(`${campoFim} nao pode ser anterior a ${campoInicio}.`);
    }
  }

  _assertRequired(valor, campo) {
    if (!this._normalizeText(valor)) {
      throw new Error(`${campo} e obrigatorio.`);
    }
  }

  _toValidEmail(valor) {
    const email = this._normalizeText(valor).toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new Error("Email invalido.");
    }
    return email;
  }

  _toValidPaymentMethod(valor) {
    const metodo = this._normalizeText(valor);
    if (!METODOS_PAGAMENTO.includes(metodo)) {
      throw new Error(`Metodo de pagamento invalido. Opcoes: ${METODOS_PAGAMENTO.join(", ")}`);
    }
    return metodo;
  }

  _getCursoIdByAula(idAula) {
    const aula = this.getAulaById(idAula);
    if (!aula) {
      return null;
    }
    const modulo = this.getModuloById(aula.idModulo);
    return modulo ? modulo.idCurso : null;
  }

  _findMatricula(idUsuario, idCurso) {
    const usuarioId = Number(idUsuario);
    const cursoId = Number(idCurso);
    return this.matriculas.find((matricula) => matricula.idUsuario === usuarioId && matricula.idCurso === cursoId) || null;
  }

  _gerarCodigoVerificacao(idUsuario, idCurso) {
    const base = this._today().replaceAll("-", "");
    let codigo = "";
    do {
      const aleatorio = String(Math.floor(1000 + Math.random() * 9000));
      codigo = `CERT-${base}-${idUsuario}${idCurso}-${aleatorio}`;
    } while (this.certificados.some((certificado) => certificado.codigoVerificacao === codigo));
    return codigo;
  }

  _gerarIdTransacao(idUsuario, idPlano) {
    const base = this._today().replaceAll("-", "");
    let idTransacao = "";
    do {
      const aleatorio = String(Math.floor(100000 + Math.random() * 900000));
      idTransacao = `TRX-${base}-${idUsuario}${idPlano}-${aleatorio}`;
    } while (this.pagamentos.some((pagamento) => pagamento.idTransacaoGateway === idTransacao));
    return idTransacao;
  }

  _atualizarConclusaoMatricula(idUsuario, idCurso) {
    const matricula = this._findMatricula(idUsuario, idCurso);
    if (!matricula) {
      return;
    }

    const resumo = this.getResumoProgressoCurso(idUsuario, idCurso);
    if (resumo.totalAulasCurso > 0 && resumo.aulasConcluidas === resumo.totalAulasCurso) {
      matricula.dataConclusao = matricula.dataConclusao || this._today();
    } else {
      matricula.dataConclusao = "";
    }
  }

  addCategoria({ nome, descricao }) {
    this._assertRequired(nome, "Nome da categoria");
    const nomeNormalizado = this._normalizeText(nome);

    const jaExiste = this.categorias.some(
      (categoria) => categoria.nome.toLowerCase() === nomeNormalizado.toLowerCase()
    );
    if (jaExiste) {
      throw new Error("Ja existe uma categoria com esse nome.");
    }

    const categoria = new Categoria({
      idCategoria: this._nextId("categoria"),
      nome: nomeNormalizado,
      descricao: this._normalizeText(descricao),
    });

    this.categorias.push(categoria);
    return categoria;
  }

  addCurso({ titulo, descricao, idInstrutor, idCategoria, nivel, dataPublicacao }) {
    this._assertRequired(titulo, "Titulo do curso");
    this._assertRequired(nivel, "Nivel");

    const categoriaId = this._toPositiveInteger(idCategoria, "ID da categoria");
    const instrutorId = this._toPositiveInteger(idInstrutor, "ID do instrutor");
    const categoria = this.getCategoriaById(categoriaId);
    if (!categoria) {
      throw new Error("Categoria nao encontrada para o curso.");
    }

    if (!NIVEIS_PERMITIDOS.includes(nivel)) {
      throw new Error(`Nivel invalido. Opcoes: ${NIVEIS_PERMITIDOS.join(", ")}`);
    }

    const curso = new Curso({
      idCurso: this._nextId("curso"),
      titulo: this._normalizeText(titulo),
      descricao: this._normalizeText(descricao),
      idInstrutor: instrutorId,
      idCategoria: categoria.idCategoria,
      nivel,
      dataPublicacao: this._toValidDate(dataPublicacao, "Data de publicacao"),
      totalAulas: 0,
      totalHoras: 0,
    });

    this.cursos.push(curso);
    return curso;
  }

  addTrilha({ titulo, descricao, idCategoria }) {
    this._assertRequired(titulo, "Titulo da trilha");
    const categoriaId = this._toPositiveInteger(idCategoria, "ID da categoria");
    const categoria = this.getCategoriaById(categoriaId);
    if (!categoria) {
      throw new Error("Categoria nao encontrada para a trilha.");
    }

    const trilha = new Trilha({
      idTrilha: this._nextId("trilha"),
      titulo: this._normalizeText(titulo),
      descricao: this._normalizeText(descricao),
      idCategoria: categoria.idCategoria,
    });

    this.trilhas.push(trilha);
    return trilha;
  }

  addCursoNaTrilha({ idTrilha, idCurso, ordem }) {
    const trilhaId = this._toPositiveInteger(idTrilha, "ID da trilha");
    const cursoId = this._toPositiveInteger(idCurso, "ID do curso");
    const ordemNumero = this._toPositiveInteger(ordem, "Ordem");

    const trilha = this.getTrilhaById(trilhaId);
    if (!trilha) {
      throw new Error("Trilha nao encontrada.");
    }

    const curso = this.getCursoById(cursoId);
    if (!curso) {
      throw new Error("Curso nao encontrado.");
    }

    const mesmaRelacao = this.trilhasCursos.some(
      (item) => item.idTrilha === trilhaId && item.idCurso === cursoId
    );
    if (mesmaRelacao) {
      throw new Error("Esse curso ja foi vinculado a essa trilha.");
    }

    const ordemDuplicada = this.trilhasCursos.some(
      (item) => item.idTrilha === trilhaId && item.ordem === ordemNumero
    );
    if (ordemDuplicada) {
      throw new Error("A ordem informada ja esta ocupada nessa trilha.");
    }

    const trilhaCurso = new TrilhaCurso({ idTrilha: trilhaId, idCurso: cursoId, ordem: ordemNumero });
    this.trilhasCursos.push(trilhaCurso);
    return trilhaCurso;
  }

  addModulo({ idCurso, titulo, ordem }) {
    this._assertRequired(titulo, "Titulo do modulo");

    const cursoId = this._toPositiveInteger(idCurso, "ID do curso");
    const ordemNumero = this._toPositiveInteger(ordem, "Ordem");

    const curso = this.getCursoById(cursoId);
    if (!curso) {
      throw new Error("Curso nao encontrado para o modulo.");
    }

    const ordemDuplicada = this.modulos.some((modulo) => modulo.idCurso === cursoId && modulo.ordem === ordemNumero);
    if (ordemDuplicada) {
      throw new Error("A ordem do modulo ja existe nesse curso.");
    }

    const modulo = new Modulo({
      idModulo: this._nextId("modulo"),
      idCurso: cursoId,
      titulo: this._normalizeText(titulo),
      ordem: ordemNumero,
    });

    this.modulos.push(modulo);
    return modulo;
  }

  addAula({ idModulo, titulo, tipoConteudo, urlConteudo, duracaoMinutos, ordem }) {
    this._assertRequired(titulo, "Titulo da aula");
    this._assertRequired(tipoConteudo, "Tipo de conteudo");

    if (!TIPOS_CONTEUDO.includes(tipoConteudo)) {
      throw new Error(`Tipo de conteudo invalido. Opcoes: ${TIPOS_CONTEUDO.join(", ")}`);
    }

    const moduloId = this._toPositiveInteger(idModulo, "ID do modulo");
    const duracao = this._toPositiveInteger(duracaoMinutos, "Duracao");
    const ordemNumero = this._toPositiveInteger(ordem, "Ordem");
    const modulo = this.getModuloById(moduloId);
    if (!modulo) {
      throw new Error("Modulo nao encontrado para a aula.");
    }

    const ordemDuplicada = this.aulas.some((aula) => aula.idModulo === moduloId && aula.ordem === ordemNumero);
    if (ordemDuplicada) {
      throw new Error("A ordem da aula ja existe nesse modulo.");
    }

    const url = this._normalizeText(urlConteudo);
    if (url) {
      try {
        new URL(url);
      } catch {
        throw new Error("URL do conteudo invalida.");
      }
    }

    const aula = new Aula({
      idAula: this._nextId("aula"),
      idModulo: moduloId,
      titulo: this._normalizeText(titulo),
      tipoConteudo,
      urlConteudo: url,
      duracaoMinutos: duracao,
      ordem: ordemNumero,
    });

    this.aulas.push(aula);
    this._recalcularTotaisCurso(modulo.idCurso);
    return aula;
  }

  addUsuario({ nomeCompleto, email, senhaHash, dataCadastro }) {
    this._assertRequired(nomeCompleto, "Nome completo");
    this._assertRequired(email, "Email");
    this._assertRequired(senhaHash, "SenhaHash");

    const emailNormalizado = this._toValidEmail(email);
    const emailExistente = this.usuarios.some((usuario) => usuario.email === emailNormalizado);
    if (emailExistente) {
      throw new Error("Ja existe usuario com esse email.");
    }

    const usuario = new Usuario({
      idUsuario: this._nextId("usuario"),
      nomeCompleto: this._normalizeText(nomeCompleto),
      email: emailNormalizado,
      senhaHash: this._normalizeText(senhaHash),
      dataCadastro: this._toValidDate(dataCadastro || this._today(), "Data de cadastro"),
    });

    this.usuarios.push(usuario);
    return usuario;
  }

  addMatricula({ idUsuario, idCurso, dataMatricula, dataConclusao = "" }) {
    const usuarioId = this._toPositiveInteger(idUsuario, "ID do usuario");
    const cursoId = this._toPositiveInteger(idCurso, "ID do curso");
    const usuario = this.getUsuarioById(usuarioId);
    const curso = this.getCursoById(cursoId);
    if (!usuario) {
      throw new Error("Usuario nao encontrado.");
    }
    if (!curso) {
      throw new Error("Curso nao encontrado.");
    }

    const jaMatriculado = this._findMatricula(usuarioId, cursoId);
    if (jaMatriculado) {
      throw new Error("Usuario ja matriculado nesse curso.");
    }

    const matricula = new Matricula({
      idMatricula: this._nextId("matricula"),
      idUsuario: usuarioId,
      idCurso: cursoId,
      dataMatricula: this._toValidDate(dataMatricula || this._today(), "Data da matricula"),
      dataConclusao: this._toOptionalDate(dataConclusao, "Data de conclusao"),
    });

    this.matriculas.push(matricula);
    return matricula;
  }

  registrarProgressoAula({ idUsuario, idAula, status, dataConclusao = "" }) {
    const usuarioId = this._toPositiveInteger(idUsuario, "ID do usuario");
    const aulaId = this._toPositiveInteger(idAula, "ID da aula");
    const statusNormalizado = this._normalizeText(status);

    if (!STATUS_PROGRESSO.includes(statusNormalizado)) {
      throw new Error(`Status invalido. Opcoes: ${STATUS_PROGRESSO.join(", ")}`);
    }

    const usuario = this.getUsuarioById(usuarioId);
    const aula = this.getAulaById(aulaId);
    if (!usuario) {
      throw new Error("Usuario nao encontrado.");
    }
    if (!aula) {
      throw new Error("Aula nao encontrada.");
    }

    const cursoId = this._getCursoIdByAula(aulaId);
    if (!cursoId) {
      throw new Error("Nao foi possivel identificar o curso da aula.");
    }

    const matricula = this._findMatricula(usuarioId, cursoId);
    if (!matricula) {
      throw new Error("Usuario precisa estar matriculado no curso para registrar progresso.");
    }

    const dataFinal =
      statusNormalizado === "Concluido"
        ? this._toOptionalDate(dataConclusao, "Data de conclusao") || this._today()
        : this._toOptionalDate(dataConclusao, "Data de conclusao");

    let progresso = this.progressoAulas.find((item) => item.idUsuario === usuarioId && item.idAula === aulaId);
    if (progresso) {
      progresso.status = statusNormalizado;
      progresso.dataConclusao = statusNormalizado === "Concluido" ? dataFinal : dataFinal || "";
    } else {
      progresso = new ProgressoAula({
        idUsuario: usuarioId,
        idAula: aulaId,
        status: statusNormalizado,
        dataConclusao: statusNormalizado === "Concluido" ? dataFinal : dataFinal || "",
      });
      this.progressoAulas.push(progresso);
    }

    this._atualizarConclusaoMatricula(usuarioId, cursoId);
    return progresso;
  }

  gerarCertificado({ idUsuario, idCurso }) {
    const usuarioId = this._toPositiveInteger(idUsuario, "ID do usuario");
    const cursoId = this._toPositiveInteger(idCurso, "ID do curso");
    const usuario = this.getUsuarioById(usuarioId);
    const curso = this.getCursoById(cursoId);
    if (!usuario) {
      throw new Error("Usuario nao encontrado.");
    }
    if (!curso) {
      throw new Error("Curso nao encontrado.");
    }

    const matricula = this._findMatricula(usuarioId, cursoId);
    if (!matricula) {
      throw new Error("Usuario nao esta matriculado nesse curso.");
    }

    const aulasDoCurso = this.getAulasPorCurso(cursoId);
    if (aulasDoCurso.length === 0) {
      throw new Error("Curso sem aulas cadastradas. Nao e possivel emitir certificado.");
    }

    const resumo = this.getResumoProgressoCurso(usuarioId, cursoId);
    if (resumo.aulasConcluidas !== resumo.totalAulasCurso) {
      throw new Error("Curso ainda nao concluido pelo usuario.");
    }

    const certificadoExistente = this.certificados.find(
      (item) => item.idUsuario === usuarioId && item.idCurso === cursoId
    );
    if (certificadoExistente) {
      throw new Error("Certificado ja emitido para esse usuario nesse curso.");
    }

    const certificado = new Certificado({
      idCertificado: this._nextId("certificado"),
      idUsuario: usuarioId,
      idCurso: cursoId,
      idTrilha: null,
      codigoVerificacao: this._gerarCodigoVerificacao(usuarioId, cursoId),
      dataEmissao: this._today(),
    });

    this.certificados.push(certificado);
    return certificado;
  }

  addPlano({ nome, descricao, preco, duracaoMeses }) {
    this._assertRequired(nome, "Nome do plano");
    const nomeNormalizado = this._normalizeText(nome);
    const precoNumero = this._toPositiveNumber(preco, "Preco");
    const duracaoNumero = this._toPositiveInteger(duracaoMeses, "Duracao em meses");

    const nomeJaExiste = this.planos.some((plano) => plano.nome.toLowerCase() === nomeNormalizado.toLowerCase());
    if (nomeJaExiste) {
      throw new Error("Ja existe um plano com esse nome.");
    }

    const plano = new Plano({
      idPlano: this._nextId("plano"),
      nome: nomeNormalizado,
      descricao: this._normalizeText(descricao),
      preco: precoNumero,
      duracaoMeses: duracaoNumero,
    });

    this.planos.push(plano);
    return plano;
  }

  addAssinatura({ idUsuario, idPlano, dataInicio, dataFim = "" }) {
    const usuarioId = this._toPositiveInteger(idUsuario, "ID do usuario");
    const planoId = this._toPositiveInteger(idPlano, "ID do plano");
    const usuario = this.getUsuarioById(usuarioId);
    const plano = this.getPlanoById(planoId);

    if (!usuario) {
      throw new Error("Usuario nao encontrado para assinatura.");
    }
    if (!plano) {
      throw new Error("Plano nao encontrado para assinatura.");
    }

    const inicio = this._toValidDate(dataInicio || this._today(), "Data de inicio");
    const fim = this._toOptionalDate(dataFim, "Data de fim") || this._addMonths(inicio, plano.duracaoMeses);
    this._validateDateOrder(inicio, fim, "Data de inicio", "Data de fim");

    const assinaturaSobreposta = this.assinaturas.some((assinatura) => {
      if (assinatura.idUsuario !== usuarioId || assinatura.idPlano !== planoId) {
        return false;
      }
      const naoSobrepoe = fim < assinatura.dataInicio || inicio > assinatura.dataFim;
      return !naoSobrepoe;
    });

    if (assinaturaSobreposta) {
      throw new Error("Ja existe assinatura sobreposta para esse usuario nesse plano.");
    }

    const assinatura = new Assinatura({
      idAssinatura: this._nextId("assinatura"),
      idUsuario: usuarioId,
      idPlano: planoId,
      dataInicio: inicio,
      dataFim: fim,
    });

    this.assinaturas.push(assinatura);
    return assinatura;
  }

  addPagamento({
    idAssinatura,
    valorPago,
    dataPagamento,
    metodoPagamento,
    idTransacaoGateway = "",
  }) {
    const assinaturaId = this._toPositiveInteger(idAssinatura, "ID da assinatura");
    const assinatura = this.getAssinaturaById(assinaturaId);
    if (!assinatura) {
      throw new Error("Assinatura nao encontrada para pagamento.");
    }

    const plano = this.getPlanoById(assinatura.idPlano);
    if (!plano) {
      throw new Error("Plano da assinatura nao encontrado.");
    }

    const jaExistePagamento = this.pagamentos.some((pagamento) => pagamento.idAssinatura === assinaturaId);
    if (jaExistePagamento) {
      throw new Error("Ja existe pagamento registrado para essa assinatura.");
    }

    const metodo = this._toValidPaymentMethod(metodoPagamento);
    const valor = this._toPositiveNumber(valorPago || plano.preco, "Valor pago");
    const data = this._toValidDate(dataPagamento || this._today(), "Data de pagamento");
    const transacao = this._normalizeText(idTransacaoGateway) || this._gerarIdTransacao(assinatura.idUsuario, assinatura.idPlano);

    const transacaoDuplicada = this.pagamentos.some((pagamento) => pagamento.idTransacaoGateway === transacao);
    if (transacaoDuplicada) {
      throw new Error("ID de transacao ja utilizado.");
    }

    const pagamento = new Pagamento({
      idPagamento: this._nextId("pagamento"),
      idAssinatura: assinaturaId,
      valorPago: valor,
      dataPagamento: data,
      metodoPagamento: metodo,
      idTransacaoGateway: transacao,
    });

    this.pagamentos.push(pagamento);
    return pagamento;
  }

  simularCheckout({ idUsuario, idPlano, dataInicio, metodoPagamento }) {
    const assinatura = this.addAssinatura({ idUsuario, idPlano, dataInicio });
    const plano = this.getPlanoById(assinatura.idPlano);
    const pagamento = this.addPagamento({
      idAssinatura: assinatura.idAssinatura,
      valorPago: plano.preco,
      dataPagamento: assinatura.dataInicio,
      metodoPagamento,
    });

    return { assinatura, pagamento };
  }

  getCategorias() {
    return [...this.categorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  getCursos() {
    return [...this.cursos].sort((a, b) => a.idCurso - b.idCurso);
  }

  getModulos() {
    return [...this.modulos].sort((a, b) => a.idModulo - b.idModulo);
  }

  getAulas() {
    return [...this.aulas].sort((a, b) => a.idAula - b.idAula);
  }

  getTrilhas() {
    return [...this.trilhas].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }

  getUsuarios() {
    return [...this.usuarios].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR"));
  }

  getMatriculas() {
    return [...this.matriculas].sort((a, b) => a.idMatricula - b.idMatricula);
  }

  getProgressoAulas() {
    return [...this.progressoAulas];
  }

  getCertificados() {
    return [...this.certificados].sort((a, b) => b.idCertificado - a.idCertificado);
  }

  getPlanos() {
    return [...this.planos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  getAssinaturas() {
    return [...this.assinaturas].sort((a, b) => b.idAssinatura - a.idAssinatura);
  }

  getPagamentos() {
    return [...this.pagamentos].sort((a, b) => b.idPagamento - a.idPagamento);
  }

  getMetodosPagamento() {
    return [...METODOS_PAGAMENTO];
  }

  getCategoriaById(idCategoria) {
    return this.categorias.find((categoria) => categoria.idCategoria === Number(idCategoria)) || null;
  }

  getCursoById(idCurso) {
    return this.cursos.find((curso) => curso.idCurso === Number(idCurso)) || null;
  }

  getModuloById(idModulo) {
    return this.modulos.find((modulo) => modulo.idModulo === Number(idModulo)) || null;
  }

  getAulaById(idAula) {
    return this.aulas.find((aula) => aula.idAula === Number(idAula)) || null;
  }

  getTrilhaById(idTrilha) {
    return this.trilhas.find((trilha) => trilha.idTrilha === Number(idTrilha)) || null;
  }

  getUsuarioById(idUsuario) {
    return this.usuarios.find((usuario) => usuario.idUsuario === Number(idUsuario)) || null;
  }

  getCertificadoById(idCertificado) {
    return this.certificados.find((certificado) => certificado.idCertificado === Number(idCertificado)) || null;
  }

  getPlanoById(idPlano) {
    return this.planos.find((plano) => plano.idPlano === Number(idPlano)) || null;
  }

  getAssinaturaById(idAssinatura) {
    return this.assinaturas.find((assinatura) => assinatura.idAssinatura === Number(idAssinatura)) || null;
  }

  getPagamentoById(idPagamento) {
    return this.pagamentos.find((pagamento) => pagamento.idPagamento === Number(idPagamento)) || null;
  }

  getCursosPorCategoria(idCategoria) {
    const categoriaId = Number(idCategoria);
    return this.getCursos().filter((curso) => curso.idCategoria === categoriaId);
  }

  getModulosPorCurso(idCurso) {
    const cursoId = Number(idCurso);
    return this.modulos.filter((modulo) => modulo.idCurso === cursoId).sort((a, b) => a.ordem - b.ordem);
  }

  getAulasPorModulo(idModulo) {
    const moduloId = Number(idModulo);
    return this.aulas.filter((aula) => aula.idModulo === moduloId).sort((a, b) => a.ordem - b.ordem);
  }

  getAulasPorCurso(idCurso) {
    const modulosCurso = this.getModulosPorCurso(idCurso);
    if (modulosCurso.length === 0) {
      return [];
    }

    const mapaOrdemModulo = new Map(modulosCurso.map((modulo) => [modulo.idModulo, modulo.ordem]));
    const idsModulos = new Set(modulosCurso.map((modulo) => modulo.idModulo));

    return this.aulas
      .filter((aula) => idsModulos.has(aula.idModulo))
      .sort((a, b) => {
        const ordemModuloA = mapaOrdemModulo.get(a.idModulo) || 0;
        const ordemModuloB = mapaOrdemModulo.get(b.idModulo) || 0;
        if (ordemModuloA !== ordemModuloB) {
          return ordemModuloA - ordemModuloB;
        }
        return a.ordem - b.ordem;
      });
  }

  getEstruturaCurso(idCurso) {
    const curso = this.getCursoById(idCurso);
    if (!curso) {
      return null;
    }

    const modulos = this.getModulosPorCurso(curso.idCurso).map((modulo) => ({
      ...modulo,
      aulas: this.getAulasPorModulo(modulo.idModulo),
    }));

    return { curso, modulos };
  }

  getResumoTrilhas() {
    return this.getTrilhas().map((trilha) => {
      const cursosVinculados = this.trilhasCursos
        .filter((item) => item.idTrilha === trilha.idTrilha)
        .sort((a, b) => a.ordem - b.ordem)
        .map((item) => ({ ...item, curso: this.getCursoById(item.idCurso) }));

      return {
        trilha,
        categoria: this.getCategoriaById(trilha.idCategoria),
        cursosVinculados,
      };
    });
  }

  getAulasDisponiveisUsuario(idUsuario) {
    const usuarioId = Number(idUsuario);
    const cursosUsuario = this.matriculas.filter((matricula) => matricula.idUsuario === usuarioId).map((matricula) => matricula.idCurso);
    const idsCursos = new Set(cursosUsuario);
    const aulas = [];

    for (const cursoId of idsCursos) {
      aulas.push(...this.getAulasPorCurso(cursoId));
    }

    return aulas;
  }

  getResumoProgressoCurso(idUsuario, idCurso) {
    const usuarioId = Number(idUsuario);
    const cursoId = Number(idCurso);
    const aulasCurso = this.getAulasPorCurso(cursoId);
    const totalAulasCurso = aulasCurso.length;

    if (totalAulasCurso === 0) {
      return {
        idUsuario: usuarioId,
        idCurso: cursoId,
        totalAulasCurso: 0,
        aulasConcluidas: 0,
        percentual: 0,
        status: "Sem aulas",
      };
    }

    const idsAulasConcluidas = new Set(
      this.progressoAulas
        .filter((item) => item.idUsuario === usuarioId && item.status === "Concluido")
        .map((item) => item.idAula)
    );

    const aulasConcluidas = aulasCurso.filter((aula) => idsAulasConcluidas.has(aula.idAula)).length;
    const percentual = Math.round((aulasConcluidas / totalAulasCurso) * 100);
    const status = percentual === 100 ? "Concluido" : "Em andamento";

    return {
      idUsuario: usuarioId,
      idCurso: cursoId,
      totalAulasCurso,
      aulasConcluidas,
      percentual,
      status,
    };
  }

  getMatriculasDetalhadas() {
    return this.getMatriculas().map((matricula) => ({
      matricula,
      usuario: this.getUsuarioById(matricula.idUsuario),
      curso: this.getCursoById(matricula.idCurso),
      progresso: this.getResumoProgressoCurso(matricula.idUsuario, matricula.idCurso),
    }));
  }

  getProgressoDetalhadoPorUsuario(idUsuario) {
    const usuarioId = Number(idUsuario);
    const registros = this.progressoAulas
      .filter((item) => item.idUsuario === usuarioId)
      .map((item) => {
        const aula = this.getAulaById(item.idAula);
        const modulo = aula ? this.getModuloById(aula.idModulo) : null;
        const curso = modulo ? this.getCursoById(modulo.idCurso) : null;
        return {
          progresso: item,
          aula,
          modulo,
          curso,
        };
      });

    return registros.sort((a, b) => {
      if (!a.modulo || !b.modulo) {
        return 0;
      }
      if (a.curso?.idCurso !== b.curso?.idCurso) {
        return (a.curso?.idCurso || 0) - (b.curso?.idCurso || 0);
      }
      if (a.modulo.ordem !== b.modulo.ordem) {
        return a.modulo.ordem - b.modulo.ordem;
      }
      return (a.aula?.ordem || 0) - (b.aula?.ordem || 0);
    });
  }

  getCertificadosDetalhados() {
    return this.getCertificados().map((certificado) => ({
      certificado,
      usuario: this.getUsuarioById(certificado.idUsuario),
      curso: this.getCursoById(certificado.idCurso),
    }));
  }

  getAssinaturasDetalhadas() {
    return this.getAssinaturas().map((assinatura) => ({
      assinatura,
      usuario: this.getUsuarioById(assinatura.idUsuario),
      plano: this.getPlanoById(assinatura.idPlano),
    }));
  }

  getPagamentosDetalhados() {
    return this.getPagamentos().map((pagamento) => {
      const assinatura = this.getAssinaturaById(pagamento.idAssinatura);
      const usuario = assinatura ? this.getUsuarioById(assinatura.idUsuario) : null;
      const plano = assinatura ? this.getPlanoById(assinatura.idPlano) : null;

      return {
        pagamento,
        assinatura,
        usuario,
        plano,
      };
    });
  }

  getResumoFinanceiro() {
    const totalReceita = this.pagamentos.reduce((acumulado, pagamento) => acumulado + pagamento.valorPago, 0);
    return {
      totalPlanos: this.planos.length,
      totalAssinaturas: this.assinaturas.length,
      totalPagamentos: this.pagamentos.length,
      receitaTotal: Number(totalReceita.toFixed(2)),
    };
  }

  exportState() {
    return {
      categorias: this.categorias.map((item) => ({ ...item })),
      cursos: this.cursos.map((item) => ({ ...item })),
      modulos: this.modulos.map((item) => ({ ...item })),
      aulas: this.aulas.map((item) => ({ ...item })),
      trilhas: this.trilhas.map((item) => ({ ...item })),
      trilhasCursos: this.trilhasCursos.map((item) => ({ ...item })),
      usuarios: this.usuarios.map((item) => ({ ...item })),
      matriculas: this.matriculas.map((item) => ({ ...item })),
      progressoAulas: this.progressoAulas.map((item) => ({ ...item })),
      certificados: this.certificados.map((item) => ({ ...item })),
      planos: this.planos.map((item) => ({ ...item })),
      assinaturas: this.assinaturas.map((item) => ({ ...item })),
      pagamentos: this.pagamentos.map((item) => ({ ...item })),
      _ids: { ...this._ids },
    };
  }

  loadState(state = {}) {
    const asArray = (valor) => (Array.isArray(valor) ? valor.map((item) => ({ ...item })) : []);
    this.categorias = asArray(state.categorias);
    this.cursos = asArray(state.cursos);
    this.modulos = asArray(state.modulos);
    this.aulas = asArray(state.aulas);
    this.trilhas = asArray(state.trilhas);
    this.trilhasCursos = asArray(state.trilhasCursos);
    this.usuarios = asArray(state.usuarios);
    this.matriculas = asArray(state.matriculas);
    this.progressoAulas = asArray(state.progressoAulas);
    this.certificados = asArray(state.certificados);
    this.planos = asArray(state.planos);
    this.assinaturas = asArray(state.assinaturas);
    this.pagamentos = asArray(state.pagamentos);

    const idsCarregados = state && typeof state._ids === "object" ? state._ids : {};
    this._ids = {
      ...this._getDefaultIds(),
      ...idsCarregados,
    };

    this._reindexIds();
  }

  _reindexIds() {
    const nextBy = (colecao, idCampo) =>
      colecao.reduce((maior, item) => Math.max(maior, Number(item?.[idCampo]) || 0), 0) + 1;

    this._ids.categoria = Math.max(Number(this._ids.categoria) || 1, nextBy(this.categorias, "idCategoria"));
    this._ids.curso = Math.max(Number(this._ids.curso) || 1, nextBy(this.cursos, "idCurso"));
    this._ids.modulo = Math.max(Number(this._ids.modulo) || 1, nextBy(this.modulos, "idModulo"));
    this._ids.aula = Math.max(Number(this._ids.aula) || 1, nextBy(this.aulas, "idAula"));
    this._ids.trilha = Math.max(Number(this._ids.trilha) || 1, nextBy(this.trilhas, "idTrilha"));
    this._ids.usuario = Math.max(Number(this._ids.usuario) || 1, nextBy(this.usuarios, "idUsuario"));
    this._ids.matricula = Math.max(Number(this._ids.matricula) || 1, nextBy(this.matriculas, "idMatricula"));
    this._ids.certificado = Math.max(
      Number(this._ids.certificado) || 1,
      nextBy(this.certificados, "idCertificado")
    );
    this._ids.plano = Math.max(Number(this._ids.plano) || 1, nextBy(this.planos, "idPlano"));
    this._ids.assinatura = Math.max(Number(this._ids.assinatura) || 1, nextBy(this.assinaturas, "idAssinatura"));
    this._ids.pagamento = Math.max(Number(this._ids.pagamento) || 1, nextBy(this.pagamentos, "idPagamento"));
  }

  _recalcularTotaisCurso(idCurso) {
    const curso = this.getCursoById(idCurso);
    if (!curso) {
      return;
    }

    const aulasDoCurso = this.getAulasPorCurso(curso.idCurso);
    const duracaoTotalEmMinutos = aulasDoCurso.reduce((acumulado, aula) => acumulado + aula.duracaoMinutos, 0);

    curso.totalAulas = aulasDoCurso.length;
    curso.totalHoras = Number((duracaoTotalEmMinutos / 60).toFixed(1));
  }
}
