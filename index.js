require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


function createToken(user) {
    const token = jwt.sign(
      {
        email: user.email,
      },
      "secret",
      { expiresIn: "30d" }
    );
    return token;
  }

function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, "secret");
    if (!verify?.email) {
        return res.send("You are not authorized");
    }
    req.user = verify.email;
    next();
};

const uri = process.env.DATABASE;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        await client.connect();

        const productDB = client.db("shoesDB");
        const shoesCollection = productDB.collection("shoesCollection");
        const userCollection = productDB.collection("userCollection");
        // product

        app.get("/shoes", async (req, res) => {
            const shoesData = shoesCollection.find();
            const result = await shoesData.toArray();
            res.send(result);
        });

        app.get("/shoes/:id", async (req, res) => {
            const id = req.params.id;
            const shoesData = await shoesCollection.findOne({
                _id: new ObjectId(id),
            });
            res.send(shoesData);
        });

        app.post("/shoes", verifyToken, async (req, res) => {
            const shoesData = req.body;
            const result = await shoesCollection.insertOne(shoesData);
            res.send(result);
        });

        app.patch("/shoes/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await shoesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.send(result);
        });

        app.delete("/shoes/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await shoesCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });


        app.get("/user/get/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await userCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const result = await userCollection.findOne({ email });
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.post("/user", async (req, res) => {
            const user = req.body;

            const token = createToken(user);
            const isUserExist = await userCollection.findOne({ email: user?.email });
            if (isUserExist?._id) {
                return res.send({
                    status: "success",
                    message: "Login success",
                    token,
                });
            }
            await userCollection.insertOne(user);
            return res.send({ token });
        });

        app.patch("/user/:email", async (req, res) => {
            const email = req.params.email;
            const userData = req.body;
            const result = await userCollection.updateOne(
                { email },
                { $set: userData },
                { upsert: true }
            );
            res.send(result);
        });

        app.patch("/userInformation/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await userCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            console.log(result)
            res.send(result);
        });

        console.log("The adidas server is successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("The Adidas Server is running!");
});

app.listen(PORT, (req, res) => {
    console.log("Server is running on port :", PORT);
});