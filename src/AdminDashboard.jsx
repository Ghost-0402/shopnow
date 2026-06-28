import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ── CURRENCY ──────────────────────────────────────────────────────────────────
const ZMW = (v) => `K ${(parseFloat(v)||0).toLocaleString("en-ZM",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── STYLES ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --ink:#0f0f0f;--smoke:#f8f9fa;--white:#fff;--slate:#6b7280;--border:#e5e7eb;
    --accent:#2563eb;--accent2:#7c3aed;--green:#16a34a;--greenBg:#f0fdf4;
    --red:#dc2626;--redBg:#fef2f2;--gold:#d97706;--goldBg:#fffbeb;
    --radius:12px;--shadow:0 2px 12px rgba(0,0,0,.07);
    --tr:.18s cubic-bezier(.4,0,.2,1);
  }
  body{font-family:'DM Sans',sans-serif;background:var(--smoke);color:var(--ink);}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes toastIn{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}

  /* LAYOUT */
  .admin-app{display:flex;min-height:100vh;}

  /* SIDEBAR */
  .admin-sidebar{width:230px;flex-shrink:0;background:#0f172a;color:#fff;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;}
  .admin-logo{padding:22px 20px 16px;border-bottom:1px solid rgba(255,255,255,.08);}
  .admin-logo h1{font-family:'DM Serif Display';font-size:20px;}
  .admin-logo h1 span{color:#818cf8;}
  .admin-logo p{font-size:11px;color:#64748b;margin-top:2px;}
  .admin-nav{padding:14px 10px;flex:1;}
  .admin-sec{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#475569;padding:0 8px;margin:16px 0 6px;}
  .admin-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;font-size:13px;font-weight:500;color:#94a3b8;cursor:pointer;transition:all var(--tr);margin-bottom:2px;border:none;background:none;width:100%;text-align:left;}
  .admin-item:hover{background:rgba(255,255,255,.06);color:#fff;}
  .admin-item.active{background:rgba(99,102,241,.25);color:#818cf8;}
  .admin-item .badge{margin-left:auto;background:#dc2626;color:#fff;border-radius:40px;font-size:10px;padding:1px 7px;font-weight:700;}
  .admin-item .badge.green{background:var(--green);}
  .admin-foot{padding:14px 10px;border-top:1px solid rgba(255,255,255,.08);}
  .admin-profile{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.05);}
  .admin-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;}
  .admin-av-name{font-size:12px;font-weight:600;color:#fff;}
  .admin-av-role{font-size:10px;color:#64748b;}

  /* MAIN */
  .admin-main{flex:1;display:flex;flex-direction:column;min-width:0;}
  .admin-topbar{background:var(--white);border-bottom:1px solid var(--border);padding:0 28px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
  .admin-topbar-left h2{font-size:17px;font-weight:600;}
  .admin-topbar-left p{font-size:12px;color:var(--slate);}
  .topbar-actions{display:flex;align-items:center;gap:10px;}
  .topbar-btn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all var(--tr);border:1.5px solid var(--border);background:var(--white);display:flex;align-items:center;gap:6px;}
  .topbar-btn:hover{border-color:var(--accent);color:var(--accent);}
  .topbar-btn.danger{border-color:var(--red);color:var(--red);}
  .topbar-btn.danger:hover{background:var(--redBg);}
  .admin-content{padding:28px;flex:1;}

  /* STATS GRID */
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
  .stat-card{background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);border:1px solid var(--border);position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
  .stat-card.blue::before{background:var(--accent);}
  .stat-card.purple::before{background:var(--accent2);}
  .stat-card.green::before{background:var(--green);}
  .stat-card.gold::before{background:var(--gold);}
  .stat-card.red::before{background:var(--red);}
  .stat-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .stat-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;}
  .stat-trend{font-size:11px;font-weight:600;padding:2px 8px;border-radius:40px;}
  .stat-trend.up{background:var(--greenBg);color:var(--green);}
  .stat-trend.down{background:var(--redBg);color:var(--red);}
  .stat-value{font-family:'DM Serif Display';font-size:28px;color:var(--ink);margin-bottom:2px;}
  .stat-label{font-size:12px;color:var(--slate);}

  /* TABLES */
  .table-card{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow);overflow:hidden;margin-bottom:24px;}
  .table-card-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:10px;}
  .table-card-head h3{font-size:15px;font-weight:600;}
  .table-card-head p{font-size:12px;color:var(--slate);margin-top:2px;}
  .head-actions{display:flex;align-items:center;gap:8px;}
  .search-input{padding:7px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;transition:border-color var(--tr);background:var(--smoke);width:200px;}
  .search-input:focus{border-color:var(--accent);}
  .filter-select{padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;outline:none;background:var(--smoke);cursor:pointer;}
  .tbl{width:100%;border-collapse:collapse;}
  .tbl th{padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--slate);background:var(--smoke);border-bottom:1px solid var(--border);}
  .tbl td{padding:12px 16px;font-size:13px;border-bottom:1px solid #f7f7f7;vertical-align:middle;}
  .tbl tr:last-child td{border-bottom:none;}
  .tbl tr:hover td{background:#fafafa;}
  .tbl-empty{padding:48px;text-align:center;color:var(--slate);}
  .tbl-empty div{font-size:40px;margin-bottom:10px;}

  /* BADGES & PILLS */
  .pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:40px;font-size:11px;font-weight:600;}
  .pill.active,.pill.approved,.pill.paid,.pill.Delivered{background:var(--greenBg);color:var(--green);}
  .pill.draft,.pill.pending,.pill.Processing{background:var(--goldBg);color:var(--gold);}
  .pill.suspended,.pill.failed,.pill.Cancelled{background:var(--redBg);color:var(--red);}
  .pill.admin{background:#ede9fe;color:#5b21b6;}
  .pill.buyer{background:#eff6ff;color:var(--accent);}
  .pill.seller{background:#f0fdf4;color:var(--green);}
  .pill.archived{background:#f1f5f9;color:#64748b;}

  /* USER AVATAR */
  .user-cell{display:flex;align-items:center;gap:10px;}
  .u-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;color:#fff;}
  .u-name{font-weight:600;font-size:13px;}
  .u-email{font-size:11px;color:var(--slate);}

  /* ACTION BUTTONS */
  .act-btn{width:28px;height:28px;border-radius:7px;border:1.5px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all var(--tr);}
  .act-btn:hover{border-color:var(--accent);background:#eff6ff;}
  .act-btn.danger:hover{border-color:var(--red);background:var(--redBg);}
  .act-btns{display:flex;gap:5px;}
  .inline-btn{padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all var(--tr);border:1.5px solid var(--border);background:var(--white);}
  .inline-btn:hover{border-color:var(--accent);color:var(--accent);}
  .inline-btn.danger:hover{border-color:var(--red);color:var(--red);}
  .inline-btn.success{border-color:var(--green);color:var(--green);background:var(--greenBg);}

  /* MODAL */
  .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s;}
  .modal{background:var(--white);border-radius:18px;padding:32px;max-width:480px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.2);}
  .modal h2{font-family:'DM Serif Display';font-size:24px;margin-bottom:6px;}
  .modal p{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:20px;}
  .modal-btns{display:flex;gap:8px;justify-content:flex-end;}
  .m-btn{padding:10px 20px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;transition:all var(--tr);}
  .m-btn.primary{background:var(--accent);color:#fff;border:none;}
  .m-btn.danger{background:var(--red);color:#fff;border:none;}
  .m-btn.secondary{background:var(--smoke);color:var(--ink);border:1.5px solid var(--border);}
  .modal-field{margin-bottom:14px;}
  .modal-field label{display:block;font-size:12px;font-weight:600;margin-bottom:5px;}
  .modal-input,.modal-select{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;font-family:inherit;outline:none;transition:border-color var(--tr);}
  .modal-input:focus,.modal-select:focus{border-color:var(--accent);}

  /* OVERVIEW CHARTS */
  .overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
  .chart-card{background:var(--white);border-radius:var(--radius);padding:20px;border:1px solid var(--border);box-shadow:var(--shadow);}
  .chart-card h3{font-size:14px;font-weight:600;margin-bottom:16px;}
  .bar-chart{display:flex;flex-direction:column;gap:10px;}
  .bar-row{display:flex;align-items:center;gap:10px;}
  .bar-label{font-size:12px;color:var(--slate);width:80px;flex-shrink:0;}
  .bar-track{flex:1;height:8px;background:var(--border);border-radius:40px;overflow:hidden;}
  .bar-fill{height:100%;border-radius:40px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .6s cubic-bezier(.4,0,.2,1);}
  .bar-val{font-size:12px;font-weight:600;width:60px;text-align:right;flex-shrink:0;}
  .donut-wrap{display:flex;align-items:center;gap:20px;}
  .donut-legend{display:flex;flex-direction:column;gap:8px;}
  .legend-item{display:flex;align-items:center;gap:8px;font-size:12px;}
  .legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
  .activity-feed{display:flex;flex-direction:column;gap:12px;}
  .activity-item{display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--smoke);border-radius:9px;}
  .activity-icon{font-size:18px;flex-shrink:0;}
  .activity-text{font-size:13px;line-height:1.4;}
  .activity-time{font-size:11px;color:var(--slate);margin-top:2px;}

  /* TOAST */
  .toast{position:fixed;bottom:22px;right:22px;background:var(--ink);color:#fff;padding:11px 16px;border-radius:9px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:9px;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:toastIn .25s;z-index:400;}

  /* SPINNER */
  .spinner{width:32px;height:32px;border:3px solid rgba(0,0,0,.08);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:40px auto;}

  /* RESPONSIVE */
  @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(2,1fr)}.overview-grid{grid-template-columns:1fr}}
  @media(max-width:768px){.admin-sidebar{display:none}.stats-grid{grid-template-columns:1fr 1fr}}
`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Spinner() { return <div className="spinner"/>; }
function Toast({ t }) { if(!t) return null; return <div className="toast"><span>{t.icon}</span>{t.msg}</div>; }
function Pill({ status }) {
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return <span className={`pill ${status}`}>{label}</span>;
}
function UAv({ name, color="#2563eb" }) {
  const initials = (name||"?").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
  return <div className="u-av" style={{background:color}}>{initials}</div>;
}
function timeAgo(date) {
  const sec = Math.floor((Date.now()-new Date(date))/1000);
  if(sec<60) return "just now";
  if(sec<3600) return `${Math.floor(sec/60)}m ago`;
  if(sec<86400) return `${Math.floor(sec/3600)}h ago`;
  return `${Math.floor(sec/86400)}d ago`;
}

// ── OVERVIEW PAGE ─────────────────────────────────────────────────────────────
function OverviewPage({ stats, orders, users, products }) {
  const revenue = orders.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+(o.total_amount||0),0);
  const pending = orders.filter(o=>o.status==="pending"||o.status==="Processing").length;
  const cats = ["Home","Fashion","Kitchen","Tech","Other"];
  const catCounts = cats.map(c=>({ cat:c, count:products.filter(p=>p.category===c).length }));
  const maxCat = Math.max(...catCounts.map(c=>c.count),1);

  const recentActivity = [
    ...orders.slice(0,3).map(o=>({ icon:"🛒", text:`New order ${o.order_number} — ${ZMW(o.total_amount)}`, time:o.created_at })),
    ...users.slice(0,2).map(u=>({ icon:"👤", text:`New user: ${u.full_name||"Unknown"}`, time:u.created_at })),
  ].sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,6);

  return (
    <>
      {/* STATS */}
      <div className="stats-grid">
        {[
          { label:"Total Revenue", value:ZMW(revenue), icon:"💰", color:"blue", bg:"#eff6ff", trend:"+12%", up:true },
          { label:"Total Orders",  value:orders.length, icon:"📦", color:"purple", bg:"#fdf4ff", trend:"+8%", up:true },
          { label:"Total Users",   value:users.length,  icon:"👥", color:"green",  bg:"#f0fdf4", trend:"+24%", up:true },
          { label:"Products Live", value:products.filter(p=>p.status==="active").length, icon:"🛍️", color:"gold", bg:"#fffbeb", trend:"+5%", up:true },
        ].map(s=>(
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-top">
              <div className="stat-icon" style={{background:s.bg}}>{s.icon}</div>
              <span className={`stat-trend ${s.up?"up":"down"}`}>{s.trend}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* EXTRA STATS */}
      <div className="stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        {[
          { label:"Pending Orders",   value:pending,                                          icon:"⏳", color:"gold",  bg:"#fffbeb" },
          { label:"Active Sellers",   value:users.filter(u=>u.role==="seller").length,        icon:"🏪", color:"green", bg:"#f0fdf4" },
          { label:"Pending Payments", value:orders.filter(o=>o.payment_status==="pending").length, icon:"💳", color:"red",  bg:"#fef2f2" },
        ].map(s=>(
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-top"><div className="stat-icon" style={{background:s.bg}}>{s.icon}</div></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        {/* PRODUCTS BY CATEGORY */}
        <div className="chart-card">
          <h3>📊 Products by Category</h3>
          <div className="bar-chart">
            {catCounts.map(c=>(
              <div key={c.cat} className="bar-row">
                <span className="bar-label">{c.cat}</span>
                <div className="bar-track"><div className="bar-fill" style={{width:`${(c.count/maxCat)*100}%`}}/></div>
                <span className="bar-val">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="chart-card">
          <h3>🔔 Recent Activity</h3>
          <div className="activity-feed">
            {recentActivity.length===0
              ?<p style={{color:"var(--slate)",fontSize:13}}>No recent activity</p>
              :recentActivity.map((a,i)=>(
                <div key={i} className="activity-item">
                  <span className="activity-icon">{a.icon}</span>
                  <div>
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">{timeAgo(a.time)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* ORDER STATUS BREAKDOWN */}
        <div className="chart-card">
          <h3>📦 Order Status</h3>
          <div className="bar-chart">
            {[
              {label:"Processing", count:orders.filter(o=>o.status==="Processing").length, color:"#d97706"},
              {label:"Delivered",  count:orders.filter(o=>o.status==="Delivered").length,  color:"#16a34a"},
              {label:"Pending",    count:orders.filter(o=>o.status==="pending").length,     color:"#6b7280"},
              {label:"Cancelled",  count:orders.filter(o=>o.status==="Cancelled").length,  color:"#dc2626"},
            ].map(s=>{
              const max=Math.max(orders.length,1);
              return (
                <div key={s.label} className="bar-row">
                  <span className="bar-label">{s.label}</span>
                  <div className="bar-track"><div className="bar-fill" style={{width:`${(s.count/max)*100}%`,background:s.color}}/></div>
                  <span className="bar-val">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAYMENT STATUS */}
        <div className="chart-card">
          <h3>💰 Payment Status</h3>
          <div className="bar-chart">
            {[
              {label:"Paid",    count:orders.filter(o=>o.payment_status==="paid").length,    color:"#16a34a"},
              {label:"Pending", count:orders.filter(o=>o.payment_status==="pending").length, color:"#d97706"},
              {label:"Failed",  count:orders.filter(o=>o.payment_status==="failed").length,  color:"#dc2626"},
            ].map(s=>{
              const max=Math.max(orders.length,1);
              return (
                <div key={s.label} className="bar-row">
                  <span className="bar-label">{s.label}</span>
                  <div className="bar-track"><div className="bar-fill" style={{width:`${(s.count/max)*100}%`,background:s.color}}/></div>
                  <span className="bar-val">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── ORDERS PAGE ───────────────────────────────────────────────────────────────
function OrdersPage({ orders, onUpdateStatus, showToast }) {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [selected,setSelected]=useState(null);

  const filtered=orders.filter(o=>{
    const matchSearch=o.order_number?.toLowerCase().includes(search.toLowerCase())||
      o.shipping_address?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==="all"||o.status.toLowerCase()===filter;
    return matchSearch&&matchFilter;
  });

  return (
    <>
      <div className="table-card">
        <div className="table-card-head">
          <div><h3>All Orders</h3><p>{orders.length} total orders</p></div>
          <div className="head-actions">
            <input className="search-input" placeholder="Search orders…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0
              ?<tr><td colSpan={8}><div className="tbl-empty"><div>📦</div><p>No orders found</p></div></td></tr>
              :filtered.map(o=>(
                <tr key={o.id}>
                  <td><strong style={{fontSize:13}}>{o.order_number}</strong></td>
                  <td>
                    <div style={{fontSize:13,fontWeight:500}}>{o.shipping_address?.name||"—"}</div>
                    <div style={{fontSize:11,color:"var(--slate)"}}>{o.shipping_address?.city}</div>
                  </td>
                  <td><span style={{fontSize:12,color:"var(--slate)"}}>{o.order_items?.length||0} item(s)</span></td>
                  <td><strong>{ZMW(o.total_amount)}</strong></td>
                  <td>
                    <Pill status={o.payment_status||"pending"}/>
                    <div style={{fontSize:11,color:"var(--slate)",marginTop:2}}>{o.payment_method?.toUpperCase()}</div>
                  </td>
                  <td><Pill status={o.status}/></td>
                  <td style={{fontSize:12,color:"var(--slate)"}}>{new Date(o.created_at).toLocaleDateString("en-ZM",{day:"numeric",month:"short"})}</td>
                  <td>
                    <div className="act-btns">
                      <button className="act-btn" title="View" onClick={()=>setSelected(o)}>👁️</button>
                      <button className="inline-btn success" onClick={()=>{onUpdateStatus(o.id,"Delivered","paid");showToast("Order marked as delivered","✅");}}>✓ Deliver</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ORDER DETAIL MODAL */}
      {selected&&(
        <div className="modal-ov">
          <div className="modal" style={{maxWidth:560}}>
            <h2>Order {selected.order_number}</h2>
            <p>Placed on {new Date(selected.created_at).toLocaleDateString("en-ZM",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            <div style={{background:"var(--smoke)",borderRadius:10,padding:16,marginBottom:16}}>
              <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>📦 Delivery Address</div>
              <div style={{fontSize:13,color:"var(--slate)",lineHeight:1.7}}>
                {selected.shipping_address?.name}<br/>
                {selected.shipping_address?.line1}<br/>
                {selected.shipping_address?.city}<br/>
                {selected.shipping_address?.phone}
              </div>
            </div>
            <div style={{background:"var(--smoke)",borderRadius:10,padding:16,marginBottom:16}}>
              <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>🛍️ Items</div>
              {selected.order_items?.map((i,idx)=>(
                <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
                  <span>{i.product_name} ×{i.quantity}</span>
                  <strong>{ZMW(i.unit_price*i.quantity)}</strong>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14,paddingTop:8,marginTop:4}}>
                <span>Total</span><span>{ZMW(selected.total_amount)}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1,background:"var(--smoke)",borderRadius:9,padding:12,fontSize:13}}>
                <div style={{fontWeight:600,marginBottom:4}}>Payment</div>
                <Pill status={selected.payment_status||"pending"}/>
                <div style={{fontSize:11,color:"var(--slate)",marginTop:4}}>{selected.payment_method?.toUpperCase()}</div>
              </div>
              <div style={{flex:1,background:"var(--smoke)",borderRadius:9,padding:12,fontSize:13}}>
                <div style={{fontWeight:600,marginBottom:4}}>Status</div>
                <Pill status={selected.status}/>
              </div>
            </div>
            <div className="modal-btns">
              <button className="m-btn secondary" onClick={()=>setSelected(null)}>Close</button>
              <button className="m-btn primary" onClick={()=>{onUpdateStatus(selected.id,"Delivered","paid");showToast("Marked as delivered","✅");setSelected(null);}}>✅ Mark Delivered</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── USERS PAGE ────────────────────────────────────────────────────────────────
function UsersPage({ users, onUpdateRole, onSuspend, showToast }) {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [editUser,setEditUser]=useState(null);
  const [newRole,setNewRole]=useState("");

  const filtered=users.filter(u=>{
    const matchSearch=(u.full_name||"").toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==="all"||u.role===filter;
    return matchSearch&&matchFilter;
  });

  const ROLE_COLORS={ admin:"#7c3aed", seller:"#16a34a", buyer:"#2563eb" };

  return (
    <>
      <div className="table-card">
        <div className="table-card-head">
          <div><h3>All Users</h3><p>{users.length} registered users</p></div>
          <div className="head-actions">
            <input className="search-input" placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0
              ?<tr><td colSpan={5}><div className="tbl-empty"><div>👥</div><p>No users found</p></div></td></tr>
              :filtered.map(u=>(
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <UAv name={u.full_name} color={ROLE_COLORS[u.role]||"#6b7280"}/>
                      <div>
                        <div className="u-name">{u.full_name||"Unknown"}</div>
                        <div className="u-email">{u.email||"—"}</div>
                      </div>
                    </div>
                  </td>
                  <td><Pill status={u.role||"buyer"}/></td>
                  <td style={{fontSize:12,color:"var(--slate)"}}>{new Date(u.created_at).toLocaleDateString("en-ZM",{day:"numeric",month:"short",year:"numeric"})}</td>
                  <td><Pill status={u.is_active===false?"suspended":"active"}/></td>
                  <td>
                    <div className="act-btns">
                      <button className="act-btn" title="Change Role" onClick={()=>{setEditUser(u);setNewRole(u.role||"buyer");}}>✏️</button>
                      <button className="act-btn danger" title="Suspend" onClick={()=>{onSuspend(u.id);showToast(`${u.full_name} suspended`,"🚫");}}>🚫</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* EDIT ROLE MODAL */}
      {editUser&&(
        <div className="modal-ov">
          <div className="modal">
            <h2>Change Role</h2>
            <p>Changing role for <strong>{editUser.full_name}</strong></p>
            <div className="modal-field">
              <label>New Role</label>
              <select className="modal-select" value={newRole} onChange={e=>setNewRole(e.target.value)}>
                <option value="buyer">🛍️ Buyer</option>
                <option value="seller">🏪 Seller</option>
                <option value="admin">🛡️ Admin</option>
              </select>
            </div>
            <div className="modal-btns">
              <button className="m-btn secondary" onClick={()=>setEditUser(null)}>Cancel</button>
              <button className="m-btn primary" onClick={()=>{onUpdateRole(editUser.id,newRole);showToast(`Role updated to ${newRole}`,"✅");setEditUser(null);}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
function ProductsPage({ products, onUpdateStatus, onDelete, showToast }) {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");

  const filtered=products.filter(p=>{
    const matchSearch=p.name?.toLowerCase().includes(search.toLowerCase())||p.category?.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==="all"||p.status===filter;
    return matchSearch&&matchFilter;
  });

  return (
    <div className="table-card">
      <div className="table-card-head">
        <div><h3>All Products</h3><p>{products.length} total products</p></div>
        <div className="head-actions">
          <input className="search-input" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length===0
            ?<tr><td colSpan={6}><div className="tbl-empty"><div>🛍️</div><p>No products found</p></div></td></tr>
            :filtered.map(p=>(
              <tr key={p.id}>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#f0f4ff,#ede9fe)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {p.image_url&&p.image_url.length<=4?p.image_url:"🛍️"}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                      <div style={{fontSize:11,color:"var(--slate)"}}>by {p.sellers?.store_name||"Unknown"}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontSize:12}}>{p.category}</td>
                <td><strong>{ZMW(p.price)}</strong></td>
                <td>
                  <span style={{fontSize:12,fontWeight:600,color:p.stock_qty===0?"var(--red)":p.stock_qty<=5?"var(--gold)":"var(--green)"}}>
                    {p.stock_qty===0?"Out":p.stock_qty<=5?`⚡ ${p.stock_qty}`:`${p.stock_qty}`}
                  </span>
                </td>
                <td><Pill status={p.status||"active"}/></td>
                <td>
                  <div className="act-btns">
                    {p.status!=="active"&&<button className="inline-btn success" onClick={()=>{onUpdateStatus(p.id,"active");showToast("Product approved","✅");}}>✓ Approve</button>}
                    {p.status==="active"&&<button className="inline-btn" onClick={()=>{onUpdateStatus(p.id,"archived");showToast("Product archived","📁");}}>Archive</button>}
                    <button className="act-btn danger" onClick={()=>{if(window.confirm("Delete this product?"))onDelete(p.id);showToast("Product deleted","🗑️");}}>🗑</button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ── SELLERS PAGE ──────────────────────────────────────────────────────────────
function SellersPage({ sellers, onUpdateStatus, showToast }) {
  const [search,setSearch]=useState("");

  const filtered=sellers.filter(s=>(s.store_name||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="table-card">
      <div className="table-card-head">
        <div><h3>All Sellers</h3><p>{sellers.length} registered sellers</p></div>
        <div className="head-actions">
          <input className="search-input" placeholder="Search sellers…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Store</th>
            <th>Mobile Money</th>
            <th>Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length===0
            ?<tr><td colSpan={5}><div className="tbl-empty"><div>🏪</div><p>No sellers found</p></div></td></tr>
            :filtered.map(s=>(
              <tr key={s.id}>
                <td>
                  <div className="user-cell">
                    <UAv name={s.store_name} color="#16a34a"/>
                    <div>
                      <div className="u-name">{s.store_name||"Unnamed Store"}</div>
                      <div className="u-email">{s.description||"No description"}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {s.mobile_money_number
                    ?<div style={{fontSize:12}}><div style={{fontWeight:500}}>{s.mobile_money_provider}</div><div style={{color:"var(--slate)"}}>{s.mobile_money_number}</div></div>
                    :<span style={{fontSize:12,color:"var(--slate)"}}>Not set</span>
                  }
                </td>
                <td style={{fontSize:13,fontWeight:600}}>{s.product_count||0}</td>
                <td><Pill status={s.status||"approved"}/></td>
                <td>
                  <div className="act-btns">
                    {s.status!=="approved"&&<button className="inline-btn success" onClick={()=>{onUpdateStatus(s.id,"approved");showToast("Seller approved","✅");}}>✓ Approve</button>}
                    {s.status==="approved"&&<button className="inline-btn danger" onClick={()=>{onUpdateStatus(s.id,"suspended");showToast("Seller suspended","🚫");}}>Suspend</button>}
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage({ profile, showToast }) {
  const [form,setForm]=useState({ siteName:"ShopNow Zambia", currency:"ZMW", commission:"8", deliveryFee:"150", freeDeliveryThreshold:"5000", supportEmail:"support@shopnow.zm", supportPhone:"+260 97 000 0000" });
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  return (
    <div style={{maxWidth:640}}>
      {[
        { title:"🏪 Store Settings", fields:[
          {label:"Site Name",key:"siteName",type:"text"},{label:"Currency",key:"currency",type:"text"},
          {label:"Platform Commission (%)",key:"commission",type:"number"},{label:"Support Email",key:"supportEmail",type:"email"},
          {label:"Support Phone",key:"supportPhone",type:"text"},
        ]},
        { title:"🚚 Delivery Settings", fields:[
          {label:"Default Delivery Fee (ZMW)",key:"deliveryFee",type:"number"},
          {label:"Free Delivery Threshold (ZMW)",key:"freeDeliveryThreshold",type:"number"},
        ]},
      ].map(section=>(
        <div key={section.title} className="table-card" style={{marginBottom:20}}>
          <div className="table-card-head"><div><h3>{section.title}</h3></div></div>
          <div style={{padding:20}}>
            {section.fields.map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5}}>{f.label}</label>
                <input type={f.type} className="search-input" style={{width:"100%"}} value={form[f.key]} onChange={set(f.key)}/>
              </div>
            ))}
            <button className="inline-btn success" style={{marginTop:8}} onClick={()=>showToast("Settings saved!","✅")}>Save Settings</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard({ user, profile, onExit }) {
  const [nav,setNav]=useState("overview");
  const [orders,setOrders]=useState([]);
  const [users,setUsers]=useState([]);
  const [products,setProducts]=useState([]);
  const [sellers,setSellers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);

  const showToast=(msg,icon="✅")=>{ setToast({msg,icon}); setTimeout(()=>setToast(null),2800); };

  // ── Load all data ──────────────────────────────────────────────────────────
  useEffect(()=>{ loadAll(); },[]);

  const loadAll=async()=>{
    setLoading(true);
    const [ordersRes, usersRes, productsRes, sellersRes] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at",{ascending:false}),
      supabase.from("profiles").select("*").order("created_at",{ascending:false}),
      supabase.from("products").select("*, sellers(store_name)").order("created_at",{ascending:false}),
      supabase.from("sellers").select("*").order("created_at",{ascending:false}),
    ]);
    setOrders(ordersRes.data||[]);
    setUsers(usersRes.data||[]);
    setProducts(productsRes.data||[]);
    // Count products per seller
    const sellersWithCount=(sellersRes.data||[]).map(s=>({
      ...s, product_count:(productsRes.data||[]).filter(p=>p.seller_id===s.id).length
    }));
    setSellers(sellersWithCount);
    setLoading(false);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const updateOrderStatus=async(id,status,payStatus)=>{
    const update={status};
    if(payStatus) update.payment_status=payStatus;
    await supabase.from("orders").update(update).eq("id",id);
    setOrders(prev=>prev.map(o=>o.id===id?{...o,...update}:o));
  };

  const updateUserRole=async(id,role)=>{
    await supabase.from("profiles").update({role}).eq("id",id);
    setUsers(prev=>prev.map(u=>u.id===id?{...u,role}:u));
  };

  const suspendUser=async(id)=>{
    await supabase.from("profiles").update({is_active:false}).eq("id",id);
    setUsers(prev=>prev.map(u=>u.id===id?{...u,is_active:false}:u));
  };

  const updateProductStatus=async(id,status)=>{
    await supabase.from("products").update({status}).eq("id",id);
    setProducts(prev=>prev.map(p=>p.id===id?{...p,status}:p));
  };

  const deleteProduct=async(id)=>{
    await supabase.from("products").delete().eq("id",id);
    setProducts(prev=>prev.filter(p=>p.id!==id));
  };

  const updateSellerStatus=async(id,status)=>{
    await supabase.from("sellers").update({status}).eq("id",id);
    setSellers(prev=>prev.map(s=>s.id===id?{...s,status}:s));
  };

  // ── Nav config ─────────────────────────────────────────────────────────────
  const NAV=[
    {id:"overview", icon:"📊", label:"Overview"},
    {id:"orders",   icon:"📦", label:"Orders",   badge:orders.filter(o=>o.status==="pending"||o.status==="Processing").length},
    {id:"users",    icon:"👥", label:"Users",    badge:null},
    {id:"products", icon:"🛍️", label:"Products", badge:products.filter(p=>p.status==="draft").length},
    {id:"sellers",  icon:"🏪", label:"Sellers",  badge:sellers.filter(s=>s.status==="pending").length},
    {id:"settings", icon:"⚙️", label:"Settings"},
  ];

  const PAGE_TITLES={
    overview:"Overview", orders:"Orders", users:"Users",
    products:"Products", sellers:"Sellers", settings:"Settings"
  };

  const initials=(profile?.full_name||"A").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  return (
    <>
      <style>{css}</style>
      <div className="admin-app">

        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <div className="admin-logo">
            <h1>Shop<span>Now</span></h1>
            <p>🛡️ Admin Dashboard</p>
          </div>
          <nav className="admin-nav">
            <div className="admin-sec">Management</div>
            {NAV.map(item=>(
              <button key={item.id} className={`admin-item ${nav===item.id?"active":""}`} onClick={()=>setNav(item.id)}>
                {item.icon} {item.label}
                {item.badge>0&&<span className="badge">{item.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="admin-foot">
            <div className="admin-profile">
              <div className="admin-av">{initials}</div>
              <div>
                <div className="admin-av-name">{profile?.full_name||"Admin"}</div>
                <div className="admin-av-role">🛡️ Administrator</div>
              </div>
            </div>
            <button className="admin-item" style={{marginTop:8,color:"#f87171"}} onClick={onExit}>🛍️ Back to Shop</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <h2>{PAGE_TITLES[nav]}</h2>
              <p>ShopNow Zambia Admin Panel</p>
            </div>
            <div className="topbar-actions">
              <button className="topbar-btn" onClick={loadAll}>🔄 Refresh</button>
              <button className="topbar-btn" onClick={onExit}>🛍️ View Shop</button>
            </div>
          </header>

          <div className="admin-content">
            {loading ? <Spinner/> : (
              <>
                {nav==="overview" && <OverviewPage stats={{}} orders={orders} users={users} products={products}/>}
                {nav==="orders"   && <OrdersPage orders={orders} onUpdateStatus={updateOrderStatus} showToast={showToast}/>}
                {nav==="users"    && <UsersPage users={users} onUpdateRole={updateUserRole} onSuspend={suspendUser} showToast={showToast}/>}
                {nav==="products" && <ProductsPage products={products} onUpdateStatus={updateProductStatus} onDelete={deleteProduct} showToast={showToast}/>}
                {nav==="sellers"  && <SellersPage sellers={sellers} onUpdateStatus={updateSellerStatus} showToast={showToast}/>}
                {nav==="settings" && <SettingsPage profile={profile} showToast={showToast}/>}
              </>
            )}
          </div>
        </div>
      </div>
      <Toast t={toast}/>
    </>
  );
}
