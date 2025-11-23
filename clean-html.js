const fs = require('fs');

let html = fs.readFileSync('word-export.html', 'utf-8');

// Supprimer les balises <p class=MsoNormal> en conservant le texte
html = html.replace(/<p class=MsoNormal>(.*?)<\/p>/gs, '$1');

// Supprimer <div class=WordSection1> et </div>
html = html.replace(/<div class=WordSection1>/g, '');
html = html.replace(/<\/div>/g, '');

// Supprimer les commentaires Word
html = html.replace(/<!--.*?-->/gs, '');

// Supprimer les meta Word inutiles
html = html.replace(/<meta name=Generator.*?>/g, '');

fs.writeFileSync('clean.html', html, 'utf-8');
console.log('HTML nettoyé avec succès !');
