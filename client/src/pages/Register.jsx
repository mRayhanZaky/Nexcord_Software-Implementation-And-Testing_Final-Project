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

  if (form.password.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  console.log(form);

  const res = await registerUser(form);

  console.log(res);

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