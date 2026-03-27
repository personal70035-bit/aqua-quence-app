const { useState } = React;

// You will need to put your Gemini API Key here later!
const MY_API_KEY = "AIzaSyBOeA1_1fJ-vmArausNm18S_o4Nr2jUjBo"; 

function App() {
  const [jars, setJars] = useState(1);

  return (
    <div style={{ textAlign: 'center', padding: '50px', background: '#0a0502', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0077be', fontSize: '36px' }}>Aqua Quence</h1>
      <p style={{ fontSize: '18px', color: '#888' }}>Water Management - Maheshtala</p>
      
      <div style={{ margin: '40px auto', width: '180px', height: '180px', borderRadius: '50%', background: '#0077be', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,119,190,0.5)' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>CALL AQUA</span>
      </div>

      <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Order: {jars} Jars</h2>
        <button 
          onClick={() => setJars(jars + 1)}
          style={{ background: '#0077be', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}
        >
          + Add Jar
        </button>
      </div>
      
      <p style={{ marginTop: '40px', color: '#555' }}>Owner: Anisul Alam</p>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
