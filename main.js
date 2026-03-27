const { useState } = React;

function App() {
    const [jars, setJars] = useState(1);

    const handleCall = () => {
        alert("Success! Aqua Quence AI is now connected.");
    };

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1 style={{ color: '#00ccff' }}>Aqua Quence</h1>
            <p>Maheshtala Water Delivery</p>
            
            <div onClick={handleCall} style={{ margin: '40px auto', width: '180px', height: '180px', borderRadius: '50%', background: '#00ccff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black', fontWeight: 'bold' }}>
                CALL AQUA
            </div>

            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
                <h2>Order: {jars} Jars</h2>
                <button onClick={() => setJars(jars + 1)} style={{ background: '#00ccff', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Add Jar
                </button>
            </div>
            <p style={{ marginTop: '40px', color: '#444' }}>Owner: Anisul Alam</p>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
