import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  getProfile,
  listAppointment,
  loginUser,
  registerUser,
  updateProfile,
  VerifyPayment,
  paymentStripe,
  getAppointment,
  CreatePayment,
  updateAppointment,
  Webhook,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
// userRouter.post("/checkout", authUser, paymentStripe);
// userRouter.post("/verfiy", VerifyPayment);
// userRouter.get("/appointment", getAppointment);
userRouter.post("/appointment", authUser, getAppointment);
userRouter.post("/checkout", authUser, CreatePayment);
userRouter.post("/webhook", authUser, Webhook);
userRouter.post("/update-appointment", authUser, updateAppointment);

export default userRouter;
