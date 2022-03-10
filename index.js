
const express = require('express')
const { MongoClient, ObjectId } = require('mongodb');
const stripe = require('stripe')("sk_test_51KUf9fENSw6iH46SRaIxsXtJCZlLDtvZGq43s2Wslv1Sb8FdJBXwd8YTWX8NKvtMXMjNsvWqmn6vL5IRro5DK5sE0087QIGvBd");
const admin = require("firebase-admin");
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require("./config/digital-dudes-agency-firebase-adminsdk-3vu5v-2c25ae7dab(1).json");

const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express()
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 5000

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@digitaldudes.mq05e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const servicesCollection = client.db(process.env.DB_NAME).collection("services");
  const adminsCollection = client.db(process.env.DB_NAME).collection("admins");
  const reviewsCollection = client.db(process.env.DB_NAME).collection("reviews");
  const pricingCollection = client.db(process.env.DB_NAME).collection("pricing");
  const subscriptedUsersCollection = client.db(process.env.DB_NAME).collection("subscriptedUsers");

  app.post("/addService", (req, res) => {
    servicesCollection.insertOne(req.body)
      .then(result => {
        res.send(result);
      })
  })

  app.get("/services", (req, res) => {
    servicesCollection.find()
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.get("/serviceById/:id", (req, res) => {
    servicesCollection.find({ _id: ObjectId(req.params.id) })
      .toArray((err, doc) => {
        res.send(doc[0])
      })
  })

  app.delete("/deleteService/:id", (req, res) => {
    servicesCollection.findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result)
      })
  })

  app.patch("/updateService/:id", (req, res) => {
    servicesCollection.findOneAndUpdate({ _id: ObjectId(req.params.id) }, {
      $set: {
        serviceName: req.body.serviceName,
        serviceDescription: req.body.serviceDescription,
        serviceThumbnail: req.body.serviceThumbnail
      }
    })
      .then((result) => {
        res.send(result)
      })
  })

  app.post("/addAdmin", (req, res) => {
    adminsCollection.insertOne(req.body)
      .then(result => {
        res.send(result);
      })
  })

  app.get("/admins", (req, res) => {
    adminsCollection.find()
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.get("/admins/:email", (req, res) => {
    adminsCollection.find({ adminEmail: req.params.email })
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.delete("/deleteAdmin/:id", (req, res) => {
    adminsCollection.findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then((err, result) => {
        res.send(result)
      })
  })

  app.post("/addReview", (req, res) => {
    reviewsCollection.insertOne(req.body)
      .then(result => {
        res.send(result)
      })
  })

  app.get("/reviews", (req, res) => {
    reviewsCollection.find()
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.post("/addPricing", (req, res) => {
    pricingCollection.insertOne(req.body)
      .then(result => {
        res.send(result)
      })
  })

  app.get("/pricing", (req, res) => {
    pricingCollection.find()
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.get("/pricing/:id", (req, res) => {
    pricingCollection.find({ _id: ObjectId(req.params.id) })
      .toArray((err, doc) => {
        res.send(doc[0])
      })
  })

  app.patch("/updatePricing/:id", (req, res) => {
    pricingCollection.findOneAndUpdate({ _id: ObjectId(req.params.id) }, {
      $set: {
        pricingTitle: req.body.pricingTitle,
        pricingValue: req.body.pricingValue,
        services: req.body.services,
      }
    })
      .then(result => {
        res.send(result)
      })
  })

  app.post("/create-payment-intent", async (req, res) => {
    const paymentInfo = req.body.pricingValue;
    const amount = paymentInfo;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"]
    })
    res.send({ clientSecret: paymentIntent.client_secret })
  })

  app.post("/addSubscriptedUser", (req, res) => {
    const paymentDetails = req.body;
    subscriptedUsersCollection.insertOne(paymentDetails)
      .then(result => {
        res.send(result)
      })
  })

  app.get("/subscriptedUser", (req, res) => {
    subscriptedUsersCollection.find()
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.get("/subscriptedUser/:email", (req, res) => {
    const email = req.params.email;
    const idToken = req.headers.authorization;
    getAuth().verifyIdToken(idToken)
      .then((decodedToken) => {
        const deCodedEmail = decodedToken.email;
        if (email === deCodedEmail) {
          subscriptedUsersCollection.find({ email: email })
            .toArray((err, doc) => {
              res.send(doc[0])
            })
        }
      })
      .catch((error) => {
        console.log(error)
      });
  })

  app.put("/subscriptedUserNewPlan/:id", (req, res) => {
    const newSubscriptionDetail = req.body;
    subscriptedUsersCollection.findOneAndReplace({ _id: ObjectId(req.params.id) }, newSubscriptionDetail)
      .then(result => {
        res.send(result)
      })
  })

  app.delete("/deleteSubscription/:id", (req, res) => {
    subscriptedUsersCollection.findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result)
      })
  })
});

app.get('/', (req, res) => {
  res.send("Hellooooooooooooo World! i'm your dudes")
})

app.listen(port)
