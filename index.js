const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 5500;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');



//cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());


// middlewire
app.use(cors(
  {
      origin: ['http://localhost:5173', 'https://snapnews-ecc6b.web.app'],
      credentials:true
  }
));

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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");




    // collections
    const ArticlesCollection = client.db('Snap-News').collection('articles');
    const PublishersCollection = client.db('Snap-News').collection('publishers');
    const UsersCollection = client.db('Snap-News').collection('users');






    //jwt api

    app.post('/jwt', async (req, res) => {
      const user = req.body.curUser;
      const token = jwt.sign({ data: user }, process.env.access_token_secret, { expiresIn: '1h' });
      res.send(token);
    });

    // verify Token middleware

    const verifyToken = (req,res,next) => {

      if(!req.headers.authorization){
        return res.status(401).send({message: 'Forbidden Access..'})
      }
      
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.access_token_secret, (err, decoded)=>{
        if(err){
          return res.status(401).send({message: 'Forbidden Access..'})
        }

        req.decoded = decoded;
        console.log('varified')
        next();
      })

    }
    



    // service api
    app.post('/addArticles',verifyToken, async(req,res)=>{
        const article = req.body;
        
        const r = await ArticlesCollection.insertOne(article)
        res.send(r);

    })

    app.post('/addUser', async(req,res)=>{
        const user = req.body;
        
        const r = await UsersCollection.insertOne(user)
        res.send(r);

    })


    app.post('/addPublisher',verifyToken, async(req,res)=>{
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


    app.get('/getUser/:email',verifyToken, async(req,res)=>{
      const email = req.params.email;

      const query = { userEmail: email};
      const result =  await UsersCollection.findOne(query);

      res.send(result);
    })


    app.put('/updateUser/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;

      const query = { userEmail: email };
      const update = {
        $set: {
          premiumToken : updatedUser.premiumToken,
        },
      };
    
        const result = await UsersCollection.updateOne(query, update);
        res.send(result) 
    });


    app.put('/makeAdmin/:email',verifyToken, async(req,res)=>{
      const email = req.params.email;
      const role = req.body.role;
      
      const query = { userEmail: email };
      const update = {
        $set: {
          role : role,
        },
      };

      const result = await UsersCollection.updateOne(query, update);
      res.send(result) 

    })

    app.put('/updateUserInfo/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;
    
      const query = { userEmail: email };
      const update = {
        $set: {
          name: updatedUser.name,
          contactEmail: updatedUser.contactEmail,
          userImage:updatedUser.userImage,
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

    app.get('/getPremArticles',verifyToken, async (req, res) => {
      try {
        const query = ArticlesCollection.find({ premium: 'yes' });
        const articles = await query.toArray();
        res.send(articles);
      } catch (error) {
        console.error('Error fetching premium articles:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    

    app.get('/getarticle/:id', async(req,res)=>{
      const id = req.params.id;
      
      const query = { _id: new ObjectId(id)};
      const result =  await ArticlesCollection.findOne(query);

      res.send(result);

  })

  app.get('/getArticles/:email',verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = ArticlesCollection.find({ authorEmail: email });
      const articles = await query.toArray();
      res.send(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.put('/updateArticle/:id',verifyToken, async(req,res)=>{
    const id = req.params.id;
    const updatedArticle = req.body;
    const query = { _id: new ObjectId(id) };

    const update = {
      $set: {
        title: updatedArticle.title,
        publisher: updatedArticle.publisher,
        tags: updatedArticle.tags,
        description: updatedArticle.description,
        image: updatedArticle.image,
      }
    }

    const options = {upsert: true};


    const r = await ArticlesCollection.updateOne(query, update, options)
    res.send(r);
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


    app.delete('/delete/:id',verifyToken, async(req,res)=>{
      const id = req.params.id;
      
      const query = {_id: new ObjectId(id)};

      const result = await ArticlesCollection.deleteOne(query);
      res.send(result);

    })


    // Approve Post endpoint
    app.put('/approvePost/:id',verifyToken, async (req, res) => {
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
    app.put('/declinePost/:id',verifyToken, async (req, res) => {
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



    app.put('/makePremium/:id',verifyToken, async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

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