import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

export default function Login(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    setError('');
    try{
      const res = await axios.post('http://localhost:4000/api/login',{ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    }catch(err){
      setError(err?.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card p-4 shadow-sm">
          <h4 className="mb-3">Login</h4>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="form-control" type="email" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} className="form-control" type="password" required />
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <button className="btn btn-primary">Login</button>
              <Link to="/register">Don't have an account? Register</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
