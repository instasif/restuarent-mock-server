const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { Menu } = require("./models/menu");
const { Review } = require("./models/review");
const { Cart } = require("./models/cart");
const { User } = require("./models/user");
const { Payment } = require("./models/Payment");

app.use(express.json());
app.use(cors());

/*
app.post("/all-menu", async (req, res) => {
  try {
    const data = req.body; // Corrected typo
    const result = await Menu.insertMany(data); // Insert multiple documents
    res.status(201).send(result); // Send a 201 status for created resources
  } catch (error) {
    res.status(400).send(error); // Send appropriate status and error message
  }
});

app.delete("/all-menu", async(req, res) =>{
  const result = await Payment.deleteMany({});
  res.send(result)
})
  */

//?-------------Payment start
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { price } = req.body;

    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).send({ error: "Invalid price amount." });
    }

    const amount = Math.round(price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).send({ error: "Payment failed. Please try again." });
  }
});

//?-------------Payment end

//!-------------JWT start
const jwt = require("jsonwebtoken");

app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "24h" });
  res.send({ token });
});

//!-------------JWT ends

//!------------- JWT VerifyToken middleware start

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

//!------------- JWT VerifyToken middleware end

//!------------- verifyAdmin middleware start

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const user = await User.findOne({ email: email });
  let isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

//!------------- verifyAdmin middleware end

//!----------------------admin home stats api starts

//stats or analytics
app.get("/admin-stats", verifyToken, verifyAdmin, async (req, res) => {
  const users = await User.estimatedDocumentCount();
  const menuItems = await Menu.estimatedDocumentCount();
  const orders = await Payment.estimatedDocumentCount();

  //? this not a best practice
  // const payments = await Payment.find({});
  // const revenue = payments.reduce(
  //   (total, payment) => +payment.price + total,
  //   0
  // );

  const revenuePipeline = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$price",
        },
      },
    },
  ]);
  const revenue = revenuePipeline.length > 0 ? revenuePipeline[0] : 0;
  res.send({ users, menuItems, orders, revenue });
});

app.get("/order-stats", verifyToken, verifyAdmin, async (req, res) => {
  const orderPipeline = await Payment.aggregate([
    {
      $unwind: "$menuIds", //?splits the array into separate documents
    },
    {
      $lookup: {
        from: "menus",
        localField: "menuIds",
        foreignField: "_id",
        as: "menuItems",
      },
    },
    {
      $unwind: "$menuItems", //? unwind the menuItems
    },
    {
      $group: {
        _id: "$menuItems.category",
        quantity: { $sum: 1 },
        revenue: { $sum: "$menuItems.price" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        quantity: "$quantity",
        revenue: "$revenue",
      },
    },
  ]);
  res.send(orderPipeline);
});

//!----------------------admin home stats api ends

app.get("/payments", async (req, res) => {
  // console.log(req.decoded.email);
  const email = req.query.email;
  const query = { email: email };
  // if (email !== req.decoded.email) {
  //   res.status(423).send({ message: "forbidden access" });
  // }
  const result = await Payment.find(query);
  res.send(result);
});

app.post("/payments", verifyToken, async (req, res) => {
  const payment = req.body;
  const savePayment = new Payment(payment);
  const paymentResult = await savePayment.save();

  //todo: delete each item from the cart
  const query = {
    _id: {
      $in: payment.cartIds.map((id) => id),
    },
  };

  const deleteResult = await Cart.deleteMany(query);
  res.send({ paymentResult, deleteResult });
});

app.get("/", (req, res) => {
  res.send("Route is working");
});

app.get("/menu", async (req, res) => {
  const result = await Menu.find({});
  res.send(result);
});

app.get("/menu/:id", async (req, res) => {
  const id = req.params.id;
  const result = await Menu.findOne({ _id: id });
  res.send(result);
});

app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
  const data = req.body;
  const result = await Menu.create(data);
  res.send(result);
});

app.patch("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: id };
  const item = req.body;
  const updatedDoc = {
    $set: {
      name: item.name,
      category: item.category,
      recipe: item.recipe,
      price: item.price,
      image: item.image,
    },
  };
  console.log(updatedDoc);
  const result = await Menu.updateOne(filter, updatedDoc);
  res.send(result);
});

app.delete("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const menuId = req.params.id;
    const item = await Menu.findOne({ _id: menuId });
    if (!item) {
      return res.status(404).send({ message: "Menu item not found" });
    }
    const result = await Menu.deleteOne({ _id: menuId });
    res.send({ message: "Menu item deleted", result });
  } catch (error) {
    res.status(500).send({ message: "Error deleting menu item", error });
  }
});

app.get("/review", async (req, res) => {
  const result = await Review.find({});
  res.send(result);
});

app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const result = await User.find({});
  res.send(result);
});

app.get("/users/admin/:email", verifyToken, async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const query = { email: email };
  const user = await User.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === "admin";
  }
  res.send({ admin });
});

app.post("/users", async (req, res) => {
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await User.findOne(query);
  if (existingUser) {
    return res.send({ message: "user already exists" });
  }
  const newUser = new User(user);
  const result = await newUser.save();
  res.send(result);
});

app.patch("/users/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
  const userId = req.params.id;
  const filter = { _id: userId };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await User.updateOne(filter, updatedDoc, options);
  res.send(result);
});

app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const userId = req.params.id;
  const query = { _id: userId };
  const result = await User.deleteOne(query);
  res.send(result);
});

app.delete("/users", verifyToken, verifyAdmin, async (req, res) => {
  const result = await User.deleteMany({});
  res.send(result);
});

app.get("/carts", verifyToken, async (req, res) => {
  const email = req.query.email;
  const result = await Cart.find({ email: email });
  res.send(result);
});

app.get("/carts", verifyToken, async (req, res) => {
  const result = await Cart.find({});
  res.send(result);
});

app.post("/carts", verifyToken, async (req, res) => {
  const data = req.body;
  const newCartItem = new Cart(data);
  const result = await newCartItem.save();
  res.send(result);
});

app.delete("/carts/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: id };
  const result = await Cart.deleteOne(query);
  res.send(result);
});

module.exports = app;
