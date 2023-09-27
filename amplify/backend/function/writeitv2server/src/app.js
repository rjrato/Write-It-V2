/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

require('dotenv').config();
const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require('cors');

const app = express();
app.use(express.json());
const bodyParser = require('body-parser')
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'build')));

const CORS_URL = process.env.CORS_URL;

const corsOptions = {
  origin: CORS_URL,
  optionsSuccessStatus: 204
}
app.use(cors(corsOptions));

// MongoDB connection
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connection successful'))
  .catch(err => console.log('MongoDB connection error:', err));


// Schemas and Models
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  notes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note"
  }]
});

const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
})

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get(`/api/getUserNotes/:userId`, async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await User.findById(userId).populate("notes");
    res.json(user.notes);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

/****************************
* Example post method *
****************************/

app.post("/api/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
    });
    
    await newUser.save(); 
    res.status(200).json({
      success: true,
      user: {
        userId: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      message: "User registered"
    });
  
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(400).json({ 
      success: false, 
      message: "Registration failed" 
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (isMatch) {
        res.status(200).json({
          success: true,
          user: {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      } else {
        res.status(401).send("Incorrect password");
      }
    } else {
      alert("User not found, please confirm your e-mail!")
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(400).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/addNote", async (req, res) => {
  try {

    const {userId, title, content} = req.body;
    
    const newNote = new Note({
      title,
      content,
      user: userId
    })

    await newNote.save();
    const user = await User.findById(userId);
    user.notes.push(newNote);
    await user.save();
    res.status(200).json({ success: true, note: newNote, message: "Note successfully added!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err});
  }
});

app.post(`/api/deleteNote/:userId/:noteId`, async (req, res) => {

  const {userId, noteId} = req.params;
  await Note.findByIdAndDelete(noteId);
  const user = await User.findById(userId);
  user.notes.pull(noteId);
  await user.save();
  res.status(200).json({ success: true, message: "Note successfully deleted!"})
});

/****************************
* Example put method *
****************************/

app.put('/api/login', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/api/login/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/api/login', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/api/login/*', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
