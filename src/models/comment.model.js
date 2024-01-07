import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import mAP from "mongoose-aggregate-paginate-v2"; //short version

const commentSchema = new Schema(
	{
		content: {
			type: String,
			required: true,
		},
		video: {
			type: Schema.Types.ObjectId,
			ref: "Video",
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	}
);

commentSchema.plugin(mAP);

export const Comment = mongoose.model("Comment", commentSchema);
