const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { Menu } = require("./models/menu");
const { Review } = require("./models/review");
const { Cart } = require("./models/cart");
const { User } = require("./models/user");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());

//!-------------JWT start

app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "24h" });
  res.send({ token });
});

//!-------------JWT ends

//!------------- JWT VerifyToken middleware start

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
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

app.get("/", (req, res) => {
  res.send("Route is working");
});

app.get("/menu", async (req, res) => {
  const result = await Menu.find({});
  res.send(result);
});

app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
  const data = req.body;
  const result = await Menu.create(data);
  res.send(result);
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

app.patch("/users/admin/:id", async (req, res) => {
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

app.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const query = { _id: userId };
  const result = await User.deleteOne(query);
  res.send(result);
});

app.delete("/users", async (req, res) => {
  const result = await User.deleteMany({});
  res.send(result);
});

app.get("/carts", async (req, res) => {
  const result = await Cart.find({});
  res.send(result);
});

app.post("/carts", async (req, res) => {
  const data = req.body;
  const newCartItem = new Cart(data);
  const result = await newCartItem.save();
  res.send(result);
});

app.delete("/carts/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: id };
  const result = await Cart.deleteOne(query);
  res.send(result);
});

module.exports = app;
