// client/src/pages/ProfilePage.jsx
import React, { useState, useContext, useRef } from 'react';
import API from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { ToastContext } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

/* ---------- BMIGauge component (SVG-based) ---------- */
function BMIGauge({ bmi = 0, size = 220 }) {
  const min = 10;
  const max = 40;
  const clamped = Math.max(min, Math.min(max, bmi || min));
  // angle from -90..+90
  const angle = ((clamped - min) / (max - min)) * 180 - 90;

  const ranges = [
    { from: 10, to: 18.5, color: '#f6c94d' },   // slim (yellow)
    { from: 18.5, to: 24.9, color: '#56d364' }, // healthy (green)
    { from: 25, to: 29.9, color: '#ff9f43' },   // overweight (orange)
    { from: 30, to: 40, color: '#ff6b6b' }      // obese (red)
  ];

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const strokeW = 14;

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const arcs = ranges.map((r, idx) => {
    const startAngle = ((r.from - min) / (max - min)) * 180 - 90;
    const endAngle = ((r.to - min) / (max - min)) * 180 - 90;
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;
    return (
      <path
        key={idx}
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`}
        stroke={r.color}
        strokeWidth={strokeW}
        fill="none"
        strokeLinecap="round"
      />
    );
  });

  // needle
  const needleLength = radius + 6;
  const needleTip = polarToCartesian(cx, cy, needleLength, angle);

  return (
    <svg
      width={size}
      height={size * 0.66}
      viewBox={`0 0 ${size} ${size * 0.66}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id="gshadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g transform={`translate(0, ${size * 0.08})`}>
        <g filter="url(#gshadow)">{arcs}</g>

        {/* ticks and labels */}
        {Array.from({ length: 7 }).map((_, i) => {
          const tVal = min + ((max - min) / 6) * i;
          const tAngle = ((tVal - min) / (max - min)) * 180 - 90;
          const pOuter = polarToCartesian(cx, cy, radius + strokeW / 2 + 6, tAngle);
          const pInner = polarToCartesian(cx, cy, radius - strokeW / 2 - 6, tAngle);
          const labelPos = polarToCartesian(cx, cy, radius + 28, tAngle);
          const label = Math.round(tVal);
          return (
            <g key={i}>
              <line x1={pInner.x} y1={pInner.y} x2={pOuter.x} y2={pOuter.y} stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
              <text x={labelPos.x} y={labelPos.y} fontSize="11" fill="rgba(255,255,255,0.6)" textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
            </g>
          );
        })}

        {/* needle (rotated group) */}
        <g transform={`translate(${cx}, ${cy})`}>
          <g style={{ transition: 'transform 700ms cubic-bezier(.2,.9,.2,1)', transform: `rotate(${angle}deg)` }}>
            <line x1="0" y1="0" x2={needleTip.x - cx} y2={needleTip.y - cy} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="0" r="6" fill="#071a39" stroke="#fff" strokeWidth="2" />
          </g>
        </g>

        <text x={cx} y={cy + 44} textAnchor="middle" fontSize="14" fill="#fff" fontWeight="700">
          BMI {bmi ? bmi.toFixed(1) : '—'}
        </text>
      </g>
    </svg>
  );
}

/* ---------- Profile Page ---------- */
export default function ProfilePage(){
  const { user, token, replaceAuth } = useContext(AuthContext);
  const { push } = useContext(ToastContext);
  const navigate = useNavigate();
  const gaugeRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    gender: 'male',
    age: 25,
    heightCm: 170,
    weightKg: 70,
    email: user?.email || ''
  });

  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  function onChange(k, v){ setForm(s => ({ ...s, [k]: v })); }

  function computeLocalBMI(){
    const h = Number(form.heightCm) / 100;
    if (!h || !form.weightKg) return null;
    const bmi = Number(form.weightKg) / (h * h);
    return Math.round(bmi * 10) / 10;
  }

  async function saveToServer(scrollToGauge = false, actionLabel = 'Saved'){
    if(!token){
      // not logged in -> redirect to auth and come back
      navigate('/auth', { state: { from: '/profile' } });
      return;
    }

    if(!form.name || !form.email){
      push('Please provide name and email.', { type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        gender: form.gender,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        email: form.email
      };

      const res = await API.post('/profile', payload);
      setProfile(res.data.profile);

      push(`${actionLabel}: BMI ${res.data.profile.bmi} • Fitness age ${res.data.profile.fitness_age}`, { type: 'success' });

      // if server returned new token (email changed), update token & user
      if(res.data.token){
        replaceAuth(res.data.token, { id: user?.id, name: payload.name, email: payload.email });
        push('Credentials updated; re-authenticated.', { type: 'info' });
      } else {
        // update local displayed name/email
        replaceAuth(null, { id: user?.id, name: payload.name, email: payload.email || user?.email });
      }

      if(scrollToGauge && gaugeRef.current){
        gaugeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || (err?.message || 'Failed to save profile');
      push(msg, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // live BMI computed locally — gauge shows this value (live update)
  const liveBMI = computeLocalBMI();

  return (
    <div className="card" style={{maxWidth:900, margin:'0 auto'}}>
      <h3>Profile & Fitness Data</h3>

      <div className="profile-grid labels" aria-hidden>
        <div>Name</div>
        <div>Gender</div>
        <div>Age</div>
        <div>Height (cm)</div>
        <div>Weight (kg)</div>
        <div>Email id</div>
      </div>

      <form onSubmit={(e)=>{ e.preventDefault(); }} style={{marginTop:8}}>
        <div className="profile-grid inputs">
          <input className="input" value={form.name} onChange={e=>onChange('name', e.target.value)} />
          <select className="input" value={form.gender} onChange={e=>onChange('gender', e.target.value)}>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
          <input className="input" type="number" min="10" max="120" value={form.age} onChange={e=>onChange('age', e.target.value)} />
          <input className="input" type="number" min="50" max="260" value={form.heightCm} onChange={e=>onChange('heightCm', e.target.value)} />
          <input className="input" type="number" min="20" max="500" value={form.weightKg} onChange={e=>onChange('weightKg', e.target.value)} />
          <input className="input" type="email" value={form.email} onChange={e=>onChange('email', e.target.value)} />
        </div>

        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => saveToServer(false, 'Profile saved')}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => saveToServer(true, 'Profile saved & BMI calculated')}
            disabled={saving}
          >
            {saving ? 'Processing...' : 'Save & Calculate BMI'}
          </button>

          <button type="button" className="btn" onClick={()=>navigate('/products')}>Skip</button>
        </div>
      </form>

      <div style={{display:'flex', gap:18, alignItems:'flex-start', marginTop:18, flexWrap:'wrap'}} ref={gaugeRef}>
        <div style={{flex:'0 0 360px'}}>
          {/* show live BMI while editing; server-saved profile still displayed elsewhere */}
          <BMIGauge bmi={liveBMI} size={300} />
        </div>

        <div style={{flex:'1 1 320px', minWidth:200}}>
          <div className="card" style={{padding:12}}>
            <h4 style={{marginTop:0}}>BMI details</h4>
            <p className="small">
              BMI is calculated from height and weight. The gauge shows ranges:
              <strong> yellow</strong> (slim), <strong>green</strong> (healthy), <strong>orange/red</strong> (overweight/obese).
            </p>

            <div style={{marginTop:8}}>
              <div className="small"><strong>Current BMI:</strong> { liveBMI ? liveBMI.toFixed(1) : '—' }</div>
              <div className="small"><strong>Fitness Age:</strong> { profile?.fitness_age ?? '—' }</div>
            </div>
          </div>

          <div className="card" style={{padding:12, marginTop:12}}>
            <h4 style={{marginTop:0}}>Quick Tips</h4>
            <ul style={{marginTop:6}}>
              <li className="small">Track changes monthly — small improvements compound.</li>
              <li className="small">Update weight after workouts for accurate BMI history.</li>
              <li className="small">Use profile to get personalized suggestions later.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
