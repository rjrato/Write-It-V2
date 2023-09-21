require('dotenv').config();
const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'build')));

const corsOptions = {
  origin: 'http://write-it.us-east-1.elasticbeanstalk.com',
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

// User registration API
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

// User login API
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

// User add note API
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

// User delete note API
app.post(`/api/deleteNote/:userId/:noteId`, async (req, res) => {

  const {userId, noteId} = req.params;
  await Note.findByIdAndDelete(noteId);
  const user = await User.findById(userId);
  user.notes.pull(noteId);
  await user.save();
  res.status(200).json({ success: true, message: "Note successfully deleted!"})
});

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

const PORT = process.env.PORT || 3001;
app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});