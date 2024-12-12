import { createContext, useEffect, useState } from "react";
// import { doctors } from "../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";
export const AppContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [appointmentData, setAppointmentData] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);

  const [userData, setUserData] = useState(false);
  const currencySymbol = "$";

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

  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/list");
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token },
      });

      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const getAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/appointment",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        setAppointmentData(data.appointmentData);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const updateAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/update-appointment",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
    isProcessing,
    setIsProcessing,
    succeeded,
    setSucceeded,
    error,
    setError,
    getAppointment,
    appointmentData,
    setAppointmentData,
    slotDateFormat,
    updateAppointment,
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
