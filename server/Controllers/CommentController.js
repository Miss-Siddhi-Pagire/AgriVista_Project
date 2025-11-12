const CommentModel = require('../Models/CommentModel');

module.exports.Comment = async (req, res, next) => {
    const { content, postId, creatorname, creatorId } = req.body;

  try {
    // Create a new instance of the Comment model
    const newComment = new CommentModel({
      content,
      postId,
      creatorname,
      creatorId,
    });

    // Save the new comment to the database
    await newComment.save();

    // Respond with success message
    res.status(201).json({ message: "Replied successfully", comment: newComment });
  } catch (error) {
    // Handle errors
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports.Commentfetch = async (req, res) => {
  const { postId } = req.query; // ✅ use ?postId=
  console.log("postId received:", postId);
  try {
    const comments = await CommentModel.find({ postId });
    res.status(200).json({ status: true, comments });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports.UpdateComment = async (req, res) => {
  const { postId, content } = req.body;
  try {
      // Find the post by ID and update its heading and content
      const updatedComment = await CommentModel .findByIdAndUpdate(
          postId,
          { content },
          { new: true } 
      );
      if (!updatedComment) {
          return res.status(280).json({ message: 'Post not found' });
      }

      res.status(200).json({ status:true, message: 'Comment updated successfully', post: updatedComment });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.DeleteComment = async (req, res, next) => {
  const { commentId } = req.query;

  try {
    // Find the comment by its ID and delete it
    const deletedComment = await CommentModel.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully", deletedComment });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};