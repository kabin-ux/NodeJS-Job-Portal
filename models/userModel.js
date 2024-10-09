import mongoose from "mongoose";
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET } from "../config.js";


const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "Name Is Required"],
      },
      lastname: {
        type: String,
        required: [true, "Last name Is Required"],
      },
      email: {
        type: String,
        required: [true, " Email is Required"],
        unique: true,
        validate: validator.isEmail,
      },
      password: {
        type: String,
        required: [true, "password is require"],
        minlength: [6, "Password length should be greater than 6 character"],
        select: true,
      },
      location: {
        type: String,
        default: "Nepal",
      },
      role:{
        type: String,
        enum: ["user", "admin"],
        default: "user",
        required: true
      },
      refreshToken: {
        type: String
      }
},
{
    timestamps: true
}
);

// Password Encryption
userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next()
});

// Check Password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
};

// Generate Access Token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role            
        },
        ACCESS_TOKEN_SECRET,
        {
            expiresIn: "10d"
        }
    )
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function(){
    // console.log("expiry date", REFRESH_TOKEN_EXPIRY)
    return jwt.sign(
    {   
        _id: this._id,
        email: this.email,
        username: this.username,
        role: this.role
    },
    REFRESH_TOKEN_SECRET,
    {
        expiresIn: "10d"
    }
)
};

const User = mongoose.model('User', userSchema);
export default User;