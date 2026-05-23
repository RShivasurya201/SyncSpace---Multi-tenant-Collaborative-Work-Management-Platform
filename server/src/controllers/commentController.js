const Task = require("../models/Task");
const Activity = require("../models/Activity");

const {
  generateBlockerInfo,
} = require("../services/blockerService");

exports.addComment = async (req,res)=>{

  try{

    const { text } = req.body;

    const task =
      await Task.findOne({

        _id:req.params.taskId,

        organization:
          req.organizationId,

      });

    if(!task){

      return res
      .status(404)
      .json({
        message:
        "Task not found",
      });

    }

    const comment = {

      user:req.user._id,

      text,

    };

    task.comments.push(comment);

    // only generate blocker
    // if blocked

    if(task.isBlocked){

      const blockerInfo = await generateBlockerInfo(
        task.comments
      );

      task.blockerSummary =
        blockerInfo.summary;

      task.blockerType =
        blockerInfo.type;

    }

    await task.save();

    await Activity.create({

      organization:
        req.organizationId,

      project:
        task.project,

      user:
        req.user._id,

      action:
        "COMMENT_ADDED",

      entityType:
        "TASK",

      entityId:
        task._id,

      after:{
        comment:text
      }

    });

    res.json(task);

  }

  catch(error){

    res.status(500)
    .json({

      message:
      "Comment failed",

      error:
      error.message,

    });

  }

}

exports.toggleBlocked =
async(req,res)=>{

try{

const task =
await Task.findOne({

 _id:
 req.params.taskId,

 organization:
 req.organizationId,

});

if(!task){

return res
.status(404)
.json({

message:
"Task not found",

});

}

task.isBlocked =
!task.isBlocked;

if(task.isBlocked){

 const blockerInfo = await generateBlockerInfo(
 task.comments
 );

 task.blockerSummary=
 blockerInfo.summary;

 task.blockerType=
 blockerInfo.type;

}

else{

task.blockerSummary="";

task.blockerType=
"OTHER";

}

await task.save();

res.json(task);

}

catch(error){

res.status(500)
.json({

message:
"Toggle failed",

error:
error.message,

});

}

}