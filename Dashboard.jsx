import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'

export default function Dashboard(){
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const chatRef = useRef();

  useEffect(()=>{ fetchSessions(); },[])

  async function fetchSessions(){
    try{
      const res = await axios.get('http://localhost:4000/api/sessions', { headers: { Authorization: 'Bearer '+token }});
      setSessions(res.data.sessions || []);
    }catch(e){
      console.error(e);
    }
  }

  async function send(){
    if(!message.trim()) return;
    const userMsg = message;
    setChat(prev=>[...prev, { from:'user', text:userMsg }]);
    setMessage('');
    try{
      const res = await axios.post('http://localhost:4000/api/chat', { message: userMsg }, { headers: { Authorization: 'Bearer '+token }});
      const reply = res.data.reply;
      setChat(prev=>[...prev, { from:'bot', text: reply }]);
      fetchSessions();
    }catch(err){
      setChat(prev=>[...prev, { from:'bot', text: 'Sorry, there was an error. Try again later.' }]);
    }
    // scroll
    setTimeout(()=> {
      if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    },100);
  }

  return (
    <div className="row">
      <div className="col-lg-8 mb-3">
        <div className="card p-3 shadow-sm">
          <h5>AI Support Chat</h5>
          <div ref={chatRef} className="card-chat p-3 mb-3" style={{minHeight:300}}>
            <div className="chat-row">
              {chat.map((c,i)=> (
                <div key={i} className={c.from==='user' ? 'text-end' : 'text-start'}>
                  <span className={'message '+(c.from==='user' ? 'from-user' : 'from-bot')}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex gap-2">
            <input value={message} onChange={e=>setMessage(e.target.value)} className="form-control" placeholder="Share what's on your mind..." />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card p-3 shadow-sm mb-3">
          <h6>Saved Sessions</h6>
          <ul className="list-group">
            {sessions.map(s=>(
              <li key={s._id} className="list-group-item">
                <div style={{fontSize:13}}>{new Date(s.createdAt).toLocaleString()}</div>
                <div style={{fontSize:14, fontWeight:600}}>{s.message.slice(0,80)}</div>
                <div style={{fontSize:13, color:'#555'}}>{s.reply.slice(0,120)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-3 shadow-sm">
          <h6>Quick Resources</h6>
          <p style={{fontSize:14}}>
            If you're in immediate danger contact local emergency services. For non-urgent support,
            consider campus counselling, local NGOs, or online therapy platforms.
          </p>
        </div>
      </div>
    </div>
  )
}
