const Filme = require('./filme.model');
const Diretor = require('./Diretor');
const Artista = require('./Artista');
const FichaTecnica = require('./FichaTecnica');

// 1:1 - Filme e Ficha Técnica
Filme.hasOne(FichaTecnica, {
  foreignKey: 'filmeId',
  as: 'fichaTecnica'
});

FichaTecnica.belongsTo(Filme, {
  foreignKey: 'filmeId',
  as: 'filme'
});

// 1:N - Diretor e Filme
Diretor.hasMany(Filme, {
  foreignKey: 'diretorId',
  as: 'filmes'
});

Filme.belongsTo(Diretor, {
  foreignKey: 'diretorId',
  as: 'diretor'
});

// N:N - Filme e Artista
Filme.belongsToMany(Artista, {
  through: 'FilmeArtista',
  foreignKey: 'filmeId',
  as: 'artistas'
});

Artista.belongsToMany(Filme, {
  through: 'FilmeArtista',
  foreignKey: 'artistaId',
  as: 'filmes'
});