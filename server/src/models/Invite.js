const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
{
    email:{
        type:String,
        required:true,
    },

    organization:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Organization",
        required:true,
    },

    role:{
        type:String,

        enum:[
            "ADMIN",
            "MANAGER",
            "DEVELOPER",
            "VIEWER",
        ],

        required:true,
    },

    invitedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    token:{
        type:String,
        required:true,
        unique:true,
    },

    status:{
        type:String,

        enum:[
            "PENDING",
            "ACCEPTED",
            "EXPIRED",
        ],

        default:"PENDING",
    },

    expiresAt:{
        type:Date,
        required:true,
    },

},
{
    timestamps:true,
}
);

module.exports=
mongoose.model(
"Invite",
inviteSchema
);