const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const password_hash = require('password-hash');
const admin = require("firebase-admin");
const serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = admin.firestore();


app.get('/', function (req, res) {
  res.sendFile(__dirname + "/public/Dashboard.html");
});

app.get('/login', function (req, res) {
  res.sendFile(__dirname + "/public/login_1.html");
});

app.get('/signup', function (req, res) {
  res.sendFile(__dirname + '/public/registration_form.html');
});

// Rest of your code...
app.get('/GetStock',function(req,res){
  res.sendFile(__dirname + '/stock.html')
})




app.get('/StockInfo', function(req, res) {
  const symbol = req.query.stock_name;

  // Check if the symbol is provided
  if (!symbol) {
      res.send('Stock symbol is required.');
      return;
  }

  const apiKey = 'J62UXNKFK6GXKNDD';
  const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  request(apiUrl, function (error, response, body) {
      if (error) {
          console.error('Error in API Request:', error);
          res.send('Error in API Request');
          return;
      }

      const responseData = JSON.parse(body);

      // Check if the API response indicates success
      if (responseData['Global Quote']) {
          const stockDetails = {
              Symbol: responseData['Global Quote']['01. symbol'],
              Price: responseData['Global Quote']['05. price'],
              HighPrice: responseData['Global Quote']['03. high'],
              LowPrice: responseData['Global Quote']['04. low']
          };
          res.render('stock_info', stockDetails);
      } else {
          res.send('Stock not found or API response format changed.');
      }
  });
});
app.post('/registersubmit',async(req,res) =>{
    
    const name = req.body.name
    const email =req.body.mail
    const Password = req.body.pswd
    try{
        const hashedpassword = password_hash.generate(Password);
        db.collection("vishnu_ir")
      .where("email", "==", email)
      .get()
      .then((docs) => {
        if (docs.size >= 1) {
          res.json({
            error: "Email is already in use. Please use a different email",
          });
        } else {
          db.collection("Stock")
            .add({
              UserName: name,
              Email: email,
              Password: hashedpassword,
            })
            .then(() => {
              res.send({
                message: "Successfully signed up. You have created an account.",
              });
            });
        }
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/loginsubmit", async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    try {
      db.collection("Stock")
        .where("Email", "==", email)
        .get()
        .then((docs) => {
          if (docs.size >= 1) {
            docs.forEach((doc)=>{
                if (password_hash.verify(password, doc.data().Password)) {
                  res.sendFile(__dirname + '/public/home_page.html')
                } 
                else {
                    res.json({ error: "Please enter a valid email or password" });
                }
            })
            
          } else {
            res.json({ error: "Please enter a valid email and password" });
          }
        });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
        
  const PORT = 3000;
  app.listen(PORT, function () {
    console.log(`Hey, server started at port ${PORT}`);
  });       


// const PORT = 3000;
// app.listen(PORT, function () {
//     console.log(`Hey, server started at port ${PORT}`);
// });
