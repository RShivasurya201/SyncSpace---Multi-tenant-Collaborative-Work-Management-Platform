import React from "react";
import "../styles/pageLoader.css";

function PageLoader({ message = "Loading" }) {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <div className="page-loader__label">{message}</div>
    </div>
  );
}

export default PageLoader;
