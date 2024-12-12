import vaildator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIP_SECRET_KEY);

// Api Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.json({ success: false, message: "Missing Details" });
    }
    if (!vaildator.isEmail(email)) {
      res.json({ success: false, message: "Enter vaild Email" });
    }
    if (password.length < 8) {
      res.json({ success: false, message: "Enter a strong password" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      res.json({ success: false, message: "User do not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invaild Credentials" });
    }
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//Geting user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//update user
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;
    if (!name || !phone || !dob || !gender) {
      res.json({ success: false, message: "Data Missing" });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }
    res.json({ success: true, message: "Profile Updated" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//Book Appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData.available) {
      res.json({ success: false, message: "Doctor not available" });
    }

    let slots_booked = docData.slots_booked;
    //check time if available
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        res.json({ success: false, message: "Slot not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");
    delete docData.slots_booked;
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    //save slots at doctorData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Booked" });
  } catch (e) {
    console.log(e);
    if (e.message.includes("E11000 duplicate key error")) {
      res.json({ success: false, message: "You Already have appointment" });
    }
    res.json({ success: false, message: e.message });
  }
};

//get user appointments for frontend my-appointmnet page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    //verfiy appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Appointment Cancel" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

const paymentStripe = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const frontEndUrl = "http://localhost:5173";
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      res.json({ success: false, message: "Appointment Cancelled or failed" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${appointmentData.docData.name} Appointment Reseverd`,
              images: [appointmentData.docData.image],
            },
            unit_amount: appointmentData.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${frontEndUrl}/verify?success=true&appointmentId=${appointmentId}`,
      cancel_url: `${frontEndUrl}/verify?success=false&appointmentId=${appointmentId}`,
    });
    res.json({ id: session.id });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

const VerifyPayment = async (req, res) => {
  const { appointmentId, success } = req.body;
  try {
    if (success == "true") {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
      });
      res.json({ success: true, message: "Your appointment paid" });
    } else {
      res.json({ success: false, message: "Your appointment not paid" });
    }
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

const CreatePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });
    console.log(paymentIntent.client_secret, "Client");

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    console.log(e.message);
    res.json({ success: false, message: e.message });
  }
};

const getAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    res.json({ success: true, appointmentData });
  } catch (e) {
    console.log(e.message);
    res.json({ success: false, message: e.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      payment: true,
    });
    console.log("Updated");

    res.json({ success: true, message: "Your appointment paid" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

const Webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIP_SECRET_KEY
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const appointmentId = session.metadata.appointmentId;
      const paymentStatus = session.payment_status;

      // You can update your database based on the payment status
      if (paymentStatus === "paid") {
        // Handle successful payment (e.g., update appointment status)
        console.log("payment", paymentStatus);
        console.log("appointmentId", appointmentId);
      } else {
        // Handle payment failure (e.g., notify user)
        console.log("payment", paymentStatus);
        console.log("appointmentId", appointmentId);
      }
      break;
    // Handle other events if necessary
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentStripe,
  CreatePayment,
  Webhook,
  VerifyPayment,
  getAppointment,
  updateAppointment,
};
