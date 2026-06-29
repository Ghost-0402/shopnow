import { useState, useReducer, useRef, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
import AdminDashboard from "./AdminDashboard";

// ── CURRENCY ──────────────────────────────────────────────────────────────────
const ZMW = (v) => `K ${(parseFloat(v)||0).toLocaleString("en-ZM",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── PRODUCTS FALLBACK ─────────────────────────────────────────────────────────
const FALLBACK = [
  { id:"f1",  name:"Arc Desk Lamp",        category:"Home",    price:2363, rating:4.8, reviews_count:214,  badge:"Bestseller", image_url:"🪔", description:"360° adjustable arm, warm/cool modes.", stock_qty:12, seller_name:"ShopNow Official" },
  { id:"f2",  name:"Merino Wool Tee",      category:"Fashion", price:1723, rating:4.6, reviews_count:389,  badge:"New",        image_url:"👕", description:"Ultra-soft 100% merino, odor-resistant.", stock_qty:8,  seller_name:"ShopNow Official" },
  { id:"f3",  name:"Ceramic Pour-Over",    category:"Kitchen", price:1431, rating:4.9, reviews_count:502,  badge:"Top Rated",  image_url:"☕", description:"Hand-thrown ceramic dripper + carafe.", stock_qty:20, seller_name:"ShopNow Official" },
  { id:"f4",  name:"Wireless Earbuds Pro", category:"Tech",    price:3949, rating:4.7, reviews_count:1203, badge:"Hot",        image_url:"🎧", description:"ANC, 30hr battery, IPX5.", stock_qty:5,  seller_name:"ShopNow Official" },
  { id:"f5",  name:"Linen Throw Blanket",  category:"Home",    price:2067, rating:4.5, reviews_count:167,  badge:"",           image_url:"🛋️", description:"Stone-washed linen, 130×170cm.", stock_qty:15, seller_name:"ShopNow Official" },
  { id:"f6",  name:"Leather Card Wallet",  category:"Fashion", price:1113, rating:4.8, reviews_count:723,  badge:"Bestseller", image_url:"👛", description:"Full-grain leather, slim 4mm, RFID.", stock_qty:30, seller_name:"ShopNow Official" },
  { id:"f7",  name:"Matcha Whisk Kit",     category:"Kitchen", price:1007, rating:4.7, reviews_count:298,  badge:"",           image_url:"🍵", description:"Bamboo chasen, chawan bowl, scoop.", stock_qty:18, seller_name:"ShopNow Official" },
  { id:"f8",  name:"USB-C Hub 8-in-1",    category:"Tech",    price:1564, rating:4.6, reviews_count:891,  badge:"New",        image_url:"🔌", description:"4K HDMI, 100W PD, SD/TF, 3×USB-A.", stock_qty:22, seller_name:"ShopNow Official" },
  { id:"f9",  name:"Soy Candle Set",       category:"Home",    price:1219, rating:4.9, reviews_count:445,  badge:"Top Rated",  image_url:"🕯️", description:"Set of 3: cedar, fig, bergamot.", stock_qty:10, seller_name:"ShopNow Official" },
  { id:"f10", name:"Slim Fit Chinos",      category:"Fashion", price:2597, rating:4.5, reviews_count:312,  badge:"",           image_url:"👖", description:"Stretch cotton, tapered cut, 5 colors.", stock_qty:7,  seller_name:"ShopNow Official" },
  { id:"f11", name:"Cold Brew Maker",      category:"Kitchen", price:1193, rating:4.8, reviews_count:567,  badge:"Hot",        image_url:"🫙", description:"1L borosilicate glass, fine-mesh filter.", stock_qty:14, seller_name:"ShopNow Official" },
  { id:"f12", name:"Mechanical Keyboard",  category:"Tech",    price:3419, rating:4.7, reviews_count:2041, badge:"Bestseller", image_url:"⌨️", description:"TKL, hot-swap switches, per-key RGB.", stock_qty:6,  seller_name:"ShopNow Official" },
];

const CATEGORIES  = ["All","Home","Fashion","Kitchen","Tech"];
const CITIES      = ["Lusaka","Kitwe","Ndola","Livingstone","Chipata","Solwezi","Kabwe","Chingola"];
const SELLER_CATS = ["Home & Living","Fashion","Kitchen","Electronics & Tech","Health & Beauty","Sports","Baby & Kids","Food","Other"];

// ── CART REDUCER ──────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch(action.type) {
    case "ADD": {
      const ex = state.find(i=>i.id===action.product.id);
      if(ex) return state.map(i=>i.id===action.product.id?{...i,qty:i.qty+1}:i);
      return [...state,{...action.product,qty:1}];
    }
    case "REMOVE": return state.filter(i=>i.id!==action.id);
    case "QTY":    return state.map(i=>i.id===action.id?{...i,qty:Math.max(1,i.qty+action.delta)}:i);
    case "CLEAR":  return [];
    default: return state;
  }
}

// ── REDIRECT HELPER ───────────────────────────────────────────────────────────
// Single function used everywhere to decide where to send a user
function getPageForRole(role) {
  if(role === "admin")  return "admin";
  if(role === "seller") return "seller";
  return "shop";
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --ink:#0f0f0f;--smoke:#f8f9fa;--white:#fff;--slate:#6b7280;--border:#e5e7eb;
    --accent:#2563eb;--accent2:#7c3aed;--green:#16a34a;--greenBg:#f0fdf4;
    --red:#dc2626;--redBg:#fef2f2;--gold:#d97706;--goldBg:#fffbeb;
    --radius:12px;--shadow:0 2px 12px rgba(0,0,0,.07);--shadow-md:0 4px 24px rgba(0,0,0,.11);
    --tr:.18s cubic-bezier(.4,0,.2,1);
  }
  body{font-family:'DM Sans',sans-serif;background:var(--smoke);color:var(--ink);}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
  @keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastIn{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}

  .loading-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f0f0f 0%,#1e1b4b 60%,#312e81 100%);color:#fff;gap:16px;}
  .loading-logo{font-family:'DM Serif Display';font-size:36px;}
  .loading-logo span{color:#818cf8;}
  .spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,.2);border-top-color:#818cf8;border-radius:50%;animation:spin .8s linear infinite;}
  .spinner.dark{border-color:rgba(0,0,0,.1);border-top-color:var(--accent);}
  .loading-text{font-size:13px;color:#a5b4fc;}

  /* AUTH */
  .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f0f0f 0%,#1e1b4b 60%,#312e81 100%);padding:24px;}
  .auth-card{background:var(--white);border-radius:20px;padding:36px;width:100%;max-width:420px;box-shadow:0 24px 80px rgba(0,0,0,.3);}
  .auth-logo{font-family:'DM Serif Display';font-size:26px;text-align:center;margin-bottom:4px;}
  .auth-logo span{color:var(--accent);}
  .auth-sub{text-align:center;font-size:13px;color:var(--slate);margin-bottom:22px;}
  .auth-tabs{display:flex;background:var(--smoke);border-radius:10px;padding:4px;margin-bottom:20px;}
  .auth-tab{flex:1;padding:9px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;cursor:pointer;color:var(--slate);transition:all var(--tr);}
  .auth-tab.active{background:var(--white);color:var(--accent);font-weight:600;box-shadow:var(--shadow);}
  .role-select{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
  .role-btn{padding:12px;border:2px solid var(--border);border-radius:10px;cursor:pointer;text-align:center;font-size:13px;font-weight:500;transition:all var(--tr);background:var(--white);}
  .role-btn.selected{border-color:var(--accent);background:#eff6ff;color:var(--accent);}
  .role-icon{font-size:22px;display:block;margin-bottom:3px;}
  .auth-label{display:block;font-size:12px;font-weight:600;margin-bottom:5px;margin-top:12px;}
  .auth-input{width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:inherit;outline:none;transition:border-color var(--tr);background:var(--white);color:var(--ink);}
  .auth-input:focus{border-color:var(--accent);}
  .auth-btn{width:100%;padding:13px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:14px;transition:all var(--tr);display:flex;align-items:center;justify-content:center;gap:8px;}
  .auth-btn:disabled{opacity:.6;cursor:not-allowed;}
  .auth-err{background:var(--redBg);color:var(--red);border-radius:8px;padding:9px 13px;font-size:13px;margin-top:10px;border:1px solid #fecaca;}
  .auth-ok{background:var(--greenBg);color:var(--green);border-radius:8px;padding:9px 13px;font-size:13px;margin-top:10px;border:1px solid #bbf7d0;}
  .auth-switch{text-align:center;font-size:13px;color:var(--slate);margin-top:12px;}
  .auth-switch span{color:var(--accent);cursor:pointer;font-weight:600;}

  /* NAV */
  .nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;padding:0 24px;height:62px;}
  .nav-logo{font-family:'DM Serif Display';font-size:22px;cursor:pointer;flex-shrink:0;}
  .nav-logo span{color:var(--accent);}
  .nav-search{flex:1;max-width:420px;display:flex;align-items:center;background:var(--smoke);border:1.5px solid var(--border);border-radius:40px;padding:0 14px;gap:8px;transition:border-color var(--tr);}
  .nav-search:focus-within{border-color:var(--accent);}
  .nav-search input{flex:1;border:none;background:transparent;font-size:14px;outline:none;padding:9px 0;color:var(--ink);}
  .nav-actions{display:flex;align-items:center;gap:8px;margin-left:auto;}
  .nav-btn{display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:40px;border:1.5px solid var(--border);font-size:13px;font-weight:500;cursor:pointer;background:var(--white);transition:all var(--tr);}
  .nav-btn:hover{border-color:var(--accent);color:var(--accent);}
  .nav-btn.primary{background:var(--accent);color:#fff;border-color:var(--accent);}
  .nav-btn.primary:hover{background:#1d4ed8;}
  .cart-badge{background:var(--red);color:#fff;border-radius:50%;font-size:10px;font-weight:700;min-width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center;padding:0 3px;}

  /* USER DROPDOWN */
  .user-menu{position:relative;}
  .user-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;transition:border-color var(--tr);}
  .user-av:hover{border-color:var(--accent);}
  .user-dd{position:absolute;right:0;top:42px;background:var(--white);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.15);min-width:210px;padding:6px;z-index:200;animation:ddIn .15s;}
  .dd-head{padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:4px;}
  .dd-name{font-weight:600;font-size:14px;}
  .dd-email{font-size:11px;color:var(--slate);}
  .dd-role{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-top:2px;}
  .dd-item{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--ink);transition:background var(--tr);border:none;background:none;width:100%;text-align:left;}
  .dd-item:hover{background:var(--smoke);}
  .dd-item.danger{color:var(--red);}
  .dd-item.danger:hover{background:var(--redBg);}

  /* HERO */
  .hero{background:linear-gradient(135deg,#0f0f0f 0%,#1e1b4b 60%,#312e81 100%);color:#fff;padding:64px 40px;text-align:center;position:relative;overflow:hidden;}
  .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 120%,rgba(37,99,235,.35) 0%,transparent 70%);}
  .hero-eyebrow{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#818cf8;border:1px solid rgba(129,140,248,.3);border-radius:40px;padding:4px 12px;margin-bottom:16px;}
  .hero h1{font-family:'DM Serif Display';font-size:clamp(32px,5vw,64px);line-height:1.1;margin-bottom:14px;position:relative;}
  .hero h1 em{font-style:normal;color:#818cf8;}
  .hero p{font-size:16px;color:#a5b4fc;max-width:440px;margin:0 auto 28px;line-height:1.6;position:relative;}
  .hero-ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative;}
  .hero-cta{padding:12px 28px;border-radius:40px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all var(--tr);}
  .hero-cta.shop{background:#fff;color:#1e1b4b;}
  .hero-cta.shop:hover{background:#ede9fe;transform:translateY(-2px);}
  .hero-cta.sell{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.3);}
  .hero-cta.sell:hover{background:rgba(255,255,255,.08);transform:translateY(-2px);}

  /* STATS */
  .stats-bar{display:flex;justify-content:center;background:var(--white);border-bottom:1px solid var(--border);flex-wrap:wrap;}
  .stat{padding:18px 36px;text-align:center;border-right:1px solid var(--border);flex:1;min-width:130px;}
  .stat:last-child{border-right:none;}
  .stat-n{font-family:'DM Serif Display';font-size:26px;color:var(--accent);}
  .stat-l{font-size:11px;color:var(--slate);margin-top:2px;}

  /* SHOP */
  .shop-layout{display:flex;min-height:80vh;}
  .sidebar{width:210px;flex-shrink:0;padding:24px 16px;background:var(--white);border-right:1px solid var(--border);position:sticky;top:62px;height:calc(100vh - 62px);overflow-y:auto;}
  .sidebar h3{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--slate);margin-bottom:8px;}
  .cat-btn{width:100%;text-align:left;padding:8px 10px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:500;color:var(--slate);transition:all var(--tr);display:flex;align-items:center;gap:7px;}
  .cat-btn:hover{background:#f0f4ff;color:var(--accent);}
  .cat-btn.active{background:#eff6ff;color:var(--accent);font-weight:600;}
  .filter-sec{margin-top:24px;}
  .price-range{display:flex;flex-direction:column;gap:6px;}
  .price-range input[type=range]{accent-color:var(--accent);}
  .price-lbl{font-size:12px;color:var(--ink);font-weight:500;}
  .sort-sel{width:100%;padding:8px 9px;border-radius:8px;border:1.5px solid var(--border);font-size:12px;background:var(--smoke);cursor:pointer;outline:none;margin-top:4px;}
  .shop-main{flex:1;padding:24px;}
  .sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
  .sec-title{font-family:'DM Serif Display';font-size:24px;}
  .result-count{font-size:12px;color:var(--slate);}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px;}

  /* PRODUCT CARD */
  .card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);transition:all var(--tr);overflow:hidden;display:flex;flex-direction:column;}
  .card:hover{box-shadow:var(--shadow-md);transform:translateY(-3px);}
  .card-img{height:150px;display:flex;align-items:center;justify-content:center;font-size:58px;background:linear-gradient(135deg,#f8f7ff,#eff6ff);position:relative;overflow:hidden;}
  .card-img img{width:100%;height:100%;object-fit:cover;}
  .card-badge{position:absolute;top:8px;left:8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 8px;border-radius:40px;}
  .badge-Bestseller{background:#fef3c7;color:#92400e;}
  .badge-New{background:#d1fae5;color:#065f46;}
  .badge-Hot{background:#fee2e2;color:#991b1b;}
  .badge-Top{background:#ede9fe;color:#5b21b6;}
  .card-body{padding:12px 14px 14px;flex:1;display:flex;flex-direction:column;}
  .card-cat{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--slate);margin-bottom:3px;}
  .card-name{font-weight:600;font-size:14px;line-height:1.3;margin-bottom:3px;}
  .card-seller{font-size:11px;color:var(--slate);margin-bottom:5px;}
  .card-desc{font-size:11px;color:var(--slate);line-height:1.4;flex:1;margin-bottom:10px;}
  .card-foot{display:flex;align-items:center;justify-content:space-between;gap:6px;}
  .card-price{font-family:'DM Serif Display';font-size:17px;}
  .card-stars{font-size:11px;color:var(--slate);}
  .stars{color:#f59e0b;font-size:12px;}
  .add-btn{padding:8px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all var(--tr);width:100%;margin-top:8px;}
  .add-btn:hover{background:#1d4ed8;}
  .add-btn.added{background:var(--green);}

  /* CART */
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;animation:fadeIn .2s;}
  .drawer{position:fixed;right:0;top:0;bottom:0;width:min(400px,100vw);background:var(--white);z-index:201;box-shadow:-8px 0 40px rgba(0,0,0,.12);display:flex;flex-direction:column;animation:slideIn .25s cubic-bezier(.4,0,.2,1);}
  .drawer-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);}
  .drawer-head h2{font-family:'DM Serif Display';font-size:20px;}
  .close-btn{background:var(--smoke);border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:16px;transition:background var(--tr);}
  .close-btn:hover{background:var(--redBg);}
  .drawer-items{flex:1;overflow-y:auto;padding:14px 22px;display:flex;flex-direction:column;gap:14px;}
  .cart-item{display:flex;gap:12px;align-items:flex-start;padding:12px;background:var(--smoke);border-radius:10px;}
  .ci-img{font-size:32px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:8px;flex-shrink:0;overflow:hidden;}
  .ci-img img{width:100%;height:100%;object-fit:cover;}
  .ci-info{flex:1;}
  .ci-name{font-weight:600;font-size:13px;}
  .ci-price{font-size:12px;color:var(--slate);margin-top:2px;}
  .qty-ctrl{display:flex;align-items:center;gap:8px;margin-top:7px;}
  .qty-btn{width:26px;height:26px;border-radius:6px;border:1.5px solid var(--border);background:#fff;cursor:pointer;font-size:15px;font-weight:600;line-height:1;transition:all var(--tr);}
  .qty-btn:hover{border-color:var(--accent);color:var(--accent);}
  .qty-n{font-weight:600;font-size:13px;min-width:18px;text-align:center;}
  .rm-btn{background:none;border:none;color:#d1d5db;cursor:pointer;font-size:16px;padding:4px;transition:color var(--tr);}
  .rm-btn:hover{color:var(--red);}
  .empty-cart{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--slate);}
  .empty-cart span{font-size:56px;}
  .drawer-foot{padding:18px 22px;border-top:1px solid var(--border);}
  .sub-row{display:flex;justify-content:space-between;font-size:13px;color:var(--slate);margin-bottom:7px;}
  .total-row{display:flex;justify-content:space-between;font-weight:700;font-size:17px;margin-bottom:14px;}
  .checkout-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:all var(--tr);}
  .checkout-btn:hover{opacity:.9;}

  /* CHECKOUT */
  .page{max-width:900px;margin:0 auto;padding:40px 24px;}
  .page h2{font-family:'DM Serif Display';font-size:32px;margin-bottom:24px;}
  .back-btn{background:none;border:none;cursor:pointer;color:var(--slate);font-size:13px;margin-bottom:14px;display:flex;align-items:center;gap:5px;padding:0;}
  .co-grid{display:grid;grid-template-columns:1fr 340px;gap:28px;}
  .co-sec{background:var(--white);border-radius:var(--radius);padding:22px;box-shadow:var(--shadow);margin-bottom:18px;border:1px solid var(--border);}
  .co-sec h3{font-size:15px;font-weight:600;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);}
  .co-summary{background:var(--white);border-radius:var(--radius);padding:22px;box-shadow:var(--shadow);position:sticky;top:80px;border:1px solid var(--border);}
  .co-summary h3{font-size:15px;font-weight:600;margin-bottom:14px;}
  .sum-item{display:flex;justify-content:space-between;font-size:13px;padding:7px 0;border-bottom:1px solid #f7f7f7;}
  .sum-total{display:flex;justify-content:space-between;font-weight:700;font-size:16px;padding-top:10px;margin-top:4px;}
  .place-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:14px;transition:all var(--tr);display:flex;align-items:center;justify-content:center;gap:8px;}
  .place-btn:disabled{opacity:.6;cursor:not-allowed;}
  .secure{display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:var(--slate);margin-top:10px;}
  .pay-methods{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
  .pay-m{padding:10px;border:2px solid var(--border);border-radius:9px;cursor:pointer;text-align:center;font-size:12px;font-weight:500;transition:all var(--tr);background:var(--white);}
  .pay-m.sel{border-color:var(--accent);background:#eff6ff;color:var(--accent);}
  .pay-icon{font-size:20px;display:block;margin-bottom:3px;}
  .zmw-note{background:var(--greenBg);border:1px solid #bbf7d0;border-radius:8px;padding:9px 12px;font-size:12px;color:var(--green);margin-top:10px;}
  .fg{margin-bottom:14px;}
  .fg label{display:block;font-size:12px;font-weight:600;margin-bottom:5px;}
  .fi{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;font-family:inherit;outline:none;transition:border-color var(--tr);background:var(--white);color:var(--ink);}
  .fi:focus{border-color:var(--accent);}
  .fr{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

  /* ORDERS */
  .orders-page{max-width:760px;margin:0 auto;padding:40px 24px;}
  .orders-page h2{font-family:'DM Serif Display';font-size:32px;margin-bottom:24px;}
  .order-card{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);padding:18px;margin-bottom:14px;box-shadow:var(--shadow);}
  .order-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
  .order-num{font-weight:700;font-size:14px;}
  .order-date{font-size:12px;color:var(--slate);}
  .order-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:40px;background:var(--goldBg);color:var(--gold);}
  .order-badge.Delivered{background:var(--greenBg);color:var(--green);}

  /* SUCCESS */
  .success-page{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;}
  .success-icon{font-size:72px;margin-bottom:20px;}
  .success-page h2{font-family:'DM Serif Display';font-size:36px;margin-bottom:10px;}
  .success-page p{color:var(--slate);font-size:15px;max-width:380px;line-height:1.6;margin-bottom:8px;}

  /* SELLER DASH */
  .seller-app{display:flex;min-height:100vh;}
  .s-sidebar{width:210px;flex-shrink:0;background:var(--ink);color:#fff;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;}
  .s-logo{padding:20px 18px 14px;border-bottom:1px solid rgba(255,255,255,.08);}
  .s-logo h1{font-family:'DM Serif Display';font-size:20px;}
  .s-logo h1 span{color:#818cf8;}
  .s-logo p{font-size:11px;color:#9ca3af;margin-top:2px;}
  .s-nav{padding:14px 10px;flex:1;}
  .s-sec{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;padding:0 8px;margin:14px 0 5px;}
  .s-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:13px;font-weight:500;color:#9ca3af;cursor:pointer;transition:all var(--tr);margin-bottom:2px;border:none;background:none;width:100%;text-align:left;}
  .s-item:hover{background:rgba(255,255,255,.06);color:#fff;}
  .s-item.active{background:rgba(99,102,241,.2);color:#818cf8;}
  .s-foot{padding:14px 10px;border-top:1px solid rgba(255,255,255,.08);}
  .s-profile{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.05);}
  .s-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;}
  .s-name{font-size:12px;font-weight:600;color:#fff;}
  .s-status{font-size:10px;color:#6b7280;}
  .s-main{flex:1;display:flex;flex-direction:column;min-width:0;}
  .s-topbar{background:var(--white);border-bottom:1px solid var(--border);padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
  .s-topbar h2{font-size:16px;font-weight:600;}
  .s-topbar p{font-size:11px;color:var(--slate);}
  .tb-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all var(--tr);border:1.5px solid var(--border);background:var(--white);display:flex;align-items:center;gap:5px;}
  .tb-btn:hover{border-color:var(--accent);color:var(--accent);}
  .tb-btn.primary{background:var(--accent);color:#fff;border-color:var(--accent);}
  .s-content{padding:24px;flex:1;}
  .s-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
  .s-stat{background:var(--white);border-radius:var(--radius);padding:16px 18px;box-shadow:var(--shadow);border:1px solid var(--border);}
  .s-stat-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
  .s-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;}
  .s-num{font-family:'DM Serif Display';font-size:24px;}
  .s-lbl{font-size:11px;color:var(--slate);margin-top:1px;}
  .tabs{display:flex;gap:4px;background:var(--smoke);border-radius:10px;padding:4px;margin-bottom:20px;width:fit-content;}
  .tab{padding:7px 16px;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;color:var(--slate);border:none;background:transparent;transition:all var(--tr);}
  .tab.active{background:var(--white);color:var(--accent);font-weight:600;box-shadow:var(--shadow);}
  .form-grid{display:grid;grid-template-columns:1fr 340px;gap:22px;align-items:start;}
  .f-card{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow);overflow:hidden;margin-bottom:18px;}
  .f-card-head{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:9px;}
  .f-card-head h3{font-size:14px;font-weight:600;}
  .f-card-head p{font-size:11px;color:var(--slate);margin-top:1px;}
  .f-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
  .f-body{padding:18px;}
  .field{margin-bottom:16px;}
  .field:last-child{margin-bottom:0;}
  .field label{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;margin-bottom:5px;}
  .req{color:var(--red);}
  .input,.select,.textarea{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;font-family:inherit;color:var(--ink);background:var(--white);outline:none;transition:border-color var(--tr);}
  .input:focus,.select:focus,.textarea:focus{border-color:var(--accent);}
  .textarea{min-height:90px;resize:vertical;line-height:1.5;}
  .f-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .pfx{display:flex;align-items:center;border:1.5px solid var(--border);border-radius:9px;overflow:hidden;transition:border-color var(--tr);}
  .pfx:focus-within{border-color:var(--accent);}
  .pfx-l{padding:9px 11px;background:var(--smoke);border-right:1px solid var(--border);font-size:12px;font-weight:600;color:var(--slate);}
  .pfx-i{flex:1;padding:9px 12px;border:none;outline:none;font-size:13px;font-family:inherit;background:transparent;color:var(--ink);}
  .img-zone{border:2px dashed var(--border);border-radius:var(--radius);padding:28px 18px;text-align:center;cursor:pointer;transition:all var(--tr);background:var(--smoke);position:relative;}
  .img-zone:hover,.img-zone.drag{border-color:var(--accent);background:#eff6ff;}
  .img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;}
  .img-thumb{position:relative;border-radius:9px;overflow:hidden;aspect-ratio:1;border:2px solid var(--border);background:var(--smoke);}
  .img-thumb.primary{border-color:var(--accent);}
  .img-thumb img{width:100%;height:100%;object-fit:cover;}
  .thumb-ov{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity var(--tr);}
  .img-thumb:hover .thumb-ov{opacity:1;}
  .t-btn{width:26px;height:26px;border-radius:6px;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
  .t-btn.star{background:#2563eb;color:#fff;}
  .t-btn.del{background:#dc2626;color:#fff;}
  .pri-badge{position:absolute;top:4px;left:4px;background:var(--accent);color:#fff;font-size:8px;font-weight:700;padding:2px 5px;border-radius:4px;text-transform:uppercase;}
  .add-more{border:2px dashed var(--border);border-radius:9px;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:var(--slate);font-size:11px;gap:3px;background:var(--smoke);transition:all var(--tr);position:relative;}
  .add-more:hover{border-color:var(--accent);color:var(--accent);background:#eff6ff;}
  .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);}
  .toggle-row:last-child{border-bottom:none;padding-bottom:0;}
  .toggle-lbl{font-size:12px;font-weight:500;}
  .toggle-desc{font-size:10px;color:var(--slate);margin-top:1px;}
  .toggle{position:relative;width:38px;height:21px;flex-shrink:0;}
  .toggle input{opacity:0;width:0;height:0;}
  .tslider{position:absolute;inset:0;background:#d1d5db;border-radius:40px;cursor:pointer;transition:background var(--tr);}
  .tslider::before{content:'';position:absolute;width:15px;height:15px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform var(--tr);}
  .toggle input:checked+.tslider{background:var(--accent);}
  .toggle input:checked+.tslider::before{transform:translateX(17px);}
  .preview-sticky{position:sticky;top:76px;}
  .prev-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--slate);margin-bottom:10px;}
  .p-card{background:var(--white);border-radius:14px;border:1px solid var(--border);overflow:hidden;box-shadow:var(--shadow-md);}
  .p-img{height:200px;background:linear-gradient(135deg,#f0f4ff,#ede9fe);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
  .p-img img{width:100%;height:100%;object-fit:cover;}
  .p-placeholder{text-align:center;}
  .p-placeholder span{font-size:50px;display:block;margin-bottom:6px;}
  .p-badge{position:absolute;top:8px;left:8px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:40px;text-transform:uppercase;}
  .p-body{padding:14px;}
  .p-cat{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--slate);margin-bottom:3px;}
  .p-name{font-weight:700;font-size:15px;line-height:1.3;margin-bottom:5px;}
  .p-desc{font-size:11px;color:var(--slate);line-height:1.4;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
  .p-foot{display:flex;align-items:center;justify-content:space-between;}
  .p-price{font-family:'DM Serif Display';font-size:20px;}
  .p-stock{font-size:10px;font-weight:600;}
  .p-stock.low{color:var(--red);}
  .p-stock.ok{color:var(--green);}
  .p-add{width:100%;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-top:10px;}
  .completeness{margin-top:14px;background:var(--white);border-radius:var(--radius);border:1px solid var(--border);padding:14px;}
  .comp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
  .comp-head span{font-size:12px;font-weight:600;}
  .comp-pct{font-size:12px;font-weight:700;color:var(--accent);}
  .prog-track{height:7px;background:var(--border);border-radius:40px;overflow:hidden;}
  .prog-fill{height:100%;border-radius:40px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .4s cubic-bezier(.4,0,.2,1);}
  .comp-items{margin-top:10px;display:flex;flex-direction:column;gap:5px;}
  .c-item{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--slate);}
  .c-item.done{color:var(--green);}
  .c-dot{width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
  .c-dot.done{background:var(--greenBg);color:var(--green);}
  .c-dot.todo{background:var(--border);color:var(--slate);}
  .sub-area{display:flex;gap:8px;margin-top:18px;}
  .sub-btn{flex:1;padding:12px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;transition:all var(--tr);border:none;display:flex;align-items:center;justify-content:center;gap:6px;}
  .sub-btn.publish{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;}
  .sub-btn.draft{background:var(--smoke);color:var(--ink);border:1.5px solid var(--border);}
  .sub-btn:disabled{opacity:.6;cursor:not-allowed;}
  .prod-table{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;box-shadow:var(--shadow);}
  .t-head{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 90px;gap:10px;padding:10px 18px;background:var(--smoke);border-bottom:1px solid var(--border);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--slate);}
  .t-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 90px;gap:10px;padding:12px 18px;border-bottom:1px solid var(--border);align-items:center;transition:background var(--tr);}
  .t-row:last-child{border-bottom:none;}
  .t-row:hover{background:var(--smoke);}
  .p-info{display:flex;align-items:center;gap:10px;}
  .p-thumb{width:38px;height:38px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#ede9fe);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;overflow:hidden;}
  .p-thumb img{width:100%;height:100%;object-fit:cover;}
  .p-nm{font-weight:600;font-size:12px;}
  .p-sk{font-size:10px;color:var(--slate);margin-top:1px;}
  .s-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:40px;font-size:10px;font-weight:600;}
  .s-pill.active{background:var(--greenBg);color:var(--green);}
  .s-pill.draft{background:var(--goldBg);color:var(--gold);}
  .act-btns{display:flex;gap:5px;}
  .act-btn{width:28px;height:28px;border-radius:7px;border:1.5px solid var(--border);background:var(--white);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all var(--tr);}
  .act-btn:hover{border-color:var(--accent);background:#eff6ff;}
  .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s;}
  .modal{background:var(--white);border-radius:18px;padding:36px 32px;max-width:400px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.2);}
  .modal-icon{font-size:56px;margin-bottom:14px;}
  .modal h2{font-family:'DM Serif Display';font-size:26px;margin-bottom:7px;}
  .modal p{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:22px;}
  .modal-btns{display:flex;gap:8px;}
  .m-btn{flex:1;padding:11px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;transition:all var(--tr);}
  .m-btn.primary{background:var(--accent);color:#fff;border:none;}
  .m-btn.secondary{background:var(--smoke);color:var(--ink);border:1.5px solid var(--border);}
  .toast{position:fixed;bottom:22px;right:22px;background:var(--ink);color:#fff;padding:11px 16px;border-radius:9px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:9px;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:toastIn .25s;z-index:400;}
  .footer{background:var(--ink);color:#9ca3af;padding:40px;}
  .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px;}
  .footer-brand h3{font-family:'DM Serif Display';font-size:20px;color:#fff;margin-bottom:10px;}
  .footer-brand h3 span{color:#818cf8;}
  .footer-brand p{font-size:12px;line-height:1.7;max-width:240px;}
  .footer-col h4{font-size:11px;font-weight:600;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em;}
  .footer-col a{display:block;font-size:12px;margin-bottom:7px;color:#9ca3af;cursor:pointer;transition:color var(--tr);text-decoration:none;}
  .footer-col a:hover{color:#fff;}
  .footer-bottom{border-top:1px solid #1f2937;padding-top:20px;display:flex;justify-content:space-between;font-size:11px;flex-wrap:wrap;gap:6px;}

  @media(max-width:900px){.co-grid,.form-grid{grid-template-columns:1fr}.preview-sticky{position:static}.s-stats{grid-template-columns:repeat(2,1fr)}.footer-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:680px){.sidebar,.s-sidebar{display:none}.stats-bar .stat{min-width:50%;border-right:none;border-bottom:1px solid var(--border)}.t-head,.t-row{grid-template-columns:2fr 1fr 80px}.nav-search{max-width:160px}.hero{padding:44px 20px}.footer-grid{grid-template-columns:1fr}}
`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Stars({ r }) {
  const f=Math.floor(r||4.5), h=(r||4.5)%1>=.5;
  return <span className="stars">{"★".repeat(f)}{h?"½":""}{"☆".repeat(5-f-(h?1:0))}</span>;
}
function Toast({ t }) { if(!t) return null; return <div className="toast"><span>{t.icon}</span>{t.msg}</div>; }
function Spin({ dark=false }) {
  if(dark) return <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner dark"/></div>;
  return <div className="loading-screen"><div className="loading-logo">Shop<span>Now</span></div><div className="spinner"/><div className="loading-text">Loading…</div></div>;
}
function BtnSpin() {
  return <div style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;
}

// ── USER DROPDOWN ─────────────────────────────────────────────────────────────
function UserMenu({ profile, onPage, onLogout }) {
  const [open,setOpen]=useState(false);
  const initials=(profile?.full_name||"U").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
  const roleLabel = profile?.role==="admin" ? "🛡️ Admin" : profile?.role==="seller" ? "🏪 Seller" : "🛍️ Buyer";
  return (
    <div className="user-menu">
      <div className="user-av" onClick={()=>setOpen(o=>!o)}>{initials}</div>
      {open&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setOpen(false)}/>
          <div className="user-dd">
            <div className="dd-head">
              <div className="dd-name">{profile?.full_name||"User"}</div>
              <div className="dd-role">{roleLabel}</div>
            </div>
            <button className="dd-item" onClick={()=>{setOpen(false);onPage("orders");}}>📦 My Orders</button>
            {profile?.role==="seller"&&<button className="dd-item" onClick={()=>{setOpen(false);onPage("seller");}}>🏪 Seller Dashboard</button>}
            {profile?.role==="admin"&&<button className="dd-item" onClick={()=>{setOpen(false);onPage("admin");}}>🛡️ Admin Dashboard</button>}
            <button className="dd-item danger" onClick={()=>{setOpen(false);onLogout();}}>🚪 Sign Out</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab,setTab]=useState("login");
  const [role,setRole]=useState("buyer");
  const [form,setForm]=useState({name:"",email:"",password:"",confirm:""});
  const [err,setErr]=useState(""); const [ok,setOk]=useState(""); const [loading,setLoading]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  const login=async()=>{
    setErr(""); setLoading(true);
    try {
      const {data,error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      if(error) throw error;
      
      // ── NEW: auto-create profile if missing ──
      let { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if(!prof) {
        const { data: newProf } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name 
                       || data.user.email.split("@")[0],
            role: data.user.user_metadata?.role || "buyer"
          })
          .select()
          .single();
        prof = newProf;
      }

      if(!prof) throw new Error("Could not load profile. Try again.");
      onLogin(data.user, prof);
    } catch(e){ setErr(e.message||"Login failed."); }
    setLoading(false);
  };

  const register=async()=>{
    setErr("");
    if(!form.name||!form.email||!form.password) return setErr("Please fill in all fields.");
    if(form.password.length<6) return setErr("Password must be at least 6 characters.");
    if(form.password!==form.confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      const {data,error}=await supabase.auth.signUp({
        email:form.email.trim(),
        password:form.password,
        options:{ data:{ full_name:form.name, role } }
      });
      if(error) throw error;
      if(data.user){
        await supabase.from("profiles").upsert({
          id:data.user.id, full_name:form.name, role
        },{onConflict:"id"});
      }
      setOk("Account created! You can now sign in.");
      setTab("login"); setForm(f=>({...f,password:"",confirm:""}));
    } catch(e){ setErr(e.message||"Registration failed."); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Shop<span>Now</span></div>
        <div className="auth-sub">🇿🇲 Zambia's Modern Marketplace</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab==="login"?"active":""}`} onClick={()=>{setTab("login");setErr("");setOk("");}}>Sign In</button>
          <button className={`auth-tab ${tab==="register"?"active":""}`} onClick={()=>{setTab("register");setErr("");setOk("");}}>Create Account</button>
        </div>
        {tab==="register"&&(
          <>
            <label className="auth-label">I want to…</label>
            <div className="role-select">
              <div className={`role-btn ${role==="buyer"?"selected":""}`} onClick={()=>setRole("buyer")}><span className="role-icon">🛍️</span>Shop & Buy</div>
              <div className={`role-btn ${role==="seller"?"selected":""}`} onClick={()=>setRole("seller")}><span className="role-icon">🏪</span>Sell Products</div>
            </div>
            <label className="auth-label">Full Name</label>
            <input className="auth-input" placeholder="Mwamba Banda" value={form.name} onChange={set("name")}/>
          </>
        )}
        <label className="auth-label">Email Address</label>
        <input className="auth-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?login():register())}/>
        <label className="auth-label">Password</label>
        <input className="auth-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?login():register())}/>
        {tab==="register"&&(
          <>
            <label className="auth-label">Confirm Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} onKeyDown={e=>e.key==="Enter"&&register()}/>
          </>
        )}
        {err&&<div className="auth-err">⚠️ {err}</div>}
        {ok&&<div className="auth-ok">✅ {ok}</div>}
        <button className="auth-btn" onClick={tab==="login"?login:register} disabled={loading}>
          {loading&&<BtnSpin/>}{loading?"Please wait…":tab==="login"?"Sign In →":"Create Account →"}
        </button>
        <div className="auth-switch">
          {tab==="login"?<>No account? <span onClick={()=>{setTab("register");setErr("");}}>Create one free</span></>
            :<>Have an account? <span onClick={()=>{setTab("login");setErr("");}}>Sign in</span></>}
        </div>
      </div>
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, justAdded }) {
  const isE=product.image_url&&product.image_url.length<=4;
  const bc=product.badge?`badge-${product.badge.split(" ")[0]}`:"";
  return (
    <div className="card">
      <div className="card-img">
        {isE?<span>{product.image_url}</span>:product.image_url?<img src={product.image_url} alt={product.name}/>:<span>🛍️</span>}
        {product.badge&&<span className={`card-badge ${bc}`}>{product.badge}</span>}
      </div>
      <div className="card-body">
        <div className="card-cat">{product.category}</div>
        <div className="card-name">{product.name}</div>
        <div className="card-seller">by {product.seller_name||"ShopNow"}</div>
        <div className="card-desc">{product.description}</div>
        <div className="card-foot">
          <div className="card-price">{ZMW(product.price)}</div>
          <div className="card-stars"><Stars r={product.rating}/> {product.rating||4.5}</div>
        </div>
        {product.stock_qty<=8&&product.stock_qty>0&&<div style={{fontSize:10,color:"var(--red)",fontWeight:500,marginTop:3}}>⚡ Only {product.stock_qty} left</div>}
        {product.stock_qty===0&&<div style={{fontSize:10,color:"var(--red)",fontWeight:500,marginTop:3}}>❌ Out of stock</div>}
        <button className={`add-btn ${justAdded?"added":""}`} onClick={()=>product.stock_qty>0&&onAdd(product)} style={{opacity:product.stock_qty===0?.5:1}}>
          {justAdded?"✓ Added!":product.stock_qty===0?"Out of Stock":"Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// ── CART DRAWER ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, dispatch, onClose, onCheckout }) {
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const ship=sub>5000?0:150; const total=sub+ship;
  return (
    <><div className="overlay" onClick={onClose}/>
    <div className="drawer">
      <div className="drawer-head"><h2>🛒 Cart ({cart.reduce((s,i)=>s+i.qty,0)})</h2><button className="close-btn" onClick={onClose}>✕</button></div>
      <div className="drawer-items">
        {cart.length===0?<div className="empty-cart"><span>🛍️</span><p>Your cart is empty</p></div>
          :cart.map(item=>{
            const isE=item.image_url&&item.image_url.length<=4;
            return (
              <div key={item.id} className="cart-item">
                <div className="ci-img">{isE?<span>{item.image_url}</span>:item.image_url?<img src={item.image_url} alt=""/>:<span>🛍️</span>}</div>
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-price">{ZMW(item.price)} each</div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={()=>dispatch({type:"QTY",id:item.id,delta:-1})}>−</button>
                    <span className="qty-n">{item.qty}</span>
                    <button className="qty-btn" onClick={()=>dispatch({type:"QTY",id:item.id,delta:1})}>+</button>
                    <span style={{marginLeft:"auto",fontWeight:600,fontSize:13}}>{ZMW(item.price*item.qty)}</span>
                  </div>
                </div>
                <button className="rm-btn" onClick={()=>dispatch({type:"REMOVE",id:item.id})}>🗑</button>
              </div>
            );
          })}
      </div>
      {cart.length>0&&(
        <div className="drawer-foot">
          <div className="sub-row"><span>Subtotal</span><span>{ZMW(sub)}</span></div>
          <div className="sub-row"><span>Delivery</span><span>{ship===0?"Free 🎉":ZMW(ship)}</span></div>
          {ship>0&&<div className="sub-row" style={{color:"var(--accent)",fontSize:11}}>Spend {ZMW(5000-sub)} more for free delivery!</div>}
          <div className="total-row"><span>Total</span><span>{ZMW(total)}</span></div>
          <button className="checkout-btn" onClick={onCheckout}>Proceed to Checkout →</button>
        </div>
      )}
    </div></>
  );
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
function CheckoutPage({ cart, user, profile, onSuccess, onBack, showToast }) {
  const [pay,setPay]=useState("airtel"); const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({fname:profile?.full_name?.split(" ")[0]||"",lname:profile?.full_name?.split(" ")[1]||"",phone:"",address:"",city:"Lusaka",mobile:""});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const ship=sub>5000?0:150; const total=sub+ship;
  const PAYS=[{id:"airtel",icon:"📱",label:"Airtel Money"},{id:"mtn",icon:"🟡",label:"MTN Money"},{id:"zamtel",icon:"🟢",label:"Zamtel"},{id:"visa",icon:"💳",label:"Visa/MC"}];

  const place=async()=>{
    if(!form.fname||!form.phone||!form.address){showToast("Fill in all required fields","⚠️");return;}
    setLoading(true);
    try {
      const orderNum=`ORD-${Date.now()}`;
      const {data:order,error}=await supabase.from("orders").insert({
        buyer_id:user.id,order_number:orderNum,status:"Processing",total_amount:total,
        shipping_address:{name:`${form.fname} ${form.lname}`,phone:form.phone,line1:form.address,city:form.city},
        payment_method:pay,payment_status:"pending",
      }).select().single();
      if(error) throw error;
      await supabase.from("order_items").insert(
        cart.map(i=>({order_id:order.id,product_id:typeof i.id==="string"&&i.id.startsWith("f")?null:i.id,product_name:i.name,product_image:i.image_url,quantity:i.qty,unit_price:i.price}))
      );
      onSuccess(orderNum,total,pay);
    } catch(e){ showToast("Error: "+e.message,"❌"); }
    setLoading(false);
  };

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Back to Cart</button>
      <h2>Checkout</h2>
      <div className="co-grid">
        <div>
          <div className="co-sec">
            <h3>📦 Delivery Details</h3>
            <div className="fr">
              <div className="fg"><label>First Name *</label><input className="fi" value={form.fname} onChange={set("fname")}/></div>
              <div className="fg"><label>Last Name</label><input className="fi" value={form.lname} onChange={set("lname")}/></div>
            </div>
            <div className="fg"><label>Phone *</label><input className="fi" placeholder="+260 97 000 0000" value={form.phone} onChange={set("phone")}/></div>
            <div className="fg"><label>Address *</label><input className="fi" placeholder="House no, Street" value={form.address} onChange={set("address")}/></div>
            <div className="fg"><label>City</label><select className="fi" value={form.city} onChange={set("city")}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="co-sec">
            <h3>💰 Payment Method</h3>
            <div className="pay-methods">{PAYS.map(m=>(
              <button key={m.id} className={`pay-m ${pay===m.id?"sel":""}`} onClick={()=>setPay(m.id)}>
                <span className="pay-icon">{m.icon}</span>{m.label}
              </button>
            ))}</div>
            {(pay==="airtel"||pay==="mtn"||pay==="zamtel")&&(
              <><div className="fg"><label>Mobile Number *</label><input className="fi" placeholder="+260 97 000 0000" value={form.mobile} onChange={set("mobile")}/></div>
              <div className="zmw-note">📲 Enter your number. You'll receive a payment prompt for {ZMW(total)}.</div></>
            )}
            {pay==="visa"&&(
              <><div className="fg"><label>Card Number</label><input className="fi" placeholder="4242 4242 4242 4242"/></div>
              <div className="fr"><div className="fg"><label>Expiry</label><input className="fi" placeholder="MM/YY"/></div><div className="fg"><label>CVV</label><input className="fi" placeholder="123"/></div></div></>
            )}
          </div>
        </div>
        <div>
          <div className="co-summary">
            <h3>Order Summary</h3>
            {cart.map(i=><div key={i.id} className="sum-item"><span>{i.name} ×{i.qty}</span><span>{ZMW(i.price*i.qty)}</span></div>)}
            <div className="sum-item"><span>Delivery</span><span>{ship===0?"Free":ZMW(ship)}</span></div>
            <div className="sum-total"><span>Total</span><span>{ZMW(total)}</span></div>
            <button className="place-btn" onClick={place} disabled={loading}>
              {loading&&<BtnSpin/>}{loading?"Placing Order…":"Place Order →"}
            </button>
            <div className="secure">🔒 Secured &amp; Protected</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ORDERS PAGE ───────────────────────────────────────────────────────────────
function OrdersPage({ user, onBack }) {
  const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.from("orders").select("*, order_items(*)").eq("buyer_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>{setOrders(data||[]);setLoading(false);});
  },[user.id]);
  return (
    <div className="orders-page">
      <button className="back-btn" onClick={onBack}>← Back to Shop</button>
      <h2>My Orders</h2>
      {loading?<Spin dark/>
        :orders.length===0
          ?<div style={{textAlign:"center",padding:"60px 0",color:"var(--slate)"}}><div style={{fontSize:48,marginBottom:12}}>📦</div><p style={{fontWeight:600}}>No orders yet</p></div>
          :orders.map(o=>(
            <div key={o.id} className="order-card">
              <div className="order-head">
                <span className="order-num">{o.order_number}</span>
                <span className="order-date">{new Date(o.created_at).toLocaleDateString("en-ZM",{day:"numeric",month:"short",year:"numeric"})}</span>
                <span className={`order-badge ${o.status}`}>{o.status}</span>
              </div>
              <div style={{fontSize:13,color:"var(--slate)",marginBottom:6}}>{o.order_items?.map(i=>`${i.product_name} ×${i.quantity}`).join(" · ")}</div>
              <div style={{fontWeight:700,fontSize:14}}>Total: {ZMW(o.total_amount)}</div>
              <div style={{fontSize:12,color:"var(--slate)",marginTop:2}}>via {o.payment_method?.toUpperCase()}</div>
            </div>
          ))
      }
    </div>
  );
}

// ── SELLER DASHBOARD ──────────────────────────────────────────────────────────
function SellerDash({ user, profile, onExit, showToast }) {
  const [nav,setNav]=useState("products"); const [tab,setTab]=useState("list");
  const [products,setProducts]=useState([]); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const [showModal,setShowModal]=useState(false); const [drag,setDrag]=useState(false);
  const [images,setImages]=useState([]); const [primaryImg,setPrimaryImg]=useState(0);
  const [settings,setSettings]=useState({published:true,freeShipping:false,trackInventory:true});
  const [form,setForm]=useState({name:"",category:"",price:"",comparePrice:"",sku:"",stock:"",description:""});
  const fileRef=useRef(); const addRef=useRef();
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  useEffect(()=>{ loadProducts(); },[]);

  const loadProducts=async()=>{
    setLoading(true);
    const {data:seller}=await supabase.from("sellers").select("id").eq("user_id",user.id).single();
    if(seller){
      const {data:prods}=await supabase.from("products").select("*").eq("seller_id",seller.id).order("created_at",{ascending:false});
      setProducts(prods||[]);
    }
    setLoading(false);
  };

  const handleFiles=useCallback((files)=>{
    const imgs=Array.from(files).slice(0,8-images.length).map(f=>({url:URL.createObjectURL(f),file:f}));
    setImages(p=>[...p,...imgs]); showToast(`${imgs.length} image(s) added`,"🖼️");
  },[images]);

  const checks=[
    {label:"Product name",done:form.name.length>2},{label:"Category",done:!!form.category},
    {label:"Price set",done:!!form.price},{label:"Description",done:form.description.length>10},
    {label:"Stock quantity",done:!!form.stock},
  ];
  const pct=Math.round(checks.filter(c=>c.done).length/checks.length*100);

  const publish=async(draft=false)=>{
    if(!form.name) return showToast("Add a product name","⚠️");
    if(!form.price) return showToast("Set a price","⚠️");
    setSaving(true);
    try {
      let {data:seller}=await supabase.from("sellers").select("id").eq("user_id",user.id).single();
      if(!seller){
        const {data:ns}=await supabase.from("sellers").insert({user_id:user.id,store_name:(profile?.full_name||"Seller")+"'s Store",status:"approved"}).select().single();
        seller=ns;
      }
      const {error}=await supabase.from("products").insert({
        seller_id:seller.id,name:form.name,description:form.description,
        price:parseFloat(form.price),compare_price:form.comparePrice?parseFloat(form.comparePrice):null,
        category:form.category||"Other",stock_qty:parseInt(form.stock)||0,
        badge:draft?"":"New",status:draft?"draft":"active",image_url:"🛍️",
      });
      if(error) throw error;
      showToast(draft?"Saved as draft!":"Product published!","✅");
      setForm({name:"",category:"",price:"",comparePrice:"",sku:"",stock:"",description:""}); setImages([]);
      if(!draft) setShowModal(true);
      loadProducts(); setTab("list");
    } catch(e){ showToast("Error: "+e.message,"❌"); }
    setSaving(false);
  };

  const deleteProduct=async(id)=>{
    if(!window.confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id",id);
    setProducts(prev=>prev.filter(p=>p.id!==id)); showToast("Deleted","🗑️");
  };

  return (
    <div className="seller-app">
      <aside className="s-sidebar">
        <div className="s-logo"><h1>Shop<span>Now</span></h1><p>Seller Dashboard</p></div>
        <nav className="s-nav">
          <div className="s-sec">Main</div>
          {[{id:"products",icon:"📦",label:"Products"},{id:"orders",icon:"🛒",label:"Orders"},{id:"analytics",icon:"📈",label:"Analytics"}].map(i=>(
            <button key={i.id} className={`s-item ${nav===i.id?"active":""}`} onClick={()=>setNav(i.id)}>{i.icon} {i.label}</button>
          ))}
        </nav>
        <div className="s-foot">
          <div className="s-profile">
            <div className="s-av">{(profile?.full_name||"S").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
            <div><div className="s-name">{profile?.full_name||"Seller"}</div><div className="s-status">✅ Active Seller</div></div>
          </div>
          <button className="s-item" style={{marginTop:8,color:"#f87171"}} onClick={onExit}>🛍️ Back to Shop</button>
        </div>
      </aside>
      <div className="s-main">
        <header className="s-topbar">
          <div><h2>Products</h2><p>Manage your listings</p></div>
          <div style={{display:"flex",gap:8}}>
            <button className="tb-btn" onClick={onExit}>🛍️ View Shop</button>
            <button className="tb-btn primary" onClick={()=>setTab("add")}>+ Add Product</button>
          </div>
        </header>
        <div className="s-content">
          <div className="s-stats">
            {[{icon:"📦",label:"Products",value:products.length,bg:"#eff6ff"},{icon:"✅",label:"Active",value:products.filter(p=>p.status==="active").length,bg:"#f0fdf4"},{icon:"📝",label:"Drafts",value:products.filter(p=>p.status==="draft").length,bg:"#fffbeb"},{icon:"💰",label:"Revenue",value:"K —",bg:"#fdf4ff"}].map(s=>(
              <div key={s.label} className="s-stat">
                <div className="s-stat-top"><div className="s-icon" style={{background:s.bg}}>{s.icon}</div></div>
                <div className="s-num">{s.value}</div><div className="s-lbl">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="tabs">
            <button className={`tab ${tab==="add"?"active":""}`} onClick={()=>setTab("add")}>➕ Add Product</button>
            <button className={`tab ${tab==="list"?"active":""}`} onClick={()=>setTab("list")}>📋 My Products ({products.length})</button>
          </div>

          {tab==="add"&&(
            <div className="form-grid">
              <div>
                <div className="f-card">
                  <div className="f-card-head"><div className="f-icon" style={{background:"#eff6ff"}}>📝</div><div><h3>Basic Info</h3></div></div>
                  <div className="f-body">
                    <div className="field"><label>Product Name <span className="req">*</span></label><input className="input" placeholder="e.g. Handmade Zambian Basket" value={form.name} onChange={set("name")}/></div>
                    <div className="field"><label>Description <span className="req">*</span></label><textarea className="textarea" placeholder="Describe your product…" value={form.description} onChange={set("description")}/></div>
                    <div className="field"><label>Category</label>
                      <select className="select" value={form.category} onChange={set("category")}><option value="">Select…</option>{SELLER_CATS.map(c=><option key={c}>{c}</option>)}</select>
                    </div>
                  </div>
                </div>
                <div className="f-card">
                  <div className="f-card-head"><div className="f-icon" style={{background:"#fdf4ff"}}>🖼️</div><div><h3>Images</h3></div></div>
                  <div className="f-body">
                    {images.length===0?(
                      <div className={`img-zone ${drag?"drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);}} onClick={()=>fileRef.current.click()}>
                        <input ref={fileRef} type="file" accept="image/*" multiple style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}} onChange={e=>handleFiles(e.target.files)}/>
                        <div style={{fontSize:36,marginBottom:8}}>📸</div>
                        <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>Drop images or click to browse</div>
                        <div style={{fontSize:12,color:"var(--slate)"}}>JPG, PNG, WebP — Max 5MB</div>
                      </div>
                    ):(
                      <>
                        <div className="img-grid">
                          {images.map((img,i)=>(
                            <div key={i} className={`img-thumb ${i===primaryImg?"primary":""}`}>
                              <img src={img.url} alt=""/>
                              {i===primaryImg&&<span className="pri-badge">Cover</span>}
                              <div className="thumb-ov">
                                {i!==primaryImg&&<button className="t-btn star" onClick={()=>setPrimaryImg(i)}>⭐</button>}
                                <button className="t-btn del" onClick={()=>{setImages(p=>p.filter((_,j)=>j!==i));if(primaryImg>=i&&primaryImg>0)setPrimaryImg(p=>p-1);}}>🗑</button>
                              </div>
                            </div>
                          ))}
                          {images.length<8&&<div className="add-more" onClick={()=>addRef.current.click()}><input ref={addRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/><span style={{fontSize:20}}>+</span>Add</div>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="f-card">
                  <div className="f-card-head"><div className="f-icon" style={{background:"#f0fdf4"}}>💰</div><div><h3>Pricing (ZMW)</h3></div></div>
                  <div className="f-body">
                    <div className="f-row">
                      <div className="field"><label>Selling Price <span className="req">*</span></label><div className="pfx"><span className="pfx-l">K</span><input className="pfx-i" type="number" min="0" placeholder="0.00" value={form.price} onChange={set("price")}/></div></div>
                      <div className="field"><label>Compare-at</label><div className="pfx"><span className="pfx-l">K</span><input className="pfx-i" type="number" min="0" placeholder="Was price" value={form.comparePrice} onChange={set("comparePrice")}/></div></div>
                    </div>
                  </div>
                </div>
                <div className="f-card">
                  <div className="f-card-head"><div className="f-icon" style={{background:"#fffbeb"}}>📦</div><div><h3>Inventory</h3></div></div>
                  <div className="f-body">
                    <div className="f-row">
                      <div className="field"><label>SKU</label><input className="input" placeholder="HMB-001" value={form.sku} onChange={set("sku")}/></div>
                      <div className="field"><label>Stock Qty <span className="req">*</span></label><input className="input" type="number" min="0" placeholder="0" value={form.stock} onChange={set("stock")}/></div>
                    </div>
                  </div>
                </div>
                <div className="f-card">
                  <div className="f-card-head"><div className="f-icon" style={{background:"#f0fdf4"}}>⚙️</div><div><h3>Settings</h3></div></div>
                  <div className="f-body">
                    {[{key:"published",label:"Publish immediately",desc:"Make visible to buyers now"},{key:"freeShipping",label:"Free delivery",desc:"Offer free delivery"},{key:"trackInventory",label:"Track inventory",desc:"Auto-reduce stock on each sale"}].map(s=>(
                      <div key={s.key} className="toggle-row">
                        <div><div className="toggle-lbl">{s.label}</div><div className="toggle-desc">{s.desc}</div></div>
                        <label className="toggle"><input type="checkbox" checked={settings[s.key]} onChange={e=>setSettings(p=>({...p,[s.key]:e.target.checked}))}/><span className="tslider"/></label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sub-area">
                  <button className="sub-btn draft" onClick={()=>publish(true)} disabled={saving}>💾 Save Draft</button>
                  <button className="sub-btn publish" onClick={()=>publish(false)} disabled={saving}>{saving?<><BtnSpin/> Saving…</>:"🚀 Publish Product"}</button>
                </div>
              </div>
              <div className="preview-sticky">
                <div className="prev-lbl">👁️ Live Preview</div>
                <div className="p-card">
                  <div className="p-img">
                    {images.length>0?<img src={images[primaryImg]?.url} alt=""/>:<div className="p-placeholder"><span>🖼️</span><p style={{fontSize:11,color:"var(--slate)"}}>No image yet</p></div>}
                    {form.comparePrice&&parseFloat(form.comparePrice)>parseFloat(form.price||0)&&<div className="p-badge">SALE</div>}
                  </div>
                  <div className="p-body">
                    <div className="p-cat">{form.category||"Category"}</div>
                    <div className="p-name">{form.name||"Your Product Name"}</div>
                    <div className="p-desc">{form.description||"Description will appear here…"}</div>
                    <div className="p-foot">
                      <span className="p-price">{form.price?ZMW(parseFloat(form.price)):"K 0.00"}</span>
                      <span className={`p-stock ${parseInt(form.stock||0)===0?"low":"ok"}`}>{parseInt(form.stock||0)===0?"Out of stock":parseInt(form.stock||0)<=5?`⚡ ${form.stock} left`:"✓ In stock"}</span>
                    </div>
                    <button className="p-add">Add to Cart</button>
                  </div>
                </div>
                <div className="completeness">
                  <div className="comp-head"><span>Completeness</span><span className="comp-pct">{pct}%</span></div>
                  <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
                  <div className="comp-items">{checks.map(c=>(
                    <div key={c.label} className={`c-item ${c.done?"done":""}`}><div className={`c-dot ${c.done?"done":"todo"}`}>{c.done?"✓":"·"}</div>{c.label}</div>
                  ))}</div>
                </div>
              </div>
            </div>
          )}

          {tab==="list"&&(
            <div className="prod-table">
              <div className="t-head"><span>Product</span><span>Price</span><span>Stock</span><span>Status</span><span>Actions</span></div>
              {loading?<Spin dark/>
                :products.length===0
                  ?<div style={{padding:"40px",textAlign:"center",color:"var(--slate)"}}><div style={{fontSize:40,marginBottom:10}}>📦</div><p>No products yet!</p></div>
                  :products.map(p=>(
                    <div key={p.id} className="t-row">
                      <div className="p-info">
                        <div className="p-thumb">{p.image_url&&p.image_url.length<=4?p.image_url:"🛍️"}</div>
                        <div><div className="p-nm">{p.name}</div><div className="p-sk">{p.category}</div></div>
                      </div>
                      <div style={{fontWeight:600,fontSize:13}}>{ZMW(p.price)}</div>
                      <div style={{fontSize:12,color:p.stock_qty===0?"var(--red)":p.stock_qty<=5?"var(--gold)":"var(--green)",fontWeight:500}}>
                        {p.stock_qty===0?"Out":p.stock_qty<=5?`⚡ ${p.stock_qty}`:`${p.stock_qty} units`}
                      </div>
                      <div><span className={`s-pill ${p.status==="draft"?"draft":"active"}`}>{p.status==="draft"?"✏️ Draft":"✅ Active"}</span></div>
                      <div className="act-btns">
                        <button className="act-btn" onClick={()=>setTab("add")}>✏️</button>
                        <button className="act-btn" onClick={()=>deleteProduct(p.id)}>🗑</button>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      </div>
      {showModal&&(
        <div className="modal-ov"><div className="modal">
          <div className="modal-icon">🎉</div><h2>Product Published!</h2>
          <p>Live on ShopNow and saved to the database!</p>
          <div className="modal-btns">
            <button className="m-btn secondary" onClick={()=>{setShowModal(false);setTab("list");}}>View All</button>
            <button className="m-btn primary" onClick={()=>setShowModal(false)}>Add Another</button>
          </div>
        </div></div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authLoading,setAuthLoading] = useState(true);
  const [user,setUser]               = useState(null);
  const [profile,setProfile]         = useState(null);
  const [page,setPage]               = useState("shop");
  const [cart,dispatch]              = useReducer(cartReducer,[]);
  const [cartOpen,setCartOpen]       = useState(false);
  const [dbProducts,setDbProducts]   = useState([]);
  const [category,setCategory]       = useState("All");
  const [search,setSearch]           = useState("");
  const [maxPrice,setMaxPrice]       = useState(10000);
  const [sort,setSort]               = useState("default");
  const [justAdded,setJustAdded]     = useState(null);
  const [toast,setToast]             = useState(null);
  const [orderData,setOrderData]     = useState(null);

  const showToast=(msg,icon="✅")=>{ setToast({msg,icon}); setTimeout(()=>setToast(null),2800); };

  // ── Load profile and redirect based on role ───────────────────────────────
  const loadProfileAndRedirect = async (authUser) => {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser(authUser);
      setProfile(prof);

      // ── THIS IS THE KEY FIX ──
      const role = prof?.role || "buyer";
      setPage(getPageForRole(role));

      return prof;
    } catch(e) {
      console.error("Profile load error:", e);
      setPage("shop");
      return null;
    }
  };

  // ── Check session on mount ────────────────────────────────────────────────
  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        await loadProfileAndRedirect(session.user);
      }
      setAuthLoading(false);
    });

    const {data:{subscription}} = supabase.auth.onAuthStateChange(async(event, session)=>{
      if(event === "SIGNED_OUT"){
        setUser(null); setProfile(null); setPage("shop"); dispatch({type:"CLEAR"});
      }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // ── Load products ─────────────────────────────────────────────────────────
  useEffect(()=>{
    supabase.from("products").select("*, sellers(store_name)").eq("status","active").order("created_at",{ascending:false})
      .then(({data})=>{ if(data?.length>0) setDbProducts(data.map(p=>({...p,seller_name:p.sellers?.store_name||"Seller"}))); });
  },[]);

  const allProducts = [...dbProducts,...FALLBACK.filter(f=>!dbProducts.find(d=>d.name===f.name))];

  // ── Login handler ─────────────────────────────────────────────────────────
  const handleLogin = async (authUser, prof) => {
    setUser(authUser);
    setProfile(prof);
    const role = prof?.role || "buyer";
    const destination = getPageForRole(role);
    setPage(destination);
    const welcomeMap = { admin:"Admin", seller:"Seller", buyer:"" };
    showToast(`Welcome${welcomeMap[role]?" "+welcomeMap[role]:""}, ${prof?.full_name?.split(" ")[0]||"there"}! ${role==="admin"?"🛡️":role==="seller"?"🏪":"👋"}`,"🎉");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    dispatch({type:"CLEAR"});
    setPage("shop");
    showToast("Signed out successfully","👋");
  };

  const handleAdd = (p) => {
    dispatch({type:"ADD",product:p});
    setJustAdded(p.id); setTimeout(()=>setJustAdded(null),1500);
    showToast(`${p.name} added`,"🛒");
  };

  let filtered = allProducts.filter(p=>
    (category==="All"||p.category===category)&&
    p.price<=maxPrice&&
    (p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()))
  );
  if(sort==="price-asc")  filtered.sort((a,b)=>a.price-b.price);
  if(sort==="price-desc") filtered.sort((a,b)=>b.price-a.price);
  if(sort==="rating")     filtered.sort((a,b)=>(b.rating||4.5)-(a.rating||4.5));

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  if(authLoading) return (<><style>{css}</style><Spin/></>);

  // Admin
  if(page==="admin") return (
    <>
      <style>{css}</style>
      <AdminDashboard user={user} profile={profile} onExit={()=>setPage("shop")}/>
      <Toast t={toast}/>
    </>
  );

  // Auth
  if(!user) return (<><style>{css}</style><AuthPage onLogin={handleLogin}/><Toast t={toast}/></>);

  // Seller
  if(page==="seller") return (
    <>
      <style>{css}</style>
      <SellerDash user={user} profile={profile} onExit={()=>setPage("shop")} showToast={showToast}/>
      <Toast t={toast}/>
    </>
  );

  return (
    <>
      <style>{css}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo" onClick={()=>setPage("shop")}>Shop<span>Now</span></div>
        {page==="shop"&&(<div className="nav-search"><span style={{color:"#9ca3af"}}>🔍</span><input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}/></div>)}
        <div className="nav-actions">
          {profile?.role==="seller"&&<button className="nav-btn" onClick={()=>setPage("seller")}>🏪 My Store</button>}
          {profile?.role==="admin"&&<button className="nav-btn" style={{borderColor:"#7c3aed",color:"#7c3aed"}} onClick={()=>setPage("admin")}>🛡️ Admin</button>}
          <button className="nav-btn primary" onClick={()=>{setCartOpen(true);if(page!=="shop")setPage("shop");}}>🛒 {cartCount>0&&<span className="cart-badge">{cartCount}</span>}</button>
          <UserMenu profile={profile} onPage={setPage} onLogout={handleLogout}/>
        </div>
      </nav>

      {/* SHOP */}
      {page==="shop"&&(
        <>
          <div className="hero">
            <div className="hero-eyebrow">✦ Zambia's Modern Marketplace</div>
            <h1>Everything you need,<br/><em>nothing you don't.</em></h1>
            <p>Shop from local sellers. Pay with Airtel, MTN or card.</p>
            <div className="hero-ctas">
              <button className="hero-cta shop" onClick={()=>document.querySelector(".shop-layout")?.scrollIntoView({behavior:"smooth"})}>Browse Products</button>
              {profile?.role==="seller"
                ?<button className="hero-cta sell" onClick={()=>setPage("seller")}>🏪 My Dashboard →</button>
                :<button className="hero-cta sell" onClick={()=>showToast("Register as a seller to start listing!","🏪")}>Start Selling →</button>
              }
            </div>
          </div>
          <div className="stats-bar">
            {[["50K+","Happy Buyers"],[`${allProducts.length}`,"Products"],["4.9★","Avg Rating"],["🇿🇲","Zambia-Wide"]].map(([n,l])=>(
              <div key={l} className="stat"><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
            ))}
          </div>
          <div className="shop-layout">
            <div className="sidebar">
              <h3>Categories</h3>
              {CATEGORIES.map(c=>(
                <button key={c} className={`cat-btn ${category===c?"active":""}`} onClick={()=>setCategory(c)}>
                  {c==="All"?"🏪":c==="Home"?"🏠":c==="Fashion"?"👗":c==="Kitchen"?"🍳":"💻"} {c}
                </button>
              ))}
              <div className="filter-sec">
                <h3 style={{marginTop:0}}>Max Price (ZMW)</h3>
                <div className="price-range">
                  <input type="range" min={500} max={10000} step={100} value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)}/>
                  <span className="price-lbl">Up to K {maxPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="filter-sec">
                <h3 style={{marginTop:0}}>Sort By</h3>
                <select className="sort-sel" value={sort} onChange={e=>setSort(e.target.value)}>
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
            <div className="shop-main">
              <div className="sec-header">
                <h2 className="sec-title">{category==="All"?"All Products":category}</h2>
                <span className="result-count">{filtered.length} products</span>
              </div>
              {filtered.length===0
                ?<div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af"}}><div style={{fontSize:44,marginBottom:10}}>🔍</div><p>No products match your filters.</p></div>
                :<div className="grid">{filtered.map(p=><ProductCard key={p.id} product={p} onAdd={handleAdd} justAdded={justAdded===p.id}/>)}</div>
              }
            </div>
          </div>
          <footer className="footer">
            <div className="footer-grid">
              <div className="footer-brand"><h3>Shop<span>Now</span></h3><p>Zambia's modern marketplace. Quality products, zero compromise.</p></div>
              {[{title:"Shop",links:["All Products","Home","Fashion","Kitchen","Tech"]},{title:"Sell",links:["Start Selling","Seller FAQ","Pricing"]},{title:"Help",links:["Help Center","Returns","Track Order","Contact"]}].map(col=>(
                <div key={col.title} className="footer-col"><h4>{col.title}</h4>{col.links.map(l=><a key={l}>{l}</a>)}</div>
              ))}
            </div>
            <div className="footer-bottom"><span>© 2026 ShopNow Zambia. All rights reserved.</span><span>Privacy · Terms</span></div>
          </footer>
        </>
      )}

      {page==="orders"&&<OrdersPage user={user} onBack={()=>setPage("shop")}/>}
      {page==="checkout"&&<CheckoutPage cart={cart} user={user} profile={profile} onSuccess={(num,total,pay)=>{setOrderData({num,total,pay});setPage("success");}} onBack={()=>{setCartOpen(true);setPage("shop");}} showToast={showToast}/>}

      {page==="success"&&orderData&&(
        <div className="success-page">
          <div className="success-icon">🎊</div>
          <h2>Order Placed!</h2>
          <p>Your order has been saved. You'll receive confirmation shortly.</p>
          <p style={{fontSize:12,color:"#9ca3af"}}>Order: <strong style={{color:"var(--accent)"}}>{orderData.num}</strong></p>
          <p style={{fontSize:12,color:"#9ca3af",marginBottom:28}}>Total: <strong>{ZMW(orderData.total)}</strong> via {orderData.pay}</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            <button className="hero-cta shop" style={{border:"1.5px solid #e5e7eb"}} onClick={()=>{dispatch({type:"CLEAR"});setPage("shop");}}>← Continue Shopping</button>
            <button className="hero-cta sell" onClick={()=>{dispatch({type:"CLEAR"});setPage("orders");}}>📦 View Orders</button>
          </div>
        </div>
      )}

      {cartOpen&&<CartDrawer cart={cart} dispatch={dispatch} onClose={()=>setCartOpen(false)} onCheckout={()=>{setCartOpen(false);setPage("checkout");}}/>}
      <Toast t={toast}/>
    </>
  );
}