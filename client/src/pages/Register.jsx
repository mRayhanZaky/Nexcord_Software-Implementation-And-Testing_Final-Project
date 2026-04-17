import { useState } from "react";
import { registerUser } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });

const handleSubmit = async (e) => {
  e.preventDefault();

  console.log(form); // 👈 tambahin ini

  const res = await registerUser(form);

  console.log(res); // 👈 tambahin ini

  alert(res.message);
};

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Username"
          onChange={e => setForm({...form, username: e.target.value})} />

        <input placeholder="Email"
          onChange={e => setForm({...form, email: e.target.value})} />

        <input type="password" placeholder="Password"
          onChange={e => setForm({...form, password: e.target.value})} />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}