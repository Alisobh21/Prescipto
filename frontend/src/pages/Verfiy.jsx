import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Verfiy = () => {
  const navgiate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const success = searchParams.get("success");
  const appointmentId = searchParams.get("appointmentId");
  const { backendUrl } = useContext(AppContext);
  const VerifyPayment = async () => {
    const { data } = await axios.post(backendUrl + "/api/user/verfiy", {
      success,
      appointmentId,
    });
    if (data.success) {
      toast.success(data.message);
      navgiate("/my-appointments");
    } else {
      navgiate("/");
    }
  };
  useEffect(() => {
    VerifyPayment();
  }, []);

  return (
    <div className="grid place-items-center h-screen min-h-[40vd]">
      <div className="loader"></div>
    </div>
  );
};

export default Verfiy;
