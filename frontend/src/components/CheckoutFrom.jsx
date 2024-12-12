import React, { useContext, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AppContext } from "../context/AppContext";

function CheckoutForm() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);

  const stripe = useStripe();
  const elements = useElements();
  const { backendUrl } = useContext(AppContext);
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const card = elements.getElement(CardElement);

    // Call backend to create a payment intent
    const response = await fetch(backendUrl + "/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 1000 }), // $10 in cents
    });
    const { clientSecret } = await response.json();

    // Confirm the payment with the clientSecret
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
      setSucceeded(true);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full min-h-[80vh]">
      <h2>Card Details</h2>
      <div>
        <CardElement />
      </div>
      <button
        className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
        type="submit"
        disabled={isProcessing || succeeded}
      >
        {isProcessing ? "Processing…" : "Pay Now"}
      </button>

      {error && <div className="error">{error}</div>}
      {succeeded && <div className="success">Payment succeeded!</div>}
    </form>
  );
}

export default CheckoutForm;

// *******************************************
