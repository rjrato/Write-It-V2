import React, { useState, useEffect, useRef } from "react";

function WelcomeScreen(props) {
  const setFirstName = props.setFirstName;
  const setAuthenticated = props.setAuthenticated;
  const setUserId = props.setUserId;
  const setLastName = props.setLastName;
  const fetchNotes = props.fetchNotes;
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const API_URL = process.env.REACT_APP_API_URL;

  function validateEmail(email) {
    return emailPattern.test(email);
  }

  let isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function handleLogin() {
    
    if (!validateEmail(loginEmail)) {
      alert("Please enter a valid email");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (data.success && isMounted.current) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('firstName', data.user.firstName);
        localStorage.setItem('lastName', data.user.lastName);
        localStorage.setItem('userId', data.user.userId);
        setAuthenticated(true);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setUserId(data.user.userId)
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  }
  
  async function handleRegister() {

    if (!validateEmail(registerEmail)) {
      alert("Please enter a valid email");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: registerFirstName,
          lastName: registerLastName,
          email: registerEmail,
          password: registerPassword,
        }),
      });
  
      if (!response.ok) {
        console.error("HTTP error", response.status);
        alert("Registration failed due to a server error.");
        return;
      }
  
      const data = await response.json();
  
      if (data.success && isMounted.current) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('firstName', data.user.firstName);
        localStorage.setItem('lastName', data.user.lastName);
        localStorage.setItem('userId', data.user.userId);
        
        setAuthenticated(true);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setUserId(data.user.userId, () => {
          fetchNotes();
        });
      } else {
        alert("Registration failed");
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }        

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <h1 className="welcome-container-h1">Write it!</h1>
          <h3 className="welcome-container-subtitle">Before you forget it!</h3>
          <h5 className="welcome-container-sub-subtitle">Your personal note keeper</h5>
        {isRegistering ? (
          <>
            <h2 className="welcome-container-register-h2">Register</h2>
            <input 
              className="welcome-input"
              type="text"
              placeholder="First Name"
              value={registerFirstName}
              onChange={(e) => setRegisterFirstName(e.target.value)}
            />
            <input 
              className="welcome-input"
              type="text"
              placeholder="Last Name"
              value={registerLastName}
              onChange={(e) => setRegisterLastName(e.target.value)}
            />
            <input
              className="welcome-input"
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <input
              className="welcome-input"
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />
            <button className="welcome-container-button" onClick={handleRegister}>Register</button>
            <h5 className="welcome-container-h5" onClick={() => setIsRegistering(false)}>Login</h5>
          </>
        ) : (
          <>
            <h3 className="welcome-container-login">Login</h3>
            <input
              className="welcome-input"
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input
              className="welcome-input"
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button className="welcome-container-button" onClick={handleLogin}>Enter</button>
            <h5 className="welcome-container-h5" onClick={() => setIsRegistering(true)}>Register</h5>
          </>
        )}
      </div>
    </div>
  );
}

export default WelcomeScreen;