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
        const { email } = req.query;

        let query = {};
        if (email) {
          query = { userEmail: email };
        }

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

    app.patch("/ideas/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        console.log("Updating idea ID:", id, "with data:", updatedData);

        const result = await ideaCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        res.json(result);
      } catch (error) {
        console.error("Error updating idea:", error);
        res.status(500).json({ message: "Failed to update idea" });
      }
    });

    app.post("/ideas/:id/comments", async (req, res) => {
      try {
        const ideaId = req.params.id;
        const { text, userEmail, userName } = req.body;

        const newComment = {
          commentId: new Date().getTime().toString(),
          text,
          userEmail,
          userName: userName || "Anonymous",
          createdAt: new Date(),
        };

        const result = await ideaCollection.updateOne(
          { _id: new ObjectId(ideaId) },
          { $push: { comments: newComment } },
        );

        res.json({ success: true, comment: newComment });
      } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Failed to add comment" });
      }
    });

    // Route to delete comments
    app.delete("/ideas/:id/comments/:commentId", async (req, res) => {
      try {
        const { id, commentId } = req.params;

        const result = await ideaCollection.updateOne(
          { _id: new ObjectId(id) },
          { $pull: { comments: { commentId: commentId } } },
        );

        res.json({ success: true, result });
      } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Failed to delete comment" });
      }
    });

    // Comment edit/update route (PUT)

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
