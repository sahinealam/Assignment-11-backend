const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const stripe =require("stripe")(process.env.STRIPE_SECATE);
const crypto=require("crypto")
// const port =3000;
app.use(cors());
app.use(express.json());
const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8",
);
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFBToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  try {
    const idToken = token.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decodedToken);
    req.decoded_Email = decodedToken.email;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

const e = require("express");
const uri =
  "mongodb+srv://assingment-11:2nZFbx8h_BssrPz@cluster0.qmqsv1k.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("assingment11");
    const usersCollection = database.collection("users");
    const requestCollection = database.collection("request");

    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      userInfo.createdAt = new Date();
      userInfo.role = "doner";
      userInfo.status = "active";
      const result = await usersCollection.insertOne(userInfo);
      res.send(result);
    });

    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      console.log(result);
      res.send({ role: result?.role });
    });

    app.patch("/update/user/status", verifyFBToken, async (req, res) => {
      const { email, status } = req.query;
      const query = { email: email };

      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await usersCollection.updateOne(query, updateStatus);
      res.send(result);
    });

    app.get("/users", verifyFBToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.status(200).send(result);
    });
    // product
    app.post("/request", verifyFBToken, async (req, res) => {
      const data = req.body;
      data.createdAt = new Date();
      const result = await requestCollection.insertOne(data);
      res.send(result);
    });

    // // myuser requset
    app.get("/myrequest", verifyFBToken, async (req, res) => {
      const email = req.decoded_Email;
      const size = Number(req.query.size);
      const page = Number(req.query.page);
      const skip = Number(req.query.skip);
      console.log("useremail:", email);
      const query = { requesterEmail: email };
      // console.log(query)
      const result = await requestCollection
        .find()
        .limit(size)
        .skip(size * page)
        .toArray();
      const totalRequest = await requestCollection.countDocuments();
      res.send({ requests: result, total: totalRequest });
    });

    // payments
    app.post('/create-payment-intent',async(req,res)=>{
      
    })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  res.send("Hello, Developer Sahine");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
