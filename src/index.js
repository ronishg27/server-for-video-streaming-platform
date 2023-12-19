import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` ⚙️  Server is listening at ${PORT}`);
      
    });
  })
  .catch((err) => {
    console.log("MongDB connection failed: " + err);
  });

/*























// using express app to connect with mongodb,  immediate function execution
// we will use another file to export the connect function for connection to mongodb
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERR:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Listening on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error:", error);
    throw err;
  }
})();


*/

// always use async await and try catch while making connection or communicating with database
