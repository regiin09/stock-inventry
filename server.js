const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

// Making connection
var mysql = require('mysql');
var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "R&sM^9h9RxXq3%",
  database: "stock_inventory"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { sellerId, password } = req.body;
  const query1 = 'SELECT * FROM users WHERE id = ? AND password = ?';
  con.query(query1, [sellerId, password], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Server error');
    } else if (results.length > 0) {
      const loginId = results[0].id;
      res.redirect(`/stock?loginId=${loginId}`);
    } else {
      res.status(401).send('Invalid seller ID or password');
    }
  });
  console.log("Received request payload:", req.body);
});

app.get('/stock', (req, res) => {
  // Fetch stock items from the database or any other source
  const query = 'SELECT idstock, item, remaining, units FROM stock';
  con.query(query, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Server error');
    } else {
      const stockItems = results;
      const { loginId } = req.query;
      const sellerName = loginId;

      res.render('stock', { sellerName, stockItems });
    }
  });
});



app.post('/order', (req, res) => {
  const orderItems = Object.keys(req.body)
    .filter(key => key.startsWith('quantity_'))
    .map(key => ({
      itemName: req.body[`itemName_${key.split('_')[1]}`],
      quantity: req.body[key]
    }));

  orderItems.forEach(order => {
    const { itemName, quantity } = order;
    if (!quantity) {
      console.log('Invalid quantity for item:', itemName);
      return;
    }

    const updateQuery = 'UPDATE stock SET remaining = remaining - ? WHERE item = ?';
    const insertQuery = 'UPDATE orders SET quantity = quantity + ? WHERE item = ?';

    con.query(updateQuery, [quantity, itemName], (error, result) => {
      if (error) {
        console.log(error);
      }
    });

    con.query(insertQuery, [quantity, itemName], (error, result) => {
      if (error) {
        console.log(error);
      }
    });
  });

  console.log(orderItems); // Output the modified payload in the console

  res.redirect('/ordered');
});

app.get('/ordered', (req, res) => {
  // Fetch ordered items from the 'orders' table
  const query = 'SELECT * FROM orders';
  con.query(query, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Server error');
    } else {
      const orderedItems = results;
      res.render('ordered', { orderedItems });
    }
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});