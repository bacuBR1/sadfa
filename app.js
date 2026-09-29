const express = require('express');
const exphbs = require('express-handlebars');
const sequelize = require('./config/bd');
const Filme = require('./models/filme.model');
const methodOverride = require('method-override');
const Diretor = require('./models/Diretor');
const Artista = require('./models/Artista');
const FichaTecnica = require('./models/FichaTecnica');
require('./models/relacionamentosModels');

const app = express();

app.use(methodOverride('_method'));

// Middleware para formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurando Handlebars com layout compartilhado
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));

app.set('view engine', 'handlebars');

// Rota GET - Página inicial
app.get('/', (req, res) => {

  res.render('home', {
    titulo: 'Página Inicial'
  });

});

// Rota GET - Listar filmes
app.get('/filmes', async (req, res) => {
  const filmes = await Filme.findAll({raw: true});
  res.render('filmes', { filmes });
});

// Rota GET - Formulário de cadastro
app.get('/filmes/cadastrar', async (req, res) => {
  const diretores = await Diretor.findAll({ raw: true });
  const artistas = await Artista.findAll({ raw: true });
  res.render('cadastrarFilme', { diretores, artistas });
});

// Rota POST - Cadastrar filme
app.post('/filmes', async (req, res) => {

  const nome = req.body.nome;
  const ano = req.body.ano;
  const diretorId = req.body.diretorId || null;
  const artistaIds = req.body.artistas
    ? (Array.isArray(req.body.artistas) ? req.body.artistas : [req.body.artistas])
    : [];

  const filme = await Filme.create({
    nome: nome, 
    ano: ano,
    diretorId: diretorId
  });

  if (artistaIds.length) await filme.setArtistas(artistaIds);

  res.redirect('/filmes');
});

app.get(
  '/filmes/:id/editar', 
  async (req, res) => {
    const id = req.params.id;
    const filme = await Filme.findByPk(id, {raw: true});
    res.render('editarFilme', { filme });
  }
);

app.put(
  '/filmes/:id', 
  async (req, res) => {
    const id = req.params.id;
    const nome = req.body.nome;
    const ano = req.body.ano;
    
    const filme = await Filme.findByPk(id);
    
    filme.nome = nome;
    filme.ano = ano;
    await filme.save();

    res.redirect('/filmes');
  }
);

app.delete(
  '/filmes/:id', 
  async (req, res) => {
    const id = req.params.id;
    const filme = await Filme.findByPk(id);
    await filme.destroy();
    res.redirect('/filmes');
  }
);

// CRUD básico de artistas
app.get('/artistas', async (req, res) => {
  const artistas = await Artista.findAll({ raw: true });
  res.render('artistas', { artistas });
});

app.get('/artistas/cadastrar', (req, res) => {
  res.render('cadastrarArtista');
});

app.post('/artistas', async (req, res) => {
  await Artista.create({
    nome: req.body.nome,
    anoNascimento: req.body.anoNascimento || null,
    emAtividade: req.body.emAtividade === 'true',
    foto: req.body.foto || null,
    nomeArtistico: req.body.nomeArtistico || null
  });

  res.redirect('/artistas');
});

app.get('/artistas/:id', async (req, res) => {
  const artista = await Artista.findByPk(req.params.id, {
    include: [{ model: Filme, as: 'filmes' }]
  });

  if (!artista) return res.status(404).send('Artista não encontrado.');
  res.render('detalharArtista', { artista: artista.toJSON() });
});

// CRUD básico de diretores
app.get('/diretores', async (req, res) => {
  const diretores = await Diretor.findAll({ raw: true });
  res.render('diretores', { diretores });
});

app.get('/diretores/cadastrar', (req, res) => {
  res.render('cadastrarDiretor');
});

app.post('/diretores', async (req, res) => {
  await Diretor.create({
    nome: req.body.nome,
    anoNascimento: req.body.anoNascimento || null,
    nacionalidade: req.body.nacionalidade || null
  });

  res.redirect('/diretores');
});

app.get('/diretores/:id', async (req, res) => {
  const diretor = await Diretor.findByPk(req.params.id, {
    include: [{ model: Filme, as: 'filmes' }]
  });

  if (!diretor) return res.status(404).send('Diretor não encontrado.');
  res.render('detalharDiretor', { diretor: diretor.toJSON() });
});

// CRUD básico de fichas técnicas
app.get('/fichas-tecnicas', async (req, res) => {
  const fichasTecnicas = await FichaTecnica.findAll({
    include: [{ model: Filme, as: 'filme' }]
  });
  res.render('fichasTecnicas', {
    fichasTecnicas: fichasTecnicas.map((ficha) => ficha.toJSON())
  });
});

app.get('/fichas-tecnicas/cadastrar', async (req, res) => {
  const filmes = await Filme.findAll({ raw: true });
  res.render('cadastrarFichaTecnicaGeral', { filmes });
});

app.post('/fichas-tecnicas', async (req, res) => {
  const filme = await Filme.findByPk(req.body.filmeId);
  if (!filme) return res.status(400).send('Selecione um filme válido.');

  await filme.createFichaTecnica({
    duracaoMinutos: req.body.duracaoMinutos || null,
    orcamento: req.body.orcamento || null,
    bilheteria: req.body.bilheteria || null
  });

  res.redirect('/fichas-tecnicas');
});

app.get('/fichas-tecnicas/:id', async (req, res) => {
  const fichaTecnica = await FichaTecnica.findByPk(req.params.id, {
    include: [{ model: Filme, as: 'filme' }]
  });

  if (!fichaTecnica) return res.status(404).send('Ficha técnica não encontrada.');
  res.render('detalharFichaTecnica', { fichaTecnica: fichaTecnica.toJSON() });
});

app.get('/filmes/:id/ficha-tecnica/cadastrar', async (req, res) => {
  const id = req.params.id;
  const filme = await Filme.findByPk(id, { raw: true });
  res.render('cadastrarFichaTecnica', { filme });
});

app.post('/filmes/:id/ficha-tecnica', async (req, res) => {
  const id = req.params.id;
  const duracaoMinutos = req.body.duracaoMinutos;
  const orcamento = req.body.orcamento;
  const bilheteria = req.body.bilheteria;

  const filme = await Filme.findByPk(id);

  await filme.createFichaTecnica({
    duracaoMinutos: duracaoMinutos,
    orcamento: orcamento,
    bilheteria: bilheteria
  });

  res.redirect(`/filmes/${id}`);
});

app.get('/filmes/:id', async (req, res) => {
  const id = req.params.id;
  const filme = await Filme.findByPk(id, {
    include: [
      { model: Diretor, as: 'diretor' },
      { model: Artista, as: 'artistas' },
      { model: FichaTecnica, as: 'fichaTecnica' }
    ]
  });
  res.render('detalharFilme', { filme: filme.toJSON() });
});
async function conectarBD() {
  try {
    await sequelize.sync();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (erro) {
    console.error('Erro ao conectar:', erro);
  }
}

conectarBD();

// Inicializando servidor
app.listen(3000, () => {

  console.log('Servidor executando em http://localhost:3000');

});