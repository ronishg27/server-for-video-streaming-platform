import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
  console.log("email: ", email);

  // if (fullname === "") {
  //   throw new ApiError(400, "fullname is required");
  // }

  if (
    [fullname, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    // TODO: you can add fields validation functions additionally from utils/validators.js
    throw new ApiError(400, "All fields are compulsory");
  }

  const exitedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitedUser) {
    throw new ApiError(409, "username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; //avatar is compulsory
  const converImageLocalPath = req.files?.converImage[0]?.path; //coverImage is not compulsory

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is mandatory");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(converImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is mandatory");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
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

export { registerUser };
