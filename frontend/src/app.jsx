import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import MyAppointment from "./pages/MyAppointment";
import Appointment from "./pages/Appointment";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Verfiy from "./pages/Verfiy.jsx";
import PaymentForm from "./pages/PaymentForm.jsx";

const App = () => {
  return (
    <div className="mx-4 sm:mx-[10%]">
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-appointments" element={<MyAppointment />} />
        <Route path="/verify" element={<Verfiy />} />
        <Route path="/payment/:appointmentId" element={<PaymentForm />} />
        <Route path="/appointment/:docId" element={<Appointment />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
