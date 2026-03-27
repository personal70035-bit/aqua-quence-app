const { useState, useEffect } = React;

function App() {
    const [jars, setJars] = useState(1);
    const [status, setStatus] = useState("Ready");

    const handleCall = () => {
        setStatus("Listening...");
        // This triggers the browser microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                alert("AI is listening! (This is where Gemini connects)");
                setStatus("Ready");
            })
            .catch(err => {
                alert("Please allow microphone access to use Voice.");
                setStatus("Ready");
            });
    };

    return (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#0a0502', minHeight: '100vh', color: 'white' }}>
            <h1 style={{ color: '#00ccff' }}>Aqua Quence</h1>
            <p style={{ color: '#888' }}>Indiversa Water - Maheshtala</p>

            <div 
                onClick={handleCall}
                style={{
                    width: '200px', height: '200px', borderRadius: '50%',
                    backgroundColor: '#00ccff', margin: '40px auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 0 30px #00ccff',
                    transition: 'transform 0.2s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <b style={{ color: 'black', fontSize: '20px' }}>{status === "Ready" ? "CALL AQUA" : "..."}</b>
            </div>

            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', display: 'inline-block' }}>
                <h2 style={{ margin: '0 0 10px 0' }}>Order: {jars} Jars</h2>
                <button 
                    onClick={() => setJars(jars + 1)}
                    style={{ background: '#00ccff', color: 'black', border: 'none', padding: '10px 25px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    + Add Jar
                </button>
            </div>
            
            <p style={{ marginTop: '50px', color: '#444' }}>Owner: Anisul Alam</p>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
