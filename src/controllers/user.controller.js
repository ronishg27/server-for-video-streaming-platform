import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
	try {
		// finding user
		const user = await User.findById(userId);
		// generating tokens
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();
		// saving only refresh token in db
		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong while generating refresh and access token"
		);
	}
};

const registerUser = asyncHandler(async (req, res) => {
	// get the user credentials from the frontend using `req.body`
	// validation - not empty
	// check if the user exists : username, email
	// check for images: avatar
	// upload them to cloudinary, avatar
	// then create a user object - create entry in db
	// remove password and refresh token field from response
	//check for user creation
	// return response

	const { username, email, fullname, password } = req.body;
	// console.log("email: ", email);

	// if (fullname === "") {
	//   throw new ApiError(400, "fullname is required");
	// }

	// Checking if any of the required fields (fullname, email, password) is empty after trimming whitespace
	if (
		[fullname, email, fullname, password].some((field) => field?.trim() === "")
	) {
		// TODO: you can add fields validation functions additionally from utils/validators.js
		throw new ApiError(400, "All fields are compulsory");
	}

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(409, "username or email already exists");
	}

	// updated from github
	const avatarLocalPath = req.files?.avatar[0]?.path;
	// const coverImageLocalPath = req.files?.coverImage[0]?.path;
	// console.log(req.body);
	// console.log(req.files);
	let coverImageLocalPath;
	if (
		req.files &&
		Array.isArray(req.files.coverImage) &&
		req.files.coverImage.length > 0
	) {
		coverImageLocalPath = req.files.coverImage[0].path;
	}

	// console.log("coverImageLocalPath: " + coverImageLocalPath);
	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is mandatory");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!avatar) {
		throw new ApiError(400, "Avatar file is mandatory");
	}

	const user = await User.create({
		fullname,
		avatar: avatar.url,
		coverImage: coverImage.url,
		username: username.toLowerCase(),
		password,
		email,
	});
	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);
	if (!createdUser) {
		throw new ApiError(500, "Something went wrong while registering the user");
	}
	console.log(createdUser);

	return res
		.status(201)
		.json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
	// get the credentials from frontend
	// find the user and if yes::
	// get the credentials from database using same username or email
	// verify the passwords
	// access and  refresh token generation
	// send cookie

	const { email, username, password } = await req.body;
	// console.log(username);
	// console.log(req.body);

	if (!username) {
		throw new ApiError(400, "Username missing");
	}

	const user = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (!user) {
		throw new ApiError(404, "User does not exist");
	}

	const isPasswordValid = await user.isPasswordCorrect(password);

	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid user credentials");
	}

	const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
		user._id
	);

	const loggedUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	//by default anyone can modify cookies from the client-side, so using these options can make the cookies modifiable only by server

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedUser,
					accessToken,
					refreshToken,
				},
				"User logged in successfully"
			)
		);
});

const logoutUser = asyncHandler(async (req, res) => {
	// used from auth.middleware.js

	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1,
			},
			// $set: {
			// 	refreshToken: undefine,
			// },
		},
		{
			new: true,
		}
	);
	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken =
		req.cookies.refreshToken || req.body.refreshToken;

	if (!incomingRefreshToken) {
		throw new ApiError(401, "Unauthorized request token. ");
	}

	try {
		const decodedToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET
		);

		const user = await User.findById(decodedToken?._id);
		if (!user) {
			throw new ApiError(401, "Invalid request token. ");
		}

		if (incomingRefreshToken !== user?.refreshToken) {
			throw new ApiError(401, "Refresh token is expired or used. ");
		}

		const options = {
			httpOnly: true,
			secure: true,
		};

		const { accessToken, newRefreshToken } =
			await generateAccessAndRefreshToken(user._id);

		return res
			.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("refreshToken", newRefreshToken, options)
			.json(
				new ApiResponse(
					200,
					{
						accessToken,
						accessToken: newRefreshToken,
					},
					"Access Token refreshed."
				)
			);
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid ref token.");
	}
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;
	const user = await User.findById(req.user?._id);
	const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
	if (!isPasswordCorrect) {
		throw new ApiError(400, "Invalid old password.");
	}

	user.password = newPassword;
	await user.save({ validateBeforeSave: false });

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Password Changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
	const user = req.user;
	if (!user) {
		throw new ApiError(402, "User not found.");
	}

	return res
		.status(200)
		.json(new ApiResponse(201, user, "Current User retrieved successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
	const { fullname, email } = req.body;

	if (!fullname || !email) {
		throw new ApiError(400, "All fields are necessary.");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: { fullname, email },
		},
		{ new: true }
	).select("-password");

	return res
		.status(200)
		.json(new ApiResponse(200, user, "Account details updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
	const avatarLocalPath = req.file?.path;

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is missing.");
	}
	const avatar = await uploadOnCloudinary(avatarLocalPath);
	if (!avatar.url) {
		throw new ApiError(400, "Error while uploading avatar.");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				avatar: avatar.url,
			},
		},
		{ new: true }
	).select("-password");
	return res
		.status(200)
		.json(new ApiResponse(200, user, "Avatar updated successfully."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
	const coverImageLocalPath = req.file?.path;

	if (!coverImageLocalPath) {
		throw new ApiError(400, "Cover Image file is missing.");
	}
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);
	if (!coverImage.url) {
		throw new ApiError(400, "Error while uploading cover image.");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				coverImage: coverImage.url,
			},
		},
		{ new: true }
	).select("-password");
	return res
		.status(200)
		.json(new ApiResponse(200, user, "Cover Image updated successfully."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
	const { username } = req.params;
	console.log(username);
	if (!username?.trim()) {
		throw new ApiError(400, "username is missing.");
	}
	// looking for subscriber
	const channel = await User.aggregate([
		{
			$match: {
				username: username?.toLowerCase(),
			},
		},
		{
			$lookup: {
				from: "subscriptions", // subscriptions (from Subscription) model
				localField: "_id", //uniquely identified key
				foreignField: "channel", // looking for what? -> channel
				as: "subscribers", //your subscribers
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "subscriber",
				as: "subscribedTo", // to whom you had subscribed
			},
		},
		{
			$addFields: {
				subscribersCount: {
					$size: "$subscribers",
				},
				channelsSubscribedToCount: {
					$size: "$subscribedTo",
				},
				isSubscribed: {
					$cond: {
						if: { $in: [req.user?._id, "$subscribers.subscriber"] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$project: {
				fullname: 1,
				username: 1,
				subscribersCount: 1,
				channelsSubscribedToCount: 1,
				isSubscribed: 1,
				avatar: 1,
				coverImage: 1,
				email: 1,
			},
		},
	]);
	if (!channel?.length) {
		throw new ApiError(404, "Channel does not exist.");
	}
	console.log(channel);

	return res
		.status(200)
		.json(
			new ApiResponse(200, channel[0], "User Channel fetched successfully.")
		);
});

const getWatchHistory = asyncHandler(async (req, res) => {
	const user = await User.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(req.user._id),
			},
		},
		{
			$lookup: {
				from: "videos",
				localField: "watchHistory",
				foreignField: "_id",
				as: "watchHistory",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "owner",
							foreignField: "_id",
							as: "owner",
							pipeline: [
								{
									$project: {
										fullname: 1,
										username: 1,
										avatar: 1,
									},
								},
							],
						},
					},
					{
						$addFields: {
							owner: {
								$first: "$owner",
							},
						},
					},
				],
			},
		},
	]);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				user[0].watchHistory,
				"Watch history fetched successfully."
			)
		);
});

export {
	registerUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage,
	getWatchHistory,
	getUserChannelProfile,
};
