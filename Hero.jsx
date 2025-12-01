// client/src/components/Hero.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IconProducts, IconUser, IconCart } from '../icons';

const asset = (name) => new URL(`../assets/${name}`, import.meta.url).href;

const CAROUSEL_ITEMS = [
  {
    id: 'c1',
    img: 'dumbbells.png',
    badge: 'Featured',
    title: 'Dumbbell Pair — 10kg',
    sub: 'Durable cast-iron pair, perfect for home & gym workouts.'
  },
  {
    id: 'c2',
    img: 'whey.png',
    badge: 'Popular',
    title: 'Whey Protein — 1kg',
    sub: 'Premium whey protein for post-workout recovery.'
  },
  {
    id: 'c3',
    img: 'yoga-mat.png',
    badge: 'Comfort',
    title: 'Yoga Mat Premium',
    sub: 'Non-slip, cushioned mat for yoga and floor workouts.'
  }
];

export default function Hero(){
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);
  const hoverRef = useRef(false);

  useEffect(()=> {
    startAuto();
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function startAuto(){
    stopAuto();
    timeoutRef.current = setInterval(()=> {
      if (!hoverRef.current) setIndex(i => (i+1) % CAROUSEL_ITEMS.length);
    }, 3500);
  }
  function stopAuto(){
    if(timeoutRef.current) { clearInterval(timeoutRef.current); timeoutRef.current = null; }
  }

  function goTo(i){
    setIndex(i % CAROUSEL_ITEMS.length);
  }
  function prev(){ setIndex(i => (i - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length); }
  function next(){ setIndex(i => (i + 1) % CAROUSEL_ITEMS.length); }

  return (
    <section className="hero card" aria-label="hero">
      <div className="hero-inner">
        <div className="hero-left">
          <div className="eyebrow fade-in" style={{'--delay':'120ms'}}>🏋️‍♂️ Fitness MVP Store</div>

          <h1 className="hero-title fade-in" style={{'--delay':'220ms'}}>
            Train better. Eat better. Live better.
          </h1>

          <p className="hero-sub fade-in" style={{'--delay':'320ms'}}>
            Shop fitness equipment and supplements from trusted brands — quick checkout, personal profile with BMI & fitness-age, and a simple admin dashboard.
          </p>

          <div className="hero-cta fade-in" style={{'--delay':'420ms'}}>
            <Link to="/products" className="btn btn-primary">Shop Products</Link>
            <Link to="/profile" className="btn btn-ghost">Create Profile</Link>
          </div>

          <div className="vertical-features fade-in" style={{'--delay':'520ms'}}>
            <div className="vf-item">
              <div className="vf-icon"><IconProducts size={18} /></div>
              <div><div className="vf-title">Wide Catalog</div><div className="vf-desc">Equipment & supplements across brands</div></div>
            </div>

            <div className="vf-item">
              <div className="vf-icon"><IconUser size={18} /></div>
              <div><div className="vf-title">Personalized BMI</div><div className="vf-desc">Profile-based BMI & fitness-age tracking</div></div>
            </div>

            <div className="vf-item">
              <div className="vf-icon"><IconCart size={18} /></div>
              <div><div className="vf-title">Secure Checkout</div><div className="vf-desc">Billing API + simple cart flow</div></div>
            </div>
          </div>
        </div>

        <div className="hero-right fade-in" style={{'--delay':'620ms'}} aria-hidden="true">
          <img src={asset('whey.png')} alt="Whey protein" className="hero-image" />
        </div>
      </div>

      {/* carousel product highlight */}
      <div
        className="product-highlight fade-in"
        style={{'--delay':'720ms'}}
        onMouseEnter={()=>{ hoverRef.current = true; }}
        onMouseLeave={()=>{ hoverRef.current = false; }}
      >
        <div className="ph-carousel" style={{ transform: `translateX(-${index * 100}%)` }}>
          {CAROUSEL_ITEMS.map(item => (
            <div className="ph-slide" key={item.id}>
              <div className="ph-left">
                <img src={asset(item.img)} alt={item.title} className="ph-img" />
              </div>
              <div className="ph-right">
                <div className="ph-badge">{item.badge}</div>
                <div className="ph-title">{item.title}</div>
                <div className="ph-sub">{item.sub}</div>
                <div style={{marginTop:12}}>
                  <Link to="/products" className="btn btn-primary">Shop Now</Link>
                  <button className="btn btn-ghost" style={{marginLeft:10}}>Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ph-controls">
          <button className="btn" onClick={prev} aria-label="Prev">‹</button>
          <button className="btn" onClick={next} aria-label="Next">›</button>
          <div style={{display:'flex', gap:6, alignItems:'center', marginLeft:8}}>
            {CAROUSEL_ITEMS.map((_, i) => (
              <div key={i} className={`ph-dot ${i===index ? 'active' : ''}`} onClick={()=>goTo(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
