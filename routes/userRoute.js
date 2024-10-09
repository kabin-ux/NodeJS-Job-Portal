import { Router } from "express";
import { getCurrentUser, loginUser, refreshAccessToken, registerUser, updateUser } from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/auth.js";

const userRouter = Router();

userRouter.post('/register', registerUser);

userRouter.post('/login', loginUser);

userRouter.post('/refresh-token', refreshAccessToken);

userRouter.get('/getCurrentUser', verifyJWT, getCurrentUser);

userRouter.put('/update-user', verifyJWT, updateUser);

export default userRouter;