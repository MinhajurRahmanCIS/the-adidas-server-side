require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function createToken(user) {
    const token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
    return token;
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).send("You are not authorized");
    }
    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify.email;
        next();
    } catch (err) {
        return res.status(403).send("You are not authorized");
    }
}

const uri = process.env.DATABASE;
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

        app.get("/shoes", async (req, res) => {
            const shoesData = shoesCollection.find();
            const result = await shoesData.toArray();
            res.send(result);
        });

        app.get("/shoes/:id", async (req, res) => {
            const id = req.params.id;
            const shoesData = await shoesCollection.findOne({ _id: new ObjectId(id) });
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
            const result = await userCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
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
            const isUserExist = await userCollection.findOne({ email: user.email });
            if (isUserExist) {
                return res.send({
                    status: "success",
                    message: "Login success",
                    token,
                });
            }
            await userCollection.insertOne(user);
            res.send({ token });
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
            res.send(result);
        });

        console.log("The adidas server is successfully connected to MongoDB!");
    } finally {
        // Uncomment the following line if you want to close the connection after finishing
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("The Adidas Server is running!");
});

app.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
});
