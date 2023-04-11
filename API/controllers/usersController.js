const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

//@desc Get all users
//@route GET /users
//@access Privates

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

//@desc Create all users
//@route POST /users
//@access Privates

const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  //confirm data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: "ALL FIELDS ARE A REQUIRE" });
  }
  // checking for duplicates
  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: "user already exists" });
  }
  //hash the password
  const hashedPwd = await bcrypt.hash(password, 10);

  const userObject = { username, password: hashedPwd, roles };
  // create and store the user object in the database
  const user = await User.create(userObject);
  if (user) {
    //user created
    res.status(201).json({ message: `USER CREATED SUCCESSFULLY ${username}` });
  } else {
    res.status(400).json({ message: "invalid user data." });
  }
});

//@desc update a users
//@route PATCH /users
//@access Privates

const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;
  //confirm data
  if (
    !username ||
    !id ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "ALL FIELDS ARE A REQUIRE" });
  }
  // grab the user document with methods as you can see we did not use lean() here
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(404).json({ message: "USER NOT FOUND" });
  }
  // check for a duplicate
  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "user already exists" });
  }
  //resign user
  user.username = username;
  user.roles = roles;
  user.active = active;
  if (password) {
    //hash again
    user.password = await bcrypt.hash(password, 10); //10 salting rounds ;
  }
  //save worked because we did not use lean() here
  const updatedUser = await user.save();
  res.json({ message: `${updatedUser.username} is now updated` });
});

//@desc delete a users
//@route DELETE /users
//@access Privates

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "User ID required" });
  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "User has assigned note" });
  }
  const user = await User.findById(id).exec();
  if (!user) return res.status(400).json({ message: "User Not Found" });
  const result = await user.deleteOne();
  const reply = `Username ${result.username} With ID ${result._id} was successfully deleted`;
  res.json(reply );
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
