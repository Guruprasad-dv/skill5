
import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [district, setDistrict] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e) {
    e.preventDefault();

    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("isLoggedIn", "true");
      setLoggedIn(true);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  }

  async function searchHospitals(e) {
    e.preventDefault();

    if (!district.trim()) {
      setError("Please enter a district name");
      setHospitals([]);
      return;
    }

    setLoading(true);
    setError("");
    setHospitals([]);

    const params = new URLSearchParams({
      where: `district_name LIKE '%${district.trim().replace(/'/g, "''")}%'`,
      outFields:
        "health_facility_name,address,posatalcode,landline_number,facility_type,state_name,district_name",
      returnGeometry: "false",
      resultRecordCount: "100",
      f: "json"
    });

    try {
      const response = await fetch(
        "https://livingatlas.esri.in/server/rest/services/LivingAtlas/IND_Hospital_Directory/MapServer/0/query?" +
          params.toString()
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "API error");
      }

      const results = (data.features || []).map(
        (item, index) => ({
          id: `${district}-${index}`,
          ...item.attributes
        })
      );

      setHospitals(results);

      const previousSearches = JSON.parse(
        localStorage.getItem("recentSearches") || "[]"
      );

      localStorage.setItem(
        "recentSearches",
        JSON.stringify([
          district.trim(),
          ...previousSearches.filter(
            (name) =>
              name.toLowerCase() !== district.trim().toLowerCase()
          )
        ].slice(0, 5))
      );

      if (results.length === 0) {
        setError("No health facilities found in this district.");
      }
    } catch (err) {
      console.error(err);
      setError(
        "Could not load hospital data. Check your internet and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
    setDistrict("");
    setHospitals([]);
    setError("");
  }

  if (!loggedIn) {
    return (
      <div className="container">
        <h1>Hospital Finder</h1>
        <p>Login to find health facilities</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>
        </form>

        {error && <p className="error">{error}</p>}

        <p>Demo username: admin</p>
        <p>Demo password: admin123</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Government Hospital Finder</h1>
      <p>Search health facilities by district name</p>

      <button onClick={handleLogout}>Logout</button>

      <form onSubmit={searchHospitals} className="search-form">
        <input
          type="text"
          placeholder="Enter district name"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Hospitals"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {hospitals.length > 0 && (
        <>
          <h2>Search Results ({hospitals.length})</h2>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Facility Name</th>
                  <th>Address</th>
                  <th>PIN Code</th>
                  <th>Type</th>
                  <th>District</th>
                  <th>Phone</th>
                </tr>
              </thead>

              <tbody>
                {hospitals.map((hospital) => (
                  <tr key={hospital.id}>
                    <td>
                      {hospital.health_facility_name || "N/A"}
                    </td>
                    <td>{hospital.address || "N/A"}</td>
                    <td>{hospital.posatalcode || "N/A"}</td>
                    <td>{hospital.facility_type || "N/A"}</td>
                    <td>{hospital.district_name || "N/A"}</td>
                    <td>{hospital.landline_number || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="note">
            Confirm with the facility that it is government-run
            before visiting.
          </p>
        </>
      )}

      <p className="note">
        Data source: Hospital Directory of India.
        Information may be incomplete or outdated.
      </p>
    </div>
  );
}

export default App;