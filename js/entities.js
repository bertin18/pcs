export class Categoria {
  constructor({ idCategoria, nome, descricao }) {
    this.idCategoria = idCategoria;
    this.nome = nome;
    this.descricao = descricao;
  }
}

export class Curso {
  constructor({
    idCurso,
    titulo,
    descricao,
    idInstrutor,
    idCategoria,
    nivel,
    dataPublicacao,
    totalAulas = 0,
    totalHoras = 0,
  }) {
    this.idCurso = idCurso;
    this.titulo = titulo;
    this.descricao = descricao;
    this.idInstrutor = idInstrutor;
    this.idCategoria = idCategoria;
    this.nivel = nivel;
    this.dataPublicacao = dataPublicacao;
    this.totalAulas = totalAulas;
    this.totalHoras = totalHoras;
  }
}

export class Trilha {
  constructor({ idTrilha, titulo, descricao, idCategoria }) {
    this.idTrilha = idTrilha;
    this.titulo = titulo;
    this.descricao = descricao;
    this.idCategoria = idCategoria;
  }
}

export class TrilhaCurso {
  constructor({ idTrilha, idCurso, ordem }) {
    this.idTrilha = idTrilha;
    this.idCurso = idCurso;
    this.ordem = ordem;
  }
}

export class Modulo {
  constructor({ idModulo, idCurso, titulo, ordem }) {
    this.idModulo = idModulo;
    this.idCurso = idCurso;
    this.titulo = titulo;
    this.ordem = ordem;
  }
}

export class Aula {
  constructor({ idAula, idModulo, titulo, tipoConteudo, urlConteudo, duracaoMinutos, ordem }) {
    this.idAula = idAula;
    this.idModulo = idModulo;
    this.titulo = titulo;
    this.tipoConteudo = tipoConteudo;
    this.urlConteudo = urlConteudo;
    this.duracaoMinutos = duracaoMinutos;
    this.ordem = ordem;
  }
}

export class Usuario {
  constructor({ idUsuario, nomeCompleto, email, senhaHash, dataCadastro }) {
    this.idUsuario = idUsuario;
    this.nomeCompleto = nomeCompleto;
    this.email = email;
    this.senhaHash = senhaHash;
    this.dataCadastro = dataCadastro;
  }
}

export class Matricula {
  constructor({ idMatricula, idUsuario, idCurso, dataMatricula, dataConclusao = "" }) {
    this.idMatricula = idMatricula;
    this.idUsuario = idUsuario;
    this.idCurso = idCurso;
    this.dataMatricula = dataMatricula;
    this.dataConclusao = dataConclusao;
  }
}

export class ProgressoAula {
  constructor({ idUsuario, idAula, dataConclusao = "", status }) {
    this.idUsuario = idUsuario;
    this.idAula = idAula;
    this.dataConclusao = dataConclusao;
    this.status = status;
  }
}

export class Certificado {
  constructor({ idCertificado, idUsuario, idCurso, idTrilha = null, codigoVerificacao, dataEmissao }) {
    this.idCertificado = idCertificado;
    this.idUsuario = idUsuario;
    this.idCurso = idCurso;
    this.idTrilha = idTrilha;
    this.codigoVerificacao = codigoVerificacao;
    this.dataEmissao = dataEmissao;
  }
}

export class Plano {
  constructor({ idPlano, nome, descricao, preco, duracaoMeses }) {
    this.idPlano = idPlano;
    this.nome = nome;
    this.descricao = descricao;
    this.preco = preco;
    this.duracaoMeses = duracaoMeses;
  }
}

export class Assinatura {
  constructor({ idAssinatura, idUsuario, idPlano, dataInicio, dataFim }) {
    this.idAssinatura = idAssinatura;
    this.idUsuario = idUsuario;
    this.idPlano = idPlano;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
  }
}

export class Pagamento {
  constructor({ idPagamento, idAssinatura, valorPago, dataPagamento, metodoPagamento, idTransacaoGateway }) {
    this.idPagamento = idPagamento;
    this.idAssinatura = idAssinatura;
    this.valorPago = valorPago;
    this.dataPagamento = dataPagamento;
    this.metodoPagamento = metodoPagamento;
    this.idTransacaoGateway = idTransacaoGateway;
  }
}
