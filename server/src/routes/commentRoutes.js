const express =
require("express");

const router=
express.Router();

const authMiddleware=
require("../middleware/authMiddleware");

const orgMiddleware=
require("../middleware/orgMiddleware");

const {

addComment,

toggleBlocked,

}=
require(
"../controllers/commentController"
);

router.post(

"/:taskId",

authMiddleware,

orgMiddleware,

addComment

);

router.patch(

"/:taskId/block",

authMiddleware,

orgMiddleware,

toggleBlocked

);

module.exports=
router;