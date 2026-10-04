const mongoose = require("mongoose");

async function connectionToDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connect To DataBase ..");
  } catch (error) {
    console.log("Failed To Connect DataBase", error);
  }
}


module.exports = connectionToDB;