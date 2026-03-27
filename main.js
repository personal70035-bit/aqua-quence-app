const { useState } = React;

function App() {
    const [jars, setJars] = useState(1);

    const handleCall = () => {
        // This is the "Success Test" - it will pop up a box immediately
        alert("Victory! Aqua Quence is now listening for your order.");
        
        // This asks for microphone permission
        navigator.mediaDevices.getUserMedia({ audio: true })
            .catch(() => alert("Please allow Microphone access in your browser settings."));
    };

    return (
        <div style={{ textAlign: 'center', padding: '50px', background: '#0a0502', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#00ccff' }}>Aqua Quence</h1>
            <p style={{ color: '#888' }}>Maheshtala Water Delivery</p>
            
            <div 
                onClick={handleCall}
                style={{ 
                    margin: '40px auto', width: '180px', height: '180px', borderRadius: '50%', 
                    background: '#00ccff', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px #00ccff',
                    color: 'black', fontWeight: 'bold', fontSize: '20px'
                }}
            >
                CALL AQUA
            </div>

            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
                <h2 style={{ margin: '0 0 10px 0' }}>Order: {jars} Jars</h2>
                <button 
                    onClick={() => setJars(jars + 1)}
                    style={{ background: '#00ccff', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    + Add Jar
                </button>
            </div>
            
            <p style={{ marginTop: '40px', color: '#444' }}>Owner: Anisul Alam</p>
        </div>
    );
}

// THE MOST IMPORTANT TWO LINES:
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
