const express = require('express');
const exphbs = require('express-handlebars');
const sequelize = require('./config/bd');
const Filme = require('./models/filme.model');
const methodOverride = require('method-override');
const Diretor = require('./models/Diretor');
const Artista = require('./models/Artista');
const FichaTecnica = require('./models/FichaTecnica');

const app = express();

app.use(methodOverride('_method'));

// Middleware para formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurando Handlebars
app.engine('handlebars', exphbs.engine({defaultLayout: false}));

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
app.get(
  '/filmes/cadastrar', 
  (req, res) => res.render('cadastrarFilme')
);

// Rota POST - Cadastrar filme
app.post('/filmes', async (req, res) => {

  const nome = req.body.nome;
  const ano = req.body.ano;

  await Filme.create({
    nome: nome, 
    ano: ano
  });

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

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

// 1:1 - Filme e FichaTecnica
Filme.hasOne(FichaTecnica, { foreignKey: 'filmeId', as: 'fichaTecnica' });
FichaTecnica.belongsTo(Filme, { foreignKey: 'filmeId', as: 'filme' });

// 1:N - Diretor e Filme
Diretor.hasMany(Filme, { foreignKey: 'diretorId', as: 'filmes' });
Filme.belongsTo(Diretor, { foreignKey: 'diretorId', as: 'diretor' });

// N:N - Filme e Artista
Artista.belongsToMany(Filme, { through: 'FilmeArtista', foreignKey: 'artistaId', as: 'filmes' });
Filme.belongsToMany(Artista, { through: 'FilmeArtista', foreignKey: 'filmeId', as: 'artistas' });





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