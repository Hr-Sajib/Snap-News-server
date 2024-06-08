const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 5500;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()



// middlewire
app.use(cors())
app.use(express.json());

app.get('/', (req,res)=>{
    res.send("server running ..")
})





const uri = `mongodb+srv://${process.env.db_name}:${process.env.db_pass}@cluster-sajib.cqfdgne.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Sajib`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");




    // collections
    const ArticlesCollection = client.db('Snap-News').collection('articles');
    const PublishersCollection = client.db('Snap-News').collection('publishers');




    // service api 

    app.post('/addArticles', async(req,res)=>{
        const article = req.body;
        
        const r = await ArticlesCollection.insertOne(article)
        res.send(r);

    })


    app.post('/addPublisher', async(req,res)=>{
        const pub = req.body;
        
        const r = await PublishersCollection.insertOne(pub)
        res.send(r);

    })

    app.get('/getPublishers', async(req,res)=>{
        const query = PublishersCollection.find();
        const r = await query.toArray();
        res.send(r);
    })

    app.get('/getArticles', async(req,res)=>{
        const query = ArticlesCollection.find();
        const r = await query.toArray();
        res.send(r);
    })


    app.get('/getSearchedArticles/:text', async(req,res)=>
    {
      try{
        const searchText = req.params.text;
        
        const query = {
          $or : [
            { title: { $regex: searchText, $options: 'i' } }, 
            { description: { $regex: searchText, $options: 'i' } }, 
          ]
        }

        const cursor = ArticlesCollection.find(query);
        const r = await cursor.toArray();

        res.send(r);
      }
      catch(error){
        console.error("Error searching for blogs:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    })

    



















  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, ()=>{
    console.log(`Snapnews server runnning on ${port}`);
})