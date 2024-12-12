import validator from "validator";
import bycrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
//api for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    //validating Email
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please Enter a vaild Email",
      });
    }

    //validating Password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please Enter a strong password",
      });
    }

    //Hashing doctor password
    const salt = await bycrypt.genSalt(10);
    const hashedPassword = await bycrypt.hash(password, salt);

    //upload image to cloudinary
    const imageUpload = cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = (await imageUpload).secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };
    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor added" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: `Invaild Credentials` });
    }
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//Api getting all doctors
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//api to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

//Cancel Appointment
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

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

//Get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});
    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: userModel.length,
      latestAppointment: appointments.reverse().slice(0, 5),
    };
    res.json({ success: true, dashData });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
};
