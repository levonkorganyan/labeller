const { app } = require('./app');
const path = require("path");

// Start server
const port = process.env.PORT || '3002';
app.set('port', port);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
