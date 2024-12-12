import { render } from "preact";
import App from "./app.jsx";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import "./index.css";

render(
  <BrowserRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </BrowserRouter>,
  document.getElementById("app")
);
