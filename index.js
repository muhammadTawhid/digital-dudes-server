
const express = require('express')
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express()
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 5000



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@digitaldudes.mq05e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const servicesCollection = client.db(process.env.DB_NAME).collection("services");

  app.post("/addService", (req, res) => {
    servicesCollection.insertOne(req.body)
      .then(res => {
        console.log(res);
      })
  })

  app.get("/services", (req, res) => {
    servicesCollection.find()
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.delete("/deleteService/:id", (req, res) => {
    console.log(req.params.id); //{_id:ObjectID`${req.params.id}`}
    // const uid = req.params.id
    servicesCollection.findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result)
        console.log(result);
      })
  })
});

app.get('/', (req, res) => {
  res.send('Hellooooooo World!')
})

app.listen(port)
