import React from "react";
import HighlightIcon from "@mui/icons-material/Highlight";

function Header(props) {
  const firstName = props.firstName;
  const lastName = props.lastName;

  function onClickLogOff() {
    props.handleLogOff();
  }

  return (
    <header>
      <h1 className="header-h1">
        <div>
          <HighlightIcon />
          Write it!
        </div>
        {firstName && lastName && (
        <div className="header-user-info">
          <span>{`Welcome ${props.firstName} ${props.lastName}`}</span>
          <h5 onClick={onClickLogOff}>Log Off</h5>
        </div>
        )}
      </h1>
    </header>
  );
}

export default Header;
