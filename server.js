const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 8080;
const app = express();

// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname));

// send the user to index html page inspite of the url
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/dist', 'index.html'));
});

app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});
