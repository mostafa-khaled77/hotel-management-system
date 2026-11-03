const connectionToDB = require('./src/config/db');
const { rooms, defaultAdmin } = require('./data');
const { Room } = require('./src/models/room.model');
const { User } = require('./src/models/user.model');
require('dotenv').config();
connectionToDB();



// Import Admin
const importAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });
    if(!existingAdmin){
        await User.create(defaultAdmin);
        console.log('Default Admin Imported Successfully');
    }else{
        console.log('Admin is already existing !');
    }
    process.exit(0)
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};


//  Insert Rooms
const importRooms = async () => {
    try {
        await Room.insertMany(rooms)
        console.log("Rooms Imported");
        process.exit(0)
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}
//  Delete Rooms
const deletetRooms = async () => {
    try {
        await Room.deleteMany()
        console.log("Rooms Deleted");
        process.exit(0)
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}


if(process.argv[2] === '-import-admin'){
    importAdmin();
}else if (process.argv[2] === '-import-rooms'){
    importRooms();
}else if(process.argv[2] === '-delete-rooms'){
    deletetRooms();
}