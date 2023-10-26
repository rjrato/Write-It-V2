import React, { useState, useEffect, useCallback } from "react";
import WelcomeScreen from "./WelcomeScreen";
import Header from "./Header";
import Footer from "./Footer";
import CreateArea from "./CreateArea";
import Note from "./Note";

function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notes, setNotes] = useState([]);
  const [userId, setUserId] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchNotes = useCallback(() => {
    if (!userId) {
      console.warn("User ID not set, skipping fetch");
      return;
    }
    fetch(`${API_URL}/api/getUserNotes/${userId}`)
      .then(response => response.json())
      .then(data => setNotes(data));
  }, [userId, API_URL]);

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId, fetchNotes]);

  useEffect(() => {
    const authFlag = localStorage.getItem("isAuthenticated");
    const storedFirstName = localStorage.getItem("firstName");
    const storedLastName = localStorage.getItem("lastName");
    const storedUserId = localStorage.getItem("userId");
    
    if (authFlag === "true") {
      setAuthenticated(true);
      setFirstName(storedFirstName);
      setLastName(storedLastName);
      setUserId(storedUserId);
    }
  }, []); 

  function addNote(newNote) {
    
    fetch(`${API_URL}/api/addNote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, ...newNote }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.note) {
        setNotes(prevNotes => {
          return [...prevNotes, data.note]
        });
      }
    });
  };

  function deleteNote(mongoDbId) {
    
    fetch(`${API_URL}/api/deleteNote/${userId}/${mongoDbId}`, {
      method: "POST",
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setNotes(prevNotes => {
          return prevNotes.filter((noteItem) => {
            return noteItem._id !== mongoDbId;
          });
        })
      };
    })
    .catch(error => console.error('Fetch Error:', error));
  };

  function handleLogOff() {
    localStorage.removeItem('isAuthenticated');
    setAuthenticated(false);
    setFirstName("");
    setLastName("");
  };

  return (
    <div className="main-container">
      <div className={`content-wrapper ${!isAuthenticated ? "content-wrapper-blur" : ""}`}>
        <Header 
          firstName={firstName}
          lastName={lastName}  
          setAuthenticated={setAuthenticated}
          handleLogOff={handleLogOff}
        />
        
        {isAuthenticated && (
          <>
          <CreateArea
            onAdd={addNote}
            onDelete={deleteNote} />
            {notes.map((noteItem) => {
              return (
                <Note
                  key={noteItem._id}
                  id={noteItem._id}
                  title={noteItem.title}
                  content={noteItem.content}
                  onDelete={deleteNote}
                />
              );
            })}
          </>
        )}
        <Footer />
      </div>
  
      {!isAuthenticated && (
        <div className="welcome-screen">
          <WelcomeScreen 
            setAuthenticated={setAuthenticated}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            fetchNotes={fetchNotes}
            setUserId={setUserId}
          />
        </div>
      )}
    </div>
  );
  
}

export default App;