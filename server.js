const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const PORT = process.env.PORT || 8080;
const SERVER = process.env.SERVER;
const app = express();

// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname));

app.set('view engine', 'hbs');
app.engine( 'hbs', hbs( {
  extname: 'hbs',
  defaultView: 'default',
  layoutsDir: __dirname + '/dist',
  partialsDir: __dirname + '/dist'
}));

// send the user to index html page inspite of the url
app.get('*', (req, res) => {
  res.render('index', {name: 'hello'});
  // res.sendFile(path.resolve(__dirname + '/dist', 'index.html'));
});

app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
    console.log(`Server: ${SERVER}`);
});
