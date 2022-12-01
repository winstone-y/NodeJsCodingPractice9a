const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbpath = path.join(__dirname, "userData.db");

const bcrypt = require("bcrypt");

let db;

// initialize database and server

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Online");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
  }
};

initDbAndServer();

// API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const registerUser = `
    INSERT INTO user (username,name,password,gender,location) 
    VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;

  const selectUser = `
  SELECT * FROM user WHERE username='${username}';`;

  const isUserRegistered = await db.get(selectUser);

  if (isUserRegistered != undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    await db.run(registerUser);
    response.status(200);
    response.send("User created successfully");
  }
});

// API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUser = `
  SELECT * FROM user WHERE username='${username}';`;

  const dbUser = await db.get(selectUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCorrect) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3 CHANGE PASSWORD

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUser = `
  SELECT * FROM user WHERE username='${username}';`;

  const dbUser = await db.get(selectUser);

  const checkCurrentPassword = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );

  if (checkCurrentPassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);

      const passwordUpdateQuery = `
            UPDATE user SET password='${newHashedPassword}';`;

      await db.run(passwordUpdateQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
