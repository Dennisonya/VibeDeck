import {BrowserRouter, Route, Routes} from "react-router";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CreateVibe from "./components/CreateVibe.jsx";
import ViewEntries from "./components/ViewEntries.jsx";
import EntryDetails from "./components/EntryDetails.jsx";
import Callback from "./components/Callback.jsx";
import SuggestionsPage from "./components/SuggestionsPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:id/dashboard" element={<Dashboard/>}/>
        <Route path="/createEntry" element={<CreateVibe/>}/>
        <Route path="/entries" element={<ViewEntries/>}/>
        <Route path="/entries/:id" element={<EntryDetails />} />
        <Route path="/callback" element={<Callback/>}/>
        <Route path="/songs" element={<SuggestionsPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;