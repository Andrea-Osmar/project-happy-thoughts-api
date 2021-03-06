import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import mongoose from "mongoose"

// CODE FOR DATABASE
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

// THOUGHTS MODEL
const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  name: {
    type: String,
    default: "Anonymous",
  },
  createdAt: {
    type: Date,
    default: () => new Date(), 
  },
})

// SERVER
const port = process.env.PORT || 8080
const app = express()

// MIDDLEWARES
app.use(cors())
app.use(bodyParser.json())
const listEndpoints = require("express-list-endpoints")

// ERROR HANDLING WHEN DATABASE IS DOWN OR OUT OF REACH
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: "Service unavailable" })
  }
})

// ROOT ENDPOINT
app.get("/", (req, res) => {
  res.send(listEndpoints(app))
})

// ENDPOINT GET THOUGHTS
app.get("/thoughts", async (req, res) => {
  try {
    //Success
    const thoughts = await Thought.find().sort({ createdAt: "desc" }).limit(20)
    res.status(200).json(thoughts)
  } catch (err) {
    res
      .status(400)
      .json({ message: "Could not get thoughts", error: err.errors })
  }
})

// ENDPOINT POST THOUGHTS
app.post("/thoughts", async (req, res) => {
  // Retrieve the information sent by client to out API endpoint
  const { message, name } = req.body

  // Use mongoose model to create the database entry
  const thoughts = new Thought({ message, name: name })

  try {
    //Success
    const savedThought = await thoughts.save()
    res.status(201).json(savedThought)
  } catch (err) {
    res.status(400).json({
      message: "Could not save thought to the Database",
      error: err.errors,
    })
  }
})

// ENDPOINT POST THOUGHTS/:thoughtId/like
app.post("/thoughts/:id/like", async (req, res) => {
  const { id } = req.params
  

  try {
    //Success
    await Thought.updateOne(
      { _id: id },
      { $inc: { hearts: 1 } }
      
    )
    res.status(201).send()
  } catch (err) {
    res.status(404).json({
      message: "Could not save your like to the database",
      error: err.errors,
    })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
