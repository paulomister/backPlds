const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração para servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

console.log(`Static folder: ${path.join(__dirname, '../frontend')}`);
console.log(`Current working directory: ${process.cwd()}`);

// Classes
class Usuario {
    constructor(id, senha, nome, email) {
        this.id = id;
        this._senha = senha; // Atributo privado
        this.nome = nome;
        this.email = email;
    }

    autenticar(senha) {
        return this._senha === senha;
    }

    atualizarPerfil(nome = null, email = null, senha = null) {
        if (nome) this.nome = nome;
        if (email) this.email = email;
        if (senha) this._senha = senha;
        return "Perfil atualizado com sucesso.";
    }

    sair() {
        return "Usuário deslogado.";
    }
}

class Aluno extends Usuario {
    constructor(id, senha, nome, email) {
        super(id, senha, nome, email);
        this.scriptsEnviados = [];
        this.duvidasEnviadas = [];
    }

    enviarCodigo(script) {
        this.scriptsEnviados.push(script);
        return `Código enviado com sucesso: ${script}`;
    }

    consultarCorrecao(scriptId) {
        const script = this.scriptsEnviados.find(s => s.id === scriptId);
        return script ? script.correcao : "Correção não encontrada.";
    }

    enviarDuvida(duvida) {
        this.duvidasEnviadas.push(duvida);
        return `Dúvida enviada com sucesso: ${duvida.conteudo}`;
    }

    visualizarResposta(duvidaId) {
        const duvida = this.duvidasEnviadas.find(d => d.id === duvidaId);
        return duvida ? duvida.resposta : "Resposta não encontrada.";
    }

    validarCorrecao(scriptId) {
        const script = this.scriptsEnviados.find(s => s.id === scriptId);
        return script ? script.correcao !== null : false;
    }
}

class Professor extends Usuario {
    constructor(id, senha, nome, email) {
        super(id, senha, nome, email);
        this.turmas = [];
        this.duvidas = [];
    }

    visualizarDuvidas() {
        return this.duvidas;
    }

    responderDuvidas(duvidaId, resposta) {
        const duvida = this.duvidas.find(d => d.id === duvidaId);
        if (duvida) {
            duvida.resposta = resposta;
            return `Resposta enviada: ${resposta}`;
        }
        return "Dúvida não encontrada.";
    }

    gerenciarTurma(turmaId, acao, aluno = null) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (turma) {
            if (acao === "adicionar" && aluno) {
                turma.adicionarAluno(aluno);
                return `Aluno ${aluno.nome} adicionado à turma ${turmaId}.`;
            } else if (acao === "remover" && aluno) {
                turma.removerAluno(aluno);
                return `Aluno ${aluno.nome} removido da turma ${turmaId}.`;
            } else if (acao === "listar") {
                return turma.listarAlunos();
            }
        }
        return "Turma não encontrada.";
    }
}

class Turma {
    constructor(id, professor) {
        this.id = id;
        this.professor = professor;
        this.alunos = [];
    }

    adicionarAluno(aluno) {
        this.alunos.push(aluno);
    }

    removerAluno(aluno) {
        this.alunos = this.alunos.filter(a => a.id !== aluno.id);
    }

    listarAlunos() {
        return this.alunos.map(aluno => aluno.nome);
    }
}

class Duvida {
    constructor(id, aluno, conteudo) {
        this.id = id;
        this.aluno = aluno;
        this.conteudo = conteudo;
        this.resposta = null;
    }
}

class Script {
    constructor(id, codigo) {
        this.id = id;
        this.codigo = codigo;
        this.correcao = null;
    }

    vincularCorrecao(correcao) {
        this.correcao = correcao;
        return `Correção vinculada ao script ${this.id}`;
    }
}

class Correcao {
    constructor(id, codigoCorrigido, aluno) {
        this.id = id;
        this.codigoCorrigido = codigoCorrigido;
        this.aluno = aluno;
    }

    enviarAluno() {
        return this.aluno ? `Correção enviada para ${this.aluno.nome}` : "Correção enviada";
    }
}

class APIAnalise {
    constructor(url = "") {
        this.url = url;
    }

    async analisarCodigo(codigo) {
        const payload = {
            model: "",
            prompt: `Corrija e melhore este código: ${codigo}`,
            stream: false,
        };

        try {
            const response = await axios.post(this.url, payload);
            if (response.status === 200) {
                const resultadoFinal = response.data.response || "Nenhuma resposta encontrada";
                return new Correcao(1, resultadoFinal, null);
            } else {
                return new Correcao(1, "Falha ao analisar código", null);
            }
        } catch (error) {
            return new Correcao(1, `Erro ao conectar com a API: ${error.message}`, null);
        }
    }
}

class Sistema {
    constructor() {
        this.usuarios = [];
        this.turmas = [];
        this.duvidas = [];
    }

    cadastrarUsuario(usuario) {
        this.usuarios.push(usuario);
    }

    autenticarLogin(email, senha) {
        return this.usuarios.find(
            usuario => usuario.email === email && usuario.autenticar(senha)
        ) || null;
    }

    adicionarTurma(turma) {
        this.turmas.push(turma);
    }

    encaminharDuvidaParaProfessor(duvida, professor) {
        professor.duvidas.push(duvida);
        return `Dúvida encaminhada para o professor ${professor.nome}.`;
    }

    encaminharRespostaParaAluno(duvida, aluno) {
        const duvidaAluno = aluno.duvidasEnviadas.find(d => d.id === duvida.id);
        if (duvidaAluno) {
            duvidaAluno.resposta = duvida.resposta;
            return `Resposta encaminhada para o aluno ${aluno.nome}.`;
        }
        return "Dúvida não encontrada.";
    }

    listarAlunos() {
        return this.usuarios
            .filter(usuario => usuario instanceof Aluno)
            .map(usuario => usuario.nome);
    }
}

const sistema = new Sistema();
const apiAnalise = new APIAnalise();

const aluno1 = new Aluno(1, "123", "João", "j");
const professor1 = new Professor(2, "456", "Maria", "m");
sistema.cadastrarUsuario(aluno1);
sistema.cadastrarUsuario(professor1);

const turma1 = new Turma(1, professor1);
sistema.adicionarTurma(turma1);

// Rotas
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    console.log(`Email recebido: ${email}`);
    console.log(`Senha recebida: ${senha}`);

    const usuario = sistema.autenticarLogin(email, senha);
    if (usuario) {
        console.log(`Usuário autenticado: ${usuario.nome}`);
        res.json({ message: `Bem-vindo, ${usuario.nome}!`, usuario: usuario.nome });
    } else {
        console.log("Login falhou: credenciais inválidas");
        res.status(401).json({ message: "Login falhou. Verifique suas credenciais." });
    }
});

app.post('/analisar', async (req, res) => {
    const { codigo } = req.body;
    const correcao = await apiAnalise.analisarCodigo(codigo);
    res.json({ correcao: correcao.codigoCorrigido });
});

app.post('/enviar_duvida', (req, res) => {
    const { aluno_id, conteudo } = req.body;
    const aluno = sistema.usuarios.find(
        usuario => usuario.id === aluno_id && usuario instanceof Aluno
    );
    if (aluno) {
        const duvida = new Duvida(sistema.duvidas.length + 1, aluno, conteudo);
        sistema.duvidas.push(duvida);
        sistema.encaminharDuvidaParaProfessor(duvida, professor1);
        res.json({ message: "Dúvida enviada com sucesso." });
    } else {
        res.status(404).json({ message: "Aluno não encontrado." });
    }
});

app.post('/responder_duvida', (req, res) => {
    const { duvida_id, resposta } = req.body;
    const duvida = sistema.duvidas.find(d => d.id === duvida_id);
    if (duvida) {
        professor1.responderDuvidas(duvida_id, resposta);
        sistema.encaminharRespostaParaAluno(duvida, duvida.aluno);
        res.json({ message: "Resposta enviada com sucesso." });
    } else {
        res.status(404).json({ message: "Dúvida não encontrada." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});