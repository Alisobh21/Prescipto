import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";

import axios from "axios";
import { useNavigate } from "react-router-dom";
const MyAppointment = () => {
  const { token, backendUrl, getDoctorsData, userData } =
    useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return (
      dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    );
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });
      if (data.success) {
        setAppointments(data.appointments.reverse());
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handlePayment = async (appointmentId) => {
    try {
      const stripePromise = await loadStripe(
        "pk_test_51QPpyhCfUa3AnMuSsIiI35VVXhZ7189SabdCmLVIEVmZiYQDZBDiXAbkOvj4bF9BxYTusCPg8ON9zorST4pSIKAH00n7d8g6mr"
      );

      const { data } = await axios.post(
        backendUrl + "/api/user/checkout",
        { appointmentId },
        { headers: { token } }
      );

      stripePromise.redirectToCheckout({
        sessionId: data.id,
      });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handlePayment1 = async (appointmentId) => {
    try {
      const stripePromise = await loadStripe(
        "pk_test_51QPpyhCfUa3AnMuSsIiI35VVXhZ7189SabdCmLVIEVmZiYQDZBDiXAbkOvj4bF9BxYTusCPg8ON9zorST4pSIKAH00n7d8g6mr"
      );

      const { data } = await axios.post(backendUrl + "/api/user/checkout", {
        appointmentId,
      });
      console.log(data);

      stripePromise.redirectToCheckout({
        sessionId: data.id,
      });
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);
  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My Appointments
      </p>
      <div>
        {appointments &&
          appointments.reverse().map((item, index) => (
            <div
              className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
              key={index}
            >
              <div>
                <img
                  className="w-32 bg-indigo-50"
                  src={item.docData.image}
                  alt=""
                />
              </div>
              <div className="flex-1 text-sm text-zinc-600">
                <p className="text-neutral-800 font-semibold">
                  {item.docData.name}
                </p>
                <p>{item.docData.speciality}</p>
                <p className="text-zinc-700 font-medium mt-1">Address:</p>
                <p className="text-xs ">{item.docData.address.line1}</p>
                <p className="text-xs ">{item.docData.address.line2}</p>
                <p className="text-sm mt-1">
                  <span className="text-sm text-neutral-700 font-medium">
                    Date & Time:
                  </span>{" "}
                  {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
              </div>
              <div></div>
              <div className="flex flex-col gap-2 justify-end ">
                {item.payment && !item.isCompleted && (
                  <button className="sm:min-w-48 py-2 border rounded text-stone-500 bg-indigo-50 ">
                    Paid
                  </button>
                )}
                {!item.cancelled && !item.payment && !item.isCompleted && (
                  <button
                    onClick={() => navigate(`/payment/${item._id}`)}
                    className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    Pay Online
                  </button>
                )}
                {!item.cancelled && !item.payment && !item.isCompleted && (
                  <button
                    onClick={() => cancelAppointment(item._id)}
                    className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                  >
                    Cancel appointment
                  </button>
                )}
                {item.cancelled && (
                  <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500 ">
                    Appointment Cancelled
                  </button>
                )}

                {item.isCompleted && (
                  <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500 ">
                    Appointment Completed
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MyAppointment;