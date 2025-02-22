import './App.css';

function App() {
  return (
    <div>
      <h1 className="App">Your Tasks</h1> 
      <div className="Columns" style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Task</h2>
          <h2>Priority</h2>
          <h2>Deadline</h2>
          
          <div>
            <button className="Buttons">Create task</button>
          </div>
          
      </div>
    </div>
  );
}

export default App;
