import { v2 as cloudinary } from "cloudinary";
import { Console } from "console";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // console.log("Current Working Directory:", process.cwd());
    // console.log("Provided File Path:", localFilePath);
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.error("File does not exist or is not specified.");
      return null;
    }
    // uploading file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been successfully uploaded
    // console.info("File successfully uploaded to cloudinary: ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the  upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
