import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App(){
  const navigate = useNavigate();
  function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">Generative AI — Youth Mental Health</Link>
          <div className="d-flex">
            {user ? (
              <>
                <span className="me-3 align-self-center">Hello, {user.name}</span>
                <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-primary me-2" to="/login">Login</Link>
                <Link className="btn btn-primary" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="container my-4">
        <Outlet />
      </div>
    </div>
  )
}
