const bcrypt = require("bcrypt");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const generateToken = require("../utils/generateToken");


// SIGNUP
exports.signup = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      organizationName,
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
        "Name, email and password required",
      });
    }

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message:
        "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await User.create({
        name,
        email,
        password:
          hashedPassword,
      });

    let organization = null;

    // only create org if provided

    if (
      organizationName &&
      organizationName.trim()
    ) {

      organization =
      await Organization.create({

        name:
        organizationName.trim(),

        owner:
        user._id,

      });

      await Membership.create({

        user:
        user._id,

        organization:
        organization._id,

        role:
        "OWNER",

      });

    }

    const token =
      generateToken(user._id);

    const userData =
      user.toObject();

    delete userData.password;

    res.status(201).json({

      token,

      user:
      userData,

      organization,

    });

  }

  catch(error){

    res.status(500).json({

      message:
      "Signup failed",

      error:
      error.message,

    });

  }

};



//  LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

const memberships = await Membership.find({ user: user._id })
      .populate("organization")
      .select("organization role");


    const userData = user.toObject();
    delete userData.password;
    res.json({
      token,
      user: userData,
      organizations: memberships
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};