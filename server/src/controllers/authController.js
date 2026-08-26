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
    let memberRole = "VIEWER";

    if (organizationName && organizationName.trim()) {
      const orgNameTrimmed = organizationName.trim();

      const escaped = orgNameTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const existingOrg = await Organization.findOne({
        name: { $regex: `^${escaped}$`, $options: "i" },
      });

      if (existingOrg) {
        organization = existingOrg;
        memberRole = "VIEWER";
        await Membership.create({
          user: user._id,
          organization: organization._id,
          role: memberRole,
        });
      } else {
        organization = await Organization.create({
          name: orgNameTrimmed,
          owner: user._id,
        });
        memberRole = "OWNER";

        await Membership.create({
          user: user._id,
          organization: organization._id,
          role: memberRole,
        });
      }
    }

    const token = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    const orgPayload = organization
      ? {
          ...(organization.toObject ? organization.toObject() : organization),
          role: memberRole,
        }
      : null;

    res.status(201).json({
      token,
      user: userData,
      organization: orgPayload,
      organizations: organization ? [{ organization: orgPayload, role: memberRole }] : [],
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