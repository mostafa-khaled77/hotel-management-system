const app = require('./app');
const connectionToDB = require('./config/db');
require('dotenv').config();

// Connection To DataBase
connectionToDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is Running on Port ${PORT}`));
