import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
// Inside your App function
const [messages, setMessages] = useState({ backendMsg: "", sqlMsg: "" });

useEffect(() => {
    fetch('/api/message')
      .then(res => res.json())
      .then(data => {
          setMessages(data); // Stores the whole object {backendMsg, sqlMsg}
      })
      .catch(err => console.log(err));
}, []);

return (
    <div className="App">
        <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            
            {/* Displaying both messages */}
            <h2>{messages.backendMsg}</h2>
            <p style={{ color: '#61dafb' }}>{messages.sqlMsg}</p>
            
        </header>
    </div>
);
}

export default App;