const PostModel = require('../Models/PostModel');
const CommentModel = require('../Models/CommentModel');

module.exports.Post = async (req, res, next) => {
    const { heading, content, creatorname, creatorId } = req.body;

    if (!heading || !content) {
        return res.status(201).json({ message: 'Please fill all the fields' })
    }

    if (!creatorname || !creatorId) {
        return res.status(201).json({ message: 'Internal server error, please try again later!' })
    }

    try {
        const image = req.file ? `/uploads/${req.file.filename}` : "";
        const post = await PostModel.create({
            heading,
            content,
            creatorname,
            creatorId,
            image,
        });
        res.status(201).json({ message: 'Post created successfully' });
        next();

    } catch (error) {
        console.error(error);
    }
}

module.exports.Postfetch = async (req, res, next) => {
    try {
        // Fetch posts with comment counts
        const posts = await PostModel.aggregate([
            {
                $lookup: {
                    from: "comments", // Collection name for comments
                    localField: "_id", // Post ID in PostModel (ObjectId)
                    foreignField: "postId", // Post ID in CommentModel (String currently)
                    as: "comments"
                }
            },
            {
                $addFields: {
                    commentsCount: { $size: "$comments" },
                    // Converting _id back to object if needed or keeping it (aggregate returns POJO)
                }
            },
            {
                $project: {
                    comments: 0 // Remove the actual comments array to keep payload light
                }
            }
        ]);

        // Populate profile photo manually or via another lookup if needed, 
        // but for now, let's just get the posts. 
        // Note: foreignField in lookup matches the string/ObjectId type. 
        // If PostModel._id is ObjectId and CommentModel.postId is String, lookup might fail without conversion.
        // Let's check CommentModel definition. It says postId: { type: String }.
        // We need to convert Post _id to string for lookup to work, OR ensure consistency.
        // Since improving schema is risky now, let's try a simpler approach if lookup fails.
        // Actually, $toString on _id might be needed.

        // Revised aggregation for type mismatch safety:
        const socialPosts = await PostModel.aggregate([
            {
                $addFields: {
                    postIdString: { $toString: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "postIdString",
                    foreignField: "postId",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { creatorIdStr: "$creatorId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [{ $toString: "$_id" }, "$$creatorIdStr"]
                                }
                            }
                        }
                    ],
                    as: "creatorDetails"
                }
            },
            {
                $addFields: {
                    commentsCount: { $size: "$comments" },
                    profilePhoto: { $arrayElemAt: ["$creatorDetails.profilePhoto", 0] }
                }
            },
            {
                $project: {
                    comments: 0,
                    postIdString: 0,
                    creatorDetails: 0
                }
            }
        ]);


        res.status(200).json({ posts: socialPosts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports.LikePost = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const post = await PostModel.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const isLiked = post.likes.includes(userId);

        const updatedPost = await PostModel.findByIdAndUpdate(
            id,
            isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

module.exports.PostId = async (req, res, next) => {
    const { postId } = req.query;
    try {
        // Fetch post to check existence
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.json({ message: 'This Post no longer exists or the link is invalid.' })
        }

        // Count comments
        const commentsCount = await CommentModel.countDocuments({ postId: postId });

        // populate checking if creatorId matches user
        // But for now, just return the document with added fields

        res.status(200).json({
            status: true,
            _id: post._id,
            heading: post.heading,
            content: post.content,
            creatorname: post.creatorname,
            createdAt: post.createdAt,
            creatorId: post.creatorId,
            likes: post.likes,
            commentsCount: commentsCount,
            image: post.image // ✅ Include image
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports.UpdatePost = async (req, res) => {
    const { postId, heading, content } = req.body;

    try {
        let updateData = { heading, content };
        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        // Find the post by ID and update
        const updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            updateData,
            { new: true } // Return the updated document
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports.DeletePostAndComments = async (req, res, next) => {
    const { postId } = req.query;

    try {
        // Delete the post
        await PostModel.findByIdAndDelete(postId);

        // Delete comments associated with the post
        await CommentModel.deleteMany({ postId });

        res.status(200).json({ message: 'Post and associated comments deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};