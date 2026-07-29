// นำเข้า React และ hooks ต่างๆ สำหรับจัดการ UI state
import React, { useState, useEffect, useRef } from "react";
// นำเข้า routing tools สำหรับการนำทางและลิงก์
import { useNavigate, Link } from "react-router-dom";
// นำเข้า Custom Hook สำหรับจัดการข้อมูล Realtime & SWR Cache
import { useHomeData } from "../../hooks/useHomeData";
import API_BASE_URL from "../../config/apiConfig";
// นำเข้า CSS styles
import "./Home.css";
import "../Report/Report.css";
// นำเข้าไอคอนสำหรับผู้ใช้ที่ไม่มีรูปโปรไฟล์
import unknownPersonIcon from "../../data-icon/unknown-person-icon.png";
// นำเข้าไอคอนรูปภาพสำหรับการ์ดบริการ
import iconImage from "./icons/icon-image.webp";
import iconText from "./icons/icon-text.webp";
import iconGift from "./icons/icon-gift.webp";
import iconBirthday from "./icons/icon-birthday.webp";

// ฟังก์ชันแปลงตัวเลขเป็นรูปแบบเงินสกุลไทย (เช่น 1000 -> 1,000)
const formatCurrency = (value) => Number(value || 0).toLocaleString("th-TH");

// ข้อมูลประเภทคำสั่งซื้อทั้งหมด พร้อม emoji และป้ายกำกับ
const ORDER_TYPE_META = {
  image: { emoji: "🖼️", label: "รูปภาพ + ข้อความ" },
  text: { emoji: "💬", label: "ข้อความ" },
  gift: { emoji: "🎁", label: "ส่งของขวัญ" },
  birthday: { emoji: "🎂", label: "อวยพรวันเกิด" },
};

// ฟังก์ชันดึงป้ายกำกับของประเภทคำสั่งซื้อ (มี option เลือกแสดง emoji หรือไม่)
const getOrderTypeLabel = (type, options = { includeEmoji: true }) => {
  const meta = ORDER_TYPE_META[type];
  if (!meta) return "";
  return options.includeEmoji ? `${meta.emoji} ${meta.label}` : meta.label;
};

/**
 * Component หน้าหลัก (Home) — Pure Presentation Component
 * ดึง state & business logic ทั้งหมดผ่าน custom hook `useHomeData`
 */
function Home() {
  // ===== Custom Hook Data & Actions =====
  const {
    shopId,
    shopProfile,
    isLoggedIn,
    profileImage,
    status,
    orders,
    ordersStatus,
    statusLoading,
    deleteOrder,
    loadOrders,
    leaderboard,
    rankLoading,
    rankingType,
    userRank,
    birthdayEligibility,
    isBirthday,
    perks,
    alertMessage,
    showAlert,
  } = useHomeData();

  // ===== Navigation & Refs =====
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  // ===== Pure UI Component Modal States =====
  const [showModal, setShowModal] = useState(false); // แสดง/ซ่อน modal สถานะคำสั่งซื้อ
  const [showPerkModal, setShowPerkModal] = useState(false); // แสดง/ซ่อน modal สิทธิพิเศษ
  const [showProfileMenu, setShowProfileMenu] = useState(false); // แสดง/ซ่อน เมนูโปรไฟล์
  const [expandedOrderId, setExpandedOrderId] = useState(null); // order ที่กดดูเพิ่มเติม
  const [deletingOrderId, setDeletingOrderId] = useState(null); // order ที่กำลังลบ

  // ปิดเมนูโปรไฟล์เมื่อคลิกนอกเมนู
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  // ===== Navigation Handlers =====
  const handleSelect = (type) => navigate(`/select?type=${type}&shopId=${shopId}`);
  const handleGift = () => navigate(`/gift?shopId=${shopId}`);

  // เปิด modal ตรวจสอบสถานะคำสั่งซื้อ
  const handleCheckStatus = () => {
    setShowModal(true);
    if (orders.length > 0) {
      loadOrders();
    }
  };

  // ปิด modal สถานะคำสั่งซื้อ
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // ออกจากระบบ (ล้าง localStorage และ reload หน้า)
  const handleLogout = () => {
    localStorage.clear();
    setShowProfileMenu(false);
    navigate("/");
    window.location.reload();
  };

  // ลบรายการ order เดียว
  const handleDeleteOrder = async (orderId) => {
    if (!orderId || deletingOrderId) return;
    if (!window.confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    setDeletingOrderId(orderId);
    try {
      const stat = ordersStatus[orderId];
      if (stat?.status === "pending") {
        try {
          await fetch(`${API_BASE_URL}/api/user-delete-order/${orderId}?shopId=${shopId}`, {
            method: "DELETE",
            headers: { "x-shop-id": shopId },
          });
        } catch (e) {
          console.warn("[Home] Admin delete failed (may already be processed):", e);
        }
      }
      deleteOrder(orderId);
    } catch (err) {
      console.error("[Home] Delete order error:", err);
      showAlert("❌ เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeletingOrderId(null);
    }
  };

  // ลบรายการทั้งหมด
  const handleDeleteAllOrders = async () => {
    if (!window.confirm(`ต้องการลบรายการทั้งหมด (${orders.length} รายการ) หรือไม่?`)) return;
    setDeletingOrderId("all");
    try {
      const pendingOrders = orders.filter((o) => ordersStatus[o.orderId]?.status === "pending");
      await Promise.all(
        pendingOrders.map((o) =>
          fetch(`${API_BASE_URL}/api/user-delete-order/${o.orderId}?shopId=${shopId}`, {
            method: "DELETE",
            headers: { "x-shop-id": shopId },
          }).catch(() => {})
        )
      );
      localStorage.setItem("orders", "[]");
      localStorage.removeItem("order");
      loadOrders();
      showAlert("✅ ลบรายการทั้งหมดสำเร็จ");
    } catch (err) {
      console.error("[Home] Delete all orders error:", err);
      showAlert("❌ เกิดข้อผิดพลาด");
    } finally {
      setDeletingOrderId(null);
    }
  };

  // format เวลาแบบไทย (รวมวินาที)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "medium" });
  };

  // จัดการคลิกการ์ดวันเกิด
  const handleBirthdayCardClick = () => {
    if (!isLoggedIn) {
      showAlert("เข้าสู่ระบบเพื่อรับสิทธิ์วันเกิดฟรี");
      return;
    }
    if (!birthdayEligibility.eligible) {
      const remaining = birthdayEligibility.required - birthdayEligibility.totalSpent;
      showAlert(`ต้องใช้จ่ายอีก ${remaining.toLocaleString()} บาท เพื่อปลดล็อกฟีเจอร์วันเกิด`);
      return;
    }
    if (isBirthday === false) {
      showAlert(`คุณใช้จ่ายครบแล้ว! รอถึงวันเกิดของคุณเพื่อใช้งานฟรี 🎂`);
      return;
    }
    if (isBirthday) navigate(`/select?type=birthday&shopId=${shopId}`);
  };

  // ===== ข้อมูลการ์ดบริการทั้งหมด =====
  const serviceCards = [
    {
      key: "image",
      enabled: status.imageOn,
      className: "image-service",
      badge: "ภาพ",
      title: "ส่งรูปขึ้นจอ",
      features: ["JPG, PNG", "เพิ่มข้อความ", "เลือกสี"],
      price: "เริ่มต้น 1 บาท",
      icon: (
        <img src={iconImage} alt="ส่งรูปขึ้นจอ" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
      ),
      onClick: () => handleSelect("image"),
    },
    {
      key: "text",
      enabled: status.textOn,
      className: "text-service",
      badge: "ข้อความ",
      title: "ส่งข้อความขึ้นจอ",
      features: ["50 ตัวอักษร", "เลือกสี", "รวดเร็ว"],
      price: "เริ่มต้น 1 บาท",
      icon: (
        <img src={iconText} alt="ส่งข้อความขึ้นจอ" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
      ),
      onClick: () => handleSelect("text"),
    },
    {
      key: "gift",
      enabled: status.giftOn,
      className: "gift-service",
      badge: "Gift",
      title: "ส่งของขวัญ",
      features: ["สินค้าหลายแบบ", "ระบุเลขโต๊ะ"],
      price: "ราคาตามสินค้าที่เลือก",
      icon: (
        <img src={iconGift} alt="ส่งของขวัญ" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
      ),
      onClick: handleGift,
    },
  ];

  // ===== JSX Return: แสดงหน้า UI =====
  return (
    <div className="home-container">
      {/* องค์ประกอบพื้นหลังลอยตัว */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="home-wrapper">
        {/* ===== Header: ส่วนหัวของเว็บ ===== */}
        <header className="home-header">
          {/* Logo และชื่อเว็บไซต์ */}
          <div className="header-brand">
            <div
              className="brand-icon"
              style={shopProfile.logo ? {
                borderRadius: "50%",
                background: "transparent",
                padding: 0,
                border: "2px solid rgba(255,255,255,0.5)",
              } : {}}
            >
              {shopProfile.logo ? (
                <img
                  src={shopProfile.logo}
                  alt="Shop Logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
            </div>
            <div className="brand-text">
              <h1 style={{ fontSize: "1.2rem", marginBottom: "2px" }}>{shopProfile.name}</h1>
              <p>CMES</p>
            </div>
          </div>

          {/* เมนูนำทาง: ล็อกอิน/ลงทะเบียน หรือโปรไฟล์ */}
          <nav className="header-nav" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* ปุ่ม Help / Report (เข้าถึงง่ายจากหน้าหลัก) */}
            <button
              onClick={() => navigate(`/report?shopId=${shopId}`)}
              title="ช่วยเหลือ / แจ้งปัญหา"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                backdropFilter: "blur(5px)",
                transition: "all 0.2s"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>

            {isLoggedIn ? (
              /* แสดงเมนูโปรไฟล์เมื่อล็อกอินแล้ว */
              <div className="profile-menu-wrapper">
                <button
                  className={`profile-avatar-btn ${profileImage ? "has-image" : ""}`}
                  type="button"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  title="เลือกเมนูโปรไฟล์"
                >
                  <span className="profile-avatar-ring">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="รูปโปรไฟล์"
                        className="profile-avatar-image"
                        onError={(e) => {
                          e.target.onerror = null;
                        }}
                      />
                    ) : (
                      <svg
                        className="profile-avatar-icon"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </span>
                </button>
                {/* Dropdown menu โปรไฟล์ */}
                {showProfileMenu && (
                  <div
                    ref={profileMenuRef}
                    style={{
                      position: "absolute",
                      top: "56px",
                      right: 0,
                      background: "#fff",
                      borderRadius: "14px",
                      boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
                      minWidth: "220px",
                      overflow: "hidden",
                      zIndex: 20,
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "#fff",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>
                        {localStorage.getItem("username") || "ผู้ใช้"}
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>
                        {localStorage.getItem("email") || "user@example.com"}
                      </div>
                    </div>
                    {[
                      {
                        label: "แก้ไขโปรไฟล์",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        ),
                        action: () => navigate(`/profile?shopId=${shopId}`),
                        danger: false,
                      },
                      {
                        label: "รายงานปัญหา",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        ),
                        action: () => navigate(`/report?shopId=${shopId}`),
                        danger: false,
                      },
                      {
                        label: "ออกจากระบบ",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        ),
                        action: handleLogout,
                        danger: true,
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setShowProfileMenu(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          border: "none",
                          background: "#fff",
                          cursor: "pointer",
                          color: item.danger ? "#ef4444" : "#1f2937",
                          borderTop: "1px solid #f1f5f9",
                          fontSize: "14px",
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/signin" className="nav-btn signin-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10,17 15,12 10,7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </Link>
                <Link to="/signup" className="nav-btn signup-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </header>

        {/* ===== Main Content ===== */}
        <main className="home-main">
          {/* ส่วน Hero: หัวเรื่องและ VIP Panel */}
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                <span>ระบบแสดงผลดิจิทัล</span>
              </div>
              <h2>แชร์เนื้อหาของคุณสู่หน้าจอ</h2>
              <p>เลือกส่งรูปภาพหรือข้อความไปแสดงบนหน้าจอดิจิทัลได้ง่ายๆ</p>
            </div>
            {/* แผง VIP Supporters */}
            {!status.freeMode && <div className="rank-panel premium">
              <div className="rank-panel-header">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: "800", lineHeight: "1.2" }}>VIP Supporters Club</span>
                  <small style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: "400" }}>
                    {rankingType === "daily" && "อันดับรายวัน"}
                    {rankingType === "monthly" && "อันดับรายเดือน"}
                    {rankingType === "alltime" && "อันดับตลอดกาล"}
                    {" • "}สะสมยอดสนับสนุนเพื่อปลดล็อกสิทธิพิเศษ
                  </small>
                </div>
                <div className="rank-total">
                  <label>{isLoggedIn ? "อันดับของคุณ" : "เข้าสู่ระบบเพื่อดูอันดับ"}</label>
                  <strong style={{ fontSize: "28px", fontWeight: "800" }}>#{userRank.toString().padStart(2, "0")}</strong>
                </div>
              </div>
              {/* Top 3 Supporters */}
              <div className="rank-panel-body">
                {rankLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`rank-card tier-${i} position-${i}`} style={{ opacity: 0.5 }}>
                        <div className="rank-profile">
                          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(0,0,0,0.08)", animation: "homePulse 1.8s ease-in-out infinite" }} />
                          <div className="rank-index">#{i}</div>
                        </div>
                        <div className="rank-details">
                          <div style={{ width: "60%", height: "14px", borderRadius: "7px", background: "rgba(0,0,0,0.08)", margin: "0 auto", animation: "homePulse 1.8s ease-in-out infinite" }} />
                          <div style={{ width: "40%", height: "12px", borderRadius: "6px", background: "rgba(0,0,0,0.05)", margin: "4px auto 0", animation: "homePulse 1.8s ease-in-out 0.2s infinite" }} />
                        </div>
                        <div className="rank-badge" style={{ opacity: 0.3 }}>{i === 1 ? "Diamond" : i === 2 ? "Gold" : "Silver"}</div>
                      </div>
                    ))}
                  </>
                ) : (
                  Array.from({ length: 3 }).map((_, index) => {
                    const entry = leaderboard[index];
                    let points = 0;
                    if (entry) {
                      if (rankingType === "daily") points = entry.dailyPoints ?? entry.points ?? 0;
                      else if (rankingType === "monthly") points = entry.monthlyPoints ?? entry.points ?? 0;
                      else points = entry.points || 0;
                    }

                    return (
                      <div
                        key={entry ? (entry.name || index) : `unknown-${index}`}
                        className={`rank-card tier-${index + 1} position-${index + 1}`}
                      >
                        <div className="rank-profile">
                          <img
                            src={entry?.avatar || unknownPersonIcon}
                            alt={entry?.name || `Unknown`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = unknownPersonIcon;
                            }}
                          />
                          <div className="rank-index">#{index + 1}</div>
                        </div>
                        <div className="rank-details">
                          <strong>{entry ? entry.name : "Unknown"}</strong>
                          <span>฿{formatCurrency(points)}</span>
                        </div>
                        <div className="rank-badge">{index === 0 ? "Diamond" : index === 1 ? "Gold" : "Silver"}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>}
          </div>

          {/* ===== Service Cards ===== */}
          <div className="service-cards">
            {serviceCards.map((card) => {
              const isSystemDisabled = !status.systemOn || !card.enabled;
              return (
                <div
                  key={card.key}
                  className={`service-card ${card.className} ${isSystemDisabled ? "disabled" : ""}`}
                  onClick={isSystemDisabled ? null : card.onClick}
                >
                  <div className="card-header">
                    <div className="service-icon">{card.icon}</div>
                    <div className="service-badge">{card.badge}</div>
                  </div>
                  <div className="card-content">
                    <h3>{card.title}</h3>
                    <div className="card-features">
                      {card.features.map((feature) => (
                        <span key={feature} className="feature">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="price-from">{card.price}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  {isSystemDisabled && (
                    <div className="service-card-disabled-overlay">
                      <span className="disabled-badge">ปิดใช้งานชั่วคราว</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Birthday Card */}
            {(() => {
              const isSystemDisabled = !status.systemOn || !status.birthdayOn;
              const isNotEligible = !isLoggedIn || isBirthday === false || (!status.freeMode && !birthdayEligibility.eligible);
              const cannotClick = isSystemDisabled || isNotEligible;

              return (
                <div
                  className={`service-card birthday-service ${isSystemDisabled ? "disabled" : ""}`}
                  onClick={cannotClick ? null : handleBirthdayCardClick}
                  style={{
                    cursor: cannotClick ? "not-allowed" : "pointer",
                    ...(!isSystemDisabled && {
                      background: isNotEligible
                        ? "linear-gradient(90deg, #cbd5e1, #94a3b8)"
                        : "linear-gradient(90deg, #fbbf24, #f472b6)",
                      opacity: isNotEligible ? 0.7 : 1,
                    }),
                    color: "#fff",
                  }}
                >
                  <div className="card-header">
                    <div className="service-icon">
                      <img src={iconBirthday} alt="อวยพรวันเกิด" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                    </div>
                    <div className="service-badge">วันเกิด</div>
                  </div>
                  <div className="card-content">
                    <h3>อวยพรวันเกิด {isLoggedIn && birthdayEligibility.eligible && isBirthday && "🎉 ฟรี!"}</h3>
                    <div className="card-features">
                      {status.freeMode ? (
                        <>
                          <span className="feature">🎉 ใช้งานฟรีสำหรับร้านนี้</span>
                          <span className="feature">📸 รองรับ JPG, PNG</span>
                          <span className="feature">💬 เพิ่มข้อความได้</span>
                        </>
                      ) : isLoggedIn && !birthdayEligibility.eligible ? (
                        <>
                          <span className="feature">💰 ใช้จ่ายแล้ว ฿{birthdayEligibility.totalSpent.toLocaleString()}</span>
                          <span className="feature">🎯 ต้องใช้ครบ ฿{birthdayEligibility.required.toLocaleString()}</span>
                          <span className="feature">📈 เหลืออีก ฿{(birthdayEligibility.required - birthdayEligibility.totalSpent).toLocaleString()}</span>
                        </>
                      ) : isLoggedIn && birthdayEligibility.eligible && !isBirthday ? (
                        <>
                          <span className="feature">✅ ใช้จ่ายครบแล้ว ฿{birthdayEligibility.totalSpent.toLocaleString()}</span>
                          <span className="feature">🎂 รอวันเกิดเพื่อใช้งานฟรี</span>
                          <span className="feature">📸 รองรับ JPG, PNG</span>
                        </>
                      ) : (
                        <>
                          <span className="feature">🎉 สิทธิ์ฟรีสำหรับเจ้าของวันเกิด</span>
                          <span className="feature">📸 รองรับ JPG, PNG</span>
                          <span className="feature">💬 เพิ่มข้อความได้</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="price-from">
                      {!isLoggedIn
                        ? "เข้าสู่ระบบเพื่อรับสิทธิ์"
                        : !status.freeMode && !birthdayEligibility.eligible
                          ? `ใช้จ่ายครบ ฿${birthdayEligibility.required.toLocaleString()} เพื่อปลดล็อก`
                          : isBirthday
                            ? "✨ พร้อมใช้งาน - ฟรีในวันเกิด!"
                            : "✅ พร้อมแล้ว - รอวันเกิดของคุณ"}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  {isSystemDisabled && (
                    <div className="service-card-disabled-overlay">
                      <span className="disabled-badge">ปิดใช้งานชั่วคราว</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Toast Notification */}
          {alertMessage && (
            <div
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                background: "#f43f5e",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "999px",
                boxShadow: "0 10px 30px rgba(190,24,93,0.3)",
                zIndex: 50,
                fontWeight: 600,
              }}
            >
              {alertMessage}
            </div>
          )}

          {/* ===== Order Status Section ===== */}
          <div className="status-section">
            <div className="status-card">
              <div className="status-header">
                <div className="status-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M9 14l2 2 4-4" />
                  </svg>
                </div>
                <h3>สถานะการแสดงผล</h3>
              </div>

              <div className="status-content">
                {orders.length > 0 ? (
                  <div className="orders-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {orders.slice(0, 3).map((ord) => {
                      const stat = ordersStatus[ord.orderId];
                      return (
                        <div key={ord.orderId || Math.random()} className="order-item-compact" style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#f8fafc",
                          borderRadius: "12px",
                          border: "1px solid #f1f5f9"
                        }}>
                          <div className="order-details" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>{getOrderTypeLabel(ord.type)}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {ord.type === "gift" ? `โต๊ะ #${ord.tableNumber}` : (ord.price === 0 ? "ฟรี" : `฿${ord.price}`)}
                            </div>
                          </div>
                          <div className="queue-number">
                            <span className="queue-value" style={{
                              background: stat?.status === "rejected" ? "#fee2e2" :
                                stat?.status === "pending" ? "#fef3c7" :
                                  stat?.status === "playing" ? "#e0f2fe" :
                                    stat?.status === "approved" ? "#dbeafe" :
                                      stat?.status === "completed" ? "#d1fae5" : "#f3f4f6",
                              color: stat?.status === "rejected" ? "#ef4444" :
                                stat?.status === "pending" ? "#f59e0b" :
                                  stat?.status === "playing" ? "#0ea5e9" :
                                    stat?.status === "approved" ? "#3b82f6" :
                                      stat?.status === "completed" ? "#10b981" : "#6b7280",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "600"
                            }}>
                              {stat?.statusText || "..."}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {orders.length > 3 && (
                      <div style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                        +{orders.length - 3} รายการอื่นๆ
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-order">
                    <span className="no-order-icon">📋</span>
                    <span>ยังไม่มีการสั่งซื้อ</span>
                  </div>
                )}
              </div>

              <button className="status-btn" onClick={handleCheckStatus}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                ตรวจสอบสถานะ
              </button>
            </div>
          </div>
        </main>

        {/* ===== Footer ===== */}
        <footer className="home-footer">
          <div className="footer-content">
            <p>&copy; 2025 Digital Signage Content Management System</p>
            <div className="footer-links">
              <a href="#privacy">นโยบายความเป็นส่วนตัว</a>
              <a href="#terms">ข้อกำหนดการใช้งาน</a>
            </div>
          </div>
        </footer>
      </div>

      {/* ===== Bottom Navigation Bar ===== */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button className="bottom-nav-item active" type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>หน้าหลัก</span>
          </button>
          <button className="bottom-nav-item" type="button" onClick={() => setShowPerkModal(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>VIP</span>
          </button>
          <button className="bottom-nav-item" type="button" onClick={handleCheckStatus} style={{ position: "relative" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
            {orders.length > 0 && <span className="bottom-nav-badge" />}
            <span>สถานะ</span>
          </button>
          <button className="bottom-nav-item" type="button" onClick={() => isLoggedIn ? navigate(`/profile?shopId=${shopId}`) : navigate("/")}>
            {profileImage ? (
              <img src={profileImage} alt="โปรไฟล์" className="bottom-nav-avatar" onError={(e) => { e.target.onerror = null; }} />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
            <span>{isLoggedIn ? "โปรไฟล์" : "เข้าสู่ระบบ"}</span>
          </button>
        </div>
      </nav>

      {/* ===== Modal: รายละเอียดสถานะคำสั่งซื้อทั้งหมด ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>รายละเอียดคำสั่งซื้อ ({orders.length})</h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {orders.length > 0 && (
                  <button
                    onClick={handleDeleteAllOrders}
                    disabled={deletingOrderId === "all"}
                    style={{
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px",
                      color: "#f87171", padding: "6px 12px", fontSize: "12px", fontWeight: "600",
                      cursor: deletingOrderId === "all" ? "not-allowed" : "pointer",
                      opacity: deletingOrderId === "all" ? 0.5 : 1, whiteSpace: "nowrap"
                    }}
                  >
                    {deletingOrderId === "all" ? "กำลังลบ..." : "🗑️ ลบทั้งหมด"}
                  </button>
                )}
                <button className="close-button" onClick={handleCloseModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="modal-body">
              {statusLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ width: `${100 + i * 20}px`, height: "14px", borderRadius: "7px", background: "#e2e8f0", animation: "homePulse 1.8s ease-in-out infinite" }} />
                        <div style={{ width: "60px", height: "10px", borderRadius: "5px", background: "#f1f5f9", animation: "homePulse 1.8s ease-in-out 0.2s infinite" }} />
                      </div>
                      <div style={{ width: "80px", height: "28px", borderRadius: "8px", background: "#e2e8f0", animation: "homePulse 1.8s ease-in-out 0.4s infinite" }} />
                    </div>
                  ))}
                  <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>กำลังตรวจสอบสถานะ...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="order-summary-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {orders.map((ord, index) => {
                    const stat = ordersStatus[ord.orderId];
                    const isExpanded = expandedOrderId === ord.orderId;
                    const statusColor = stat?.status === "rejected" ? "#ef4444" :
                      stat?.status === "pending" ? "#f59e0b" :
                        stat?.status === "playing" ? "#0ea5e9" :
                          stat?.status === "approved" ? "#3b82f6" :
                            stat?.status === "completed" ? "#10b981" : "#6b7280";
                    const statusBg = stat?.status === "rejected" ? "#fee2e2" :
                      stat?.status === "pending" ? "#fef3c7" :
                        stat?.status === "playing" ? "#e0f2fe" :
                          stat?.status === "approved" ? "#dbeafe" :
                            stat?.status === "completed" ? "#d1fae5" : "#f3f4f6";

                    return (
                      <div key={ord.orderId || index} style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.1)", overflow: "hidden", backdropFilter: "blur(10px)" }}>
                        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                          onClick={() => setExpandedOrderId(isExpanded ? null : ord.orderId)}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>
                              รายการที่ {orders.length - index} • {getOrderTypeLabel(ord.type)}
                            </div>
                            <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)" }}>
                              ราคา: {ord.price === 0 ? "ฟรี" : `฿${ord.price}`}
                              {ord.type === "gift" && ord.tableNumber ? ` • โต๊ะ #${ord.tableNumber}` : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              background: statusBg, color: statusColor, padding: "5px 12px",
                              borderRadius: "8px", fontSize: "12px", fontWeight: "700"
                            }}>
                              {stat?.statusText || "..."}
                            </span>
                            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "16px", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", padding: "16px", background: "rgba(0, 0, 0, 0.2)" }}>
                            {stat && (
                              <div style={{
                                background: statusBg, padding: "12px 16px", borderRadius: "12px", marginBottom: "12px",
                                borderLeft: `4px solid ${statusColor}`, display: "flex", justifyContent: "space-between", alignItems: "center"
                              }}>
                                <div>
                                  <span style={{ fontWeight: "700", color: "rgba(10, 11, 78, 1)" }}>สถานะ: </span>
                                  <span style={{ fontWeight: "700", color: statusColor }}>{stat.statusText}</span>
                                </div>
                              </div>
                            )}

                            {stat?.order?.queuePosition && (
                              <div className="summary-item">
                                <span className="item-label">ตำแหน่งคิว:</span>
                                <span className="item-value queue-highlight">#{stat.order.queuePosition} / {stat.order.totalQueue}</span>
                              </div>
                            )}

                            {stat?.order?.waitingForApproval ? (
                              <div className="summary-item">
                                <span className="item-label">เวลาแสดงโดยประมาณ:</span>
                                <span className="item-value" style={{ color: "#f59e0b", fontWeight: "600" }}>รอตรวจสอบ</span>
                              </div>
                            ) : stat?.status === "playing" && stat?.order?.remainingSeconds !== undefined ? (
                              <div className="summary-item">
                                <span className="item-label">เวลาคงเหลือ:</span>
                                <span className="item-value" style={{ color: "#0ea5e9", fontWeight: "600" }}>{stat.order.remainingSeconds} วินาที</span>
                              </div>
                            ) : (
                              <>
                                {stat?.order?.estimatedWaitSeconds !== undefined && (
                                  <div className="summary-item">
                                    <span className="item-label">เวลารอประมาณ:</span>
                                    <span className="item-value">{stat.order.estimatedWaitSeconds} วินาที</span>
                                  </div>
                                )}
                                {stat?.order?.estimatedStartTime && (
                                  <div className="summary-item">
                                    <span className="item-label">เวลาแสดงโดยประมาณ:</span>
                                    <span className="item-value">
                                      {new Date(stat.order.estimatedStartTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                      {" - "}
                                      {new Date(stat.order.estimatedEndTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            <div className="summary-item">
                              <span className="item-label">ประเภท:</span>
                              <span className="item-value">{getOrderTypeLabel(ord.type, { includeEmoji: false })}</span>
                            </div>

                            {stat?.order?.socialType && stat?.order?.socialName && (
                              <div className="summary-item">
                                <span className="item-label">โซเชียล:</span>
                                <span className="item-value" style={{ color: "#7c3aed" }}>
                                  {stat.order.socialType === "ig" ? "📷 IG" : stat.order.socialType === "fb" ? "📘 FB" : stat.order.socialType === "line" ? "💬 LINE" : stat.order.socialType === "tiktok" ? "🎵 TikTok" : stat.order.socialType}
                                  {" : "}{stat.order.socialName}
                                </span>
                              </div>
                            )}

                            {(stat?.order?.text || stat?.order?.content) && (ord.type === "image" || ord.type === "text") && (
                              <div className="summary-item">
                                <span className="item-label">ข้อความ:</span>
                                <span className="item-value" style={{ wordBreak: "break-word" }}>
                                  "{stat.order.text || stat.order.content}"
                                </span>
                              </div>
                            )}

                            {stat?.order?.note && ord.type === "gift" && (
                              <div className="summary-item">
                                <span className="item-label">โน้ตเพิ่มเติม:</span>
                                <span className="item-value" style={{ fontStyle: "italic", wordBreak: "break-word" }}>
                                  "{stat.order.note}"
                                </span>
                              </div>
                            )}

                            <div className="summary-item">
                              <span className="item-label">ราคา:</span>
                              <span className="item-value price-highlight">{ord.price === 0 ? "ฟรี" : `฿${ord.price}`}</span>
                            </div>

                            {(stat?.order?.time || stat?.order?.duration || ord.time) && (
                              <div className="summary-item">
                                <span className="item-label">ระยะเวลาแสดง:</span>
                                <span className="item-value">{stat?.order?.time || stat?.order?.duration || ord.time} วินาที</span>
                              </div>
                            )}

                            {stat?.order?.receivedAt && (
                              <div className="summary-item">
                                <span className="item-label">เวลาที่ส่ง:</span>
                                <span className="item-value">{formatDateTime(stat.order.receivedAt)}</span>
                              </div>
                            )}

                            {stat?.order?.startedAt && (
                              <div className="summary-item">
                                <span className="item-label">เริ่มแสดง:</span>
                                <span className="item-value">{formatDateTime(stat.order.startedAt)}</span>
                              </div>
                            )}
                            {stat?.order?.endedAt && (
                              <div className="summary-item">
                                <span className="item-label">จบการแสดง:</span>
                                <span className="item-value">{formatDateTime(stat.order.endedAt)}</span>
                              </div>
                            )}

                            {ord.type === "gift" && (
                              <>
                                <div className="summary-item">
                                  <span className="item-label">โต๊ะ:</span>
                                  <span className="item-value">#{ord.tableNumber}</span>
                                </div>
                                {ord.giftItems && ord.giftItems.length > 0 && (
                                  <div className="summary-item">
                                    <span className="item-label">รายการ:</span>
                                    <span className="item-value gift-items-value">
                                      {ord.giftItems.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            {stat?.order?.mediaUrl && (
                              <div style={{ marginTop: "8px" }}>
                                <span className="item-label" style={{ display: "block", marginBottom: "6px" }}>รูปภาพที่ส่ง:</span>
                                <img src={stat.order.mediaUrl} alt="อัปโหลด" style={{
                                  width: "100%", maxHeight: "200px", objectFit: "contain",
                                  borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "transparent"
                                }} />
                              </div>
                            )}

                            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/report?shopId=${shopId}&orderId=${ord.orderId}&type=${ord.type}`);
                                }}
                                style={{
                                  flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)",
                                  background: "rgba(255, 255, 255, 0.1)", color: "#fff", fontWeight: "600", fontSize: "14px",
                                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                แจ้งปัญหา
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteOrder(ord.orderId); }}
                                disabled={deletingOrderId === ord.orderId}
                                style={{
                                  flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #fecaca",
                                  background: "rgba(239, 68, 68, 0.1)", color: "#f87171", fontWeight: "600", fontSize: "14px",
                                  cursor: deletingOrderId === ord.orderId ? "not-allowed" : "pointer", opacity: deletingOrderId === ord.orderId ? 0.5 : 1
                                }}
                              >
                                {deletingOrderId === ord.orderId ? "กำลังลบ..." : "🗑️ ลบรายการ"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-order-modal">
                  <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8" />
                    </svg>
                    <h4>ไม่มีคำสั่งซื้อ</h4>
                    <p>คุณยังไม่มีการสั่งซื้อบริการ</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: แสดงรายการสิทธิพิเศษ ===== */}
      {showPerkModal && (
        <div className="modal-overlay" onClick={() => setShowPerkModal(false)}>
          <div className="modal-content perk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>สิทธิพิเศษสำหรับสมาชิกพรีเมี่ยม</h3>
              <button className="close-button" onClick={() => setShowPerkModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <ul className="perk-list">
                {perks.map((perk, index) => (
                  <li key={index}>{perk}</li>
                ))}
              </ul>
              {(() => {
                const target = status.imageOn ? `/select?type=image&shopId=${shopId}`
                  : status.textOn ? `/select?type=text&shopId=${shopId}`
                  : status.giftOn ? `/gift?shopId=${shopId}`
                  : status.birthdayOn ? `/select?type=birthday&shopId=${shopId}`
                  : null;
                if (!target) return null;
                return (
                  <button className="primary-btn perk-action" onClick={() => navigate(target)}>เริ่มต้นสนับสนุน</button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
