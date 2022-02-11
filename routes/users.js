const router = require("express").Router();
const Users = require("./../models/User.model");
const mongoose = require("mongoose");
const uploader = require("./../config/cloudinary.config");
const protecRoute = require("./../middlewares/protectRoute");
const UserModel = require("./../models/User.model");
const isAuthenticated = require("./../middlewares/jwt.middleware");
const jwt = require("jsonwebtoken");

router.get("/", isAuthenticated, (req, res, next) => {
  const role = req.payload.role;
  if (role[0] === "family") {
    Users.find({ role: { $eq: "nanny" } })
      .then((users) => res.status(200).json({ users }))
      .catch(next);
  } else if (role[0] === "nanny") {
    Users.find({ role: { $eq: "family" } })
      .then((users) => res.status(200).json({ users }))
      .catch(next);
  }
});

// UPDATING PROFILE
router.patch("/:id", uploader.single("picture"), async (req, res, next) => {
  try {
    console.log(req.body, req.params.id, ">>>>> UPDATE USER DATA + ID BACK");
    const newUser = { ...req.body };
    if (newUser.numberOfKids === "undefined") newUser.numberOfKids = 0;
    if (req.file) {
      newUser.picture = req.file.path;
    } else {
      delete newUser.picture;
    }
    const updatedUser = await Users.findByIdAndUpdate(req.params.id, newUser, {
      new: true,
    });
    const user = updatedUser.toObject();
    delete user.password;
    const authToken = jwt.sign(user, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "2d",
    });

    //! Sending the authToken to the client !

    res.status(200).json({ authToken });
    //res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", isAuthenticated, async (req, res, next) => {
  console.log("req, params", req.params);
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    console.log(deletedUser);
    res.status(204).json(deletedUser);
  } catch (err) {
    next(err);
  }
});

// TO FETCH AVAILABILITIES
router.get("/availabilities", async (req, res, next) => {
  try {
    const availabilityList = await Users.schema.path("availability").enumValues;
    // console.log(availabilityList, '>>>>> AVAILABILITY LIST HERE')
    res.status(200).json(availabilityList);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
