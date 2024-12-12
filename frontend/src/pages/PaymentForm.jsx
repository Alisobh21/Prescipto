import React, { useContext, useEffect } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import styled from "styled-components";
import { AppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const stripePromise = loadStripe(
  "pk_test_51QPpyhCfUa3AnMuSsIiI35VVXhZ7189SabdCmLVIEVmZiYQDZBDiXAbkOvj4bF9BxYTusCPg8ON9zorST4pSIKAH00n7d8g6mr"
);

// Styled components

const Message = styled.div`
  text-align: center;
  margin-top: 20px;
  color: ${(props) => (props.success ? "#28a745" : "#ff0000")};
`;

function CheckoutForm() {
  const navgiate = useNavigate("/");
  const {
    isProcessing,
    setIsProcessing,
    succeeded,
    setSucceeded,
    error,
    setError,
    appointmentData,
    getAppointment,
    token,
    currencySymbol,
    slotDateFormat,
    updateAppointment,
    backendUrl,
  } = useContext(AppContext);

  const { appointmentId } = useParams();

  useEffect(() => {
    if (appointmentId) {
      getAppointment(appointmentId);
    }
  }, [appointmentId]);

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    if (!appointmentData) {
      toast.error("No Appointment found");
      navgiate("/");
    }
    if (appointmentData.cancelled || appointmentData.payment) {
      toast.error(
        `Appointment is already ${
          appointmentData.cancelled ? "cancelled" : "Paid"
        }  `
      );
      navgiate("/my-appointments");
    }
    if (!stripe || !elements) {
      return;
    }
    event.preventDefault();

    setIsProcessing(true);

    const card = elements.getElement(CardElement);

    const { data } = await axios.post(
      backendUrl + "/api/user/checkout",
      { amount: Number(appointmentData.docData.fees) * 100 },
      { headers: { token } }
    );
    if (!data.success) {
      toast.error(data.message);
    }
    const clientSecret = data.clientSecret;
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card,
        },
      }
    );

    if (error) {
      setError(error.message);
      setIsProcessing(false);
    } else {
      console.log("Else");

      updateAppointment(appointmentId);
      setSucceeded(true);
      setIsProcessing(false);
      navgiate("/my-appointments");
    }
  };

  return (
    token &&
    appointmentData && (
      <form
        className="w-full max-w-[400px] my-0 mx-auto p-[20px] border border-[#ddd] rounded-[8px] bg-[#f9f9f9]"
        onSubmit={handleSubmit}
      >
        <h1 className="text-center text-[24px] text-[#333] mb-[20px]">
          Payment
        </h1>

        <div className="mb-[20px] grid grid-cols-[1fr_2fr] items-center gap-2">
          <img
            className="w-32 bg-indigo-50"
            src={appointmentData.docData.image}
            alt=""
          />

          <div className="flex-1 text-sm text-zinc-600">
            <p className="text-neutral-800 font-semibold">
              {appointmentData.docData.name}
            </p>
            <p className="text-sm mt-1">
              <span className="text-sm text-neutral-800 font-medium">
                Fees:
              </span>{" "}
              {currencySymbol}
              {appointmentData.docData.fees}
            </p>

            <p className="text-sm mt-1">
              <span className="text-sm text-neutral-700 font-medium">
                Date & Time:
              </span>{" "}
              <br />
              {slotDateFormat(appointmentData.slotDate)} |{" "}
              {appointmentData.slotTime}
            </p>
          </div>
        </div>
        <div className="flex flex-col mb-[20px]">
          <CardElement />
        </div>
        <button
          className="w-full p-[10px] bg-primary text-white border-none rounded-[4px] text-[16px] "
          type="submit"
          disabled={isProcessing || succeeded}
        >
          {isProcessing ? "Processing…" : "Pay Now"}
        </button>

        {error && <Message>{error}</Message>}
        {succeeded && <Message success>Payment succeeded!</Message>}
      </form>
    )
  );
}

function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

export default PaymentForm;
