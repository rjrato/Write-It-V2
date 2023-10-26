import React from "react";

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <p>Coded & Designed by Ricardo Rato | Copyright ⓒ {year}</p>
    </footer>
  );
}

export default Footer;
