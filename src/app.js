const express = require("express");

// Init App
const app = express();

app.get("/" , (req,res) =>{
    res.send("Hello") 
})

module.exports = app;