import User from "../models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { REFRESH_TOKEN_SECRET } from "../config.js";

// Geneate access and refresh tokens
const generateAccessAndRefreshTokens = async(userId, res) => {
    try{
        const user = await User.findById(userId);
        const accessToken =await user.generateAccessToken();
        const refreshToken =await user.generateRefreshToken();
        // console.log("refresh token ", refreshToken)

        // Save refreshToken in database
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return{
            accessToken, refreshToken
        }
    } catch(err){
        // console.log("error", err)
        res.status(500).json({
            errorMEssage: "Something went wrong while generating refresh and access tokens"
        })
    }
};

export const registerUser = async (req, res) => {
    try {
        const { firstname, lastname, email, password, location, role} = req.body;

        // Validate input fields
        if ([firstname, lastname, email, password, location, role ].some(field => field?.trim() === '')) {
            return res.status(400).json({ errorMessage: "All fields are required" });
        }

        // Check if user already exists
        const existedUser = await User.findOne({ $or: [{ firstname }, { email }] });
        if (existedUser) {
            return res.status(409).json({ errorMessage: "User already exists" });
        }

        // console.log("Body", req.body)

        // Create user in the database
        const user = await User.create({
            firstname,
            lastname,
            email,
            password,
            location,
            role
        });

        // console.log(user);

        return res.status(200).json({
            StatusCode: 200,
            IsSuccess: true,
            ErrorMessage: [],
            Result: {
                message: "User created successfully",
                user
            }
        });
        
    } catch (err) {
        // console.log(err, "Error occurred");
        return res.status(500).json({ errorMessage: "An error occurred while registering the user" });
    }
};


//Logging the user in
export const loginUser = async (req, res) => {
    const {firstname, email, password } = req.body;

    // console.log("req body", req.body);

    if (!(firstname || email)) {
        return res.status(400).json({
            errorMessage: "Send username or email",
        });
    }

    try {
        // Find user by username or email
        const user = await User.findOne({
            $or: [{ firstname }, { email }],
        });


        if (!user) {
            return res.status(400).json({
                errMessage: "User does not exist",
            });
        }

        // Check password validity
        const isPasswordValid = await user.isPasswordCorrect(password);

        // console.log("Entered password", password);
        // console.log("Db password", user.password);
        

        // console.log("Password valid?", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                errorMessage: "Invalid user credentials",
            });
        }

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);


        // Retrieve user info excluding password and refresh token
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


        await loggedInUser.save();

        // Send  and response
        return res
            .status(200)
            .json({
                user: loggedInUser,
                accessToken,
                refreshToken,
                message: "User logged in successfully",
            });
    } catch (error) {
        // console.error("Login error:", error);
        return res.status(500).json({
            errorMessage: "Server error occurred. Please try again later.",
        });
    }
};


// Get Current User
export const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        StatusCode: 200,
        CurrentUser: req.user,
        IsSuccess: true,
        SuccessMessage: "Current user fetched succesfully"
    })
};

//Update User
export const updateUser = async (req, res) => {
    const { firstname, lastname, email, location } = req.body;

    // Check if required fields are present
    if (!(firstname && email)) {
        return res.status(400).json({
            errorMessage: "Firstname and email are required",
        });
    }

    try {
        // Find and update the user by ID, updating all fields if they are present
        const user = await User.findByIdAndUpdate(
            req.user?._id, 
            { 
                $set: {
                    firstname,
                    lastname,
                    email,
                    location
                }
            }, 
            { new: true }
        ).select('-password'); // Exclude password from response

        // If the user doesn't exist, return an error
        if (!user) {
            return res.status(404).json({
                errorMessage: "User not found",
            });
        }

        // Success response with updated user data
        return res.status(200).json({
            StatusCode: 200,
            UpdatedUser: user,
            IsSuccess: true,
            Message: "Account details updated successfully"
        });

    } catch (error) {
        // Handle any unexpected errors
        return res.status(500).json({
            errorMessage: "An error occurred while updating the account",
            error
        });
    }
};

//Refresh Access token using refresh token
export const refreshAccessToken = async (req, res) => {
    // console.log("in coming refresh token here", req.headers.authorization?.split(" ")[1]);
    const incomingToken = req.headers.authorization?.split(" ")[1];
    const incomingRefreshToken = incomingToken;

    if (!incomingRefreshToken){
        res.status(400).json({
            errorMEssage: "Unauthorized request"
        })
    }
    try {
        // console.log("incomingRefreshToken********", incomingRefreshToken)
        //verify tokens
        const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);

        const currentTime = Math.floor(Date.now() / 1000);


        //check if refresh token expired or not
        if(decodedToken.exp < currentTime){
            res.status(400).json({
                errorMEssage: "Refresh token has expired"
            })
        }

        // console.log("Decoded token", decodedToken)
        
        // console.log("decoded id", decodedToken?._id)

        const user = await User.findById(decodedToken?._id);

        // console.log("user hereeeeeeeeeeeeeeeeeeeeeee", user)
    
        if(!user){
            res.status(400).json({
                errorMEssage: "Invalid refresh token"
            })
        }
    
        // console.log(user?.refreshToken)
        if(incomingRefreshToken !== user?.refreshToken){
            res.status(401).json({
                errorMEssage: "Refresh token is expired"
            })
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200).json({
            accessToken, newrefreshToken,
            message: "Access token refreshed"
        })
        
    } catch (error) {
        res.status(401).json({
            errorMEssage: "Invalid refresh token"
        })
    }
};