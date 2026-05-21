const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const uri = process.env.MONGODB_URI;
const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("ideaVaultDB");
    const ideaCollection = db.collection("ideas");

    app.post("/ideas", async (req, res) => {
      try {
        const ideaData = req.body;
        console.log("Adding new idea:", ideaData);

        const result = await ideaCollection.insertOne(ideaData);
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save idea" });
      }
    });

    app.get("/ideas", async (req, res) => {
      try {
        const result = await ideaCollection.find().toArray();
        res.json(result);
      } catch (error) {
        console.error("Error fetching ideas:", error);
        res.status(500).json({ message: "Failed to fetch ideas" });
      }
    });

    app.get("/ideas/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await ideaCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).json({ message: "Idea not found" });
        }

        res.json(result);
      } catch (error) {
        console.error("Error fetching single idea:", error);
        res.status(500).json({ message: "Invalid ID or Server Error" });
      }
    });

    app.delete("/ideas/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await ideaCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.json(result);
      } catch (error) {
        console.error("Error deleting idea:", error);
        res.status(500).json({ message: "Failed to delete idea" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
