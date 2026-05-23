const Project = require("../models/Project");
const Activity = require("../models/Activity");

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      organization: req.organizationId,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await Activity.create({
      organization: req.organizationId,
      project: project._id,
      user: req.user._id,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: project._id,
      after: { name: project.name },
    });

    res.status(201).json(project);

  } catch (error) {
    res.status(500).json({ message: "Create project failed", error });
  }
};


// GET ALL PROJECTS (org scoped)
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      organization: req.organizationId,
    }).populate("createdBy", "name email");

    res.json(projects);

  } catch (error) {
    res.status(500).json({ message: "Fetch projects failed", error });
  }
};