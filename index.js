const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 5500;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const { ObjectId } = require('mongodb');





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
    const UsersCollection = client.db('Snap-News').collection('users');




    // service api
    app.post('/addArticles', async(req,res)=>{
        const article = req.body;
        
        const r = await ArticlesCollection.insertOne(article)
        res.send(r);

    })

    app.post('/addUser', async(req,res)=>{
        const user = req.body;
        
        const r = await UsersCollection.insertOne(user)
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

    app.get('/getUsers', async(req,res)=>{
        const query = UsersCollection.find();
        const r = await query.toArray();
        res.send(r);
    })
    app.get('/getUser/:email', async(req,res)=>{
      const email = req.params.email;

      const query = { userEmail: email};
      const result =  await UsersCollection.findOne(query);

      res.send(result);
    })


    app.put('/updateUser/:email', async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;
    console.log(updatedUser)
      const query = { userEmail: email };
      const update = {
        $set: {
          premiumToken : updatedUser.premiumToken,
        },
      };
    
        const result = await UsersCollection.updateOne(query, update);
        res.send(result)

      
    });

    app.put('/updateUserInfo/:email', async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;
    
      const query = { userEmail: email };
      const update = {
        $set: {
          name: updatedUser.name,
          contactEmail: updatedUser.contactEmail,
          age: updatedUser.age,
          address: updatedUser.address,
          language: updatedUser.language,
          favoriteCategories: updatedUser.favoriteCategories,
        },
      };
    
      try {
        const result = await UsersCollection.updateOne(query, update);
        res.send(result);
      } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).send('Error updating user data');
      }
    });
    
    



    app.get('/getArticles', async(req,res)=>{
        const query = ArticlesCollection.find();
        const r = await query.toArray();
        res.send(r);
    })

    app.get('/getarticle/:id', async(req,res)=>{
      const id = req.params.id;
      
      const query = { _id: new ObjectId(id)};
      const result =  await ArticlesCollection.findOne(query);

      res.send(result);

  })

  app.post('/updateviews/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const query = { _id: new ObjectId(id) };
        const update = { $inc: { views: 1 } };
        const result = await ArticlesCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
            res.send({ message: 'View count updated' });
        } else {
            res.status(404).send({ message: 'Article not found or view count not updated' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error updating view count', error: error.message });
    }
  });


    app.delete('/delete/:id', async(req,res)=>{
      const id = req.params.id;
      
      const query = {_id: new ObjectId(id)};

      const result = await ArticlesCollection.deleteOne(query);
      res.send(result);

    })


    // Approve Post endpoint
    app.put('/approvePost/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;

      const updatedPost = {
        $set:{
          approval : data.approval
        }
      }
      const options = {upsert : true};
      const r = await ArticlesCollection.updateOne(query, updatedPost, options)
      res.send(r);

    });

    // Decline Post endpoint
    app.put('/declinePost/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;

      const updatedPost = {
        $set:{
          approval : data.approval
        }
      }
      const options = {upsert : true};
      const r = await ArticlesCollection.updateOne(query, updatedPost, options)
      res.send(r);

    });



    app.put('/makePremium/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // const data = req.body;

      const updatedPost = {
        $set:{
          premium : 'yes'
        }
      }

      const options = {upsert : true}
      const r = await ArticlesCollection.updateOne(query, updatedPost, options)
      res.send(r)
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