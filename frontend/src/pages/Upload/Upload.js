// ==================== IMPORTS ====================
// นำเข้า React hooks สำหรับจัดการ state และ side effects
import { FiChevronLeft } from "react-icons/fi";
import { getToken, showToast } from "../../services/authService";
import React, { useState, useEffect } from "react";
// นำเข้า hooks สำหรับการนำทาง (routing)
import { useLocation, useNavigate } from "react-router-dom";
// นำเข้า URL ของ Backend API (User และ Admin)
import API_BASE_URL from "../../config/apiConfig";
// นำเข้าฟังก์ชันสำหรับเพิ่มหมายเลขคิว (Queue Number)
import { incrementQueueNumber } from "../../utils";
// นำเข้า CSS สำหรับ styling
import "./Upload.css";
// นำเข้า logo ของ social media ต่างๆ
import igLogo from "../../data-icon/ig-logo.png";
import fbLogo from "../../data-icon/facebook-logo.png";
import lineLogo from "../../data-icon/line-logo.png";
import tiktokLogo from "../../data-icon/tiktok-logo.png";

const authenticatedHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const QR_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

// ==================== COMPONENT MAIN ====================
function Upload() {
  // ==================== ROUTING & URL PARAMETERS ====================
  // ดึงข้อมูลจาก URL (location) และฟังก์ชันสำหรับเปลี่ยนหน้า (navigate)
  const location = useLocation();
  const navigate = useNavigate();

  // แปลง query parameters จาก URL (เช่น ?type=image&time=60&price=100)
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get("type");           // ประเภท: "image", "text", หรือ "birthday"
  const shopId = queryParams.get("shopId") || localStorage.getItem("shopId") || "";
  console.log("[Upload] shopId:", shopId);
  const time = parseInt(queryParams.get("time")); // เวลาแสดง (วินาที)
  const price = parseInt(queryParams.get("price")); // ราคา (บาท)
  const isFree = queryParams.get("free") === "true"; // เช็คว่าฟรีหรือไม่

  // ==================== STATE DECLARATIONS ====================
  const [text, setText] = useState("");  // เก็บข้อความที่ผู้ใช้พิมพ์
  const [image, setImage] = useState(null);// เก็บไฟล์รูปภาพที่ผู้ใช้อัปโหลด
  const [showModal, setShowModal] = useState(false);  // เปิด/ปิด modal ข้อกำหนดการใช้งาน
  const [showPreviewModal, setShowPreviewModal] = useState(false); // เปิด/ปิด modal แสดงตัวอย่างก่อนยืนยัน
  const [alertMessage, setAlertMessage] = useState(""); // ข้อความแจ้งเตือน (error หรือ warning)
  const [textColor, setTextColor] = useState("#ffffff"); // สีของข้อความ (hex)
  const [socialColor, setSocialColor] = useState("#ffffff"); // สีของชื่อ social (hex)
  const [textLayout, setTextLayout] = useState("right"); // เทมเพลต layout: right, left, top, bottom, center
  const [selectedSocial, setSelectedSocial] = useState(""); // โซเชียลมีเดียที่เลือก (ig, fb, line, tiktok)
  const [socialName, setSocialName] = useState(""); // ชื่อ username หรือ ID ของโซเชียลมีเดีย
  const [actualType, setActualType] = useState(type); // type จริงๆ ของคำสั่งซื้อ (อาจแตกต่างจาก URL ถ้ามีการเปลี่ยนแปลง)
  const [qrCodeFile, setQrCodeFile] = useState(null); // ไฟล์ QR Code สำหรับ Instagram (ถ้ามี)
  const [isUploading, setIsUploading] = useState(false); // สถานะกำลังอัปโหลดเพื่อป้องกันการกดซ้ำ
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false); // สถานะกำลังเจน AI caption
  const [showCaptionPicker, setShowCaptionPicker] = useState(false); // เปิด/ปิด modal เลือกแคปชั่น
  const [openCategory, setOpenCategory] = useState(null); // หมวดหมู่ที่เปิดอยู่ใน modal

  // ==================== CONSTANTS ====================
  const MAX_TEXT_LENGTH = 50; // จำนวนตัวอักษรสูงสุดที่อนุญาตให้พิมพ์

  // ==================== PRESET CAPTIONS: แคปชั่นสำเร็จรูปสำหรับสุ่ม/เลือก ====================
  const PRESET_CAPTIONS = {
    "แคปชั่นมาใหม่": [
      "เมาไม่หลับ มารับเหล้าที่ร้านก่อน",
      "มีแก้วแล้ว ก็ต้องมีเราไหม",
      "โต๊ะไหนไม่สำคัญ ขอแค่มีเธอนั่งด้วยก็พอ",
      "คนอื่นเมาเหล้า แต่เราเมาเธอ",
      "อย่ามองบ่อย เดี๋ยวหลงรักไม่รู้ตัว",
      "มาเงียบๆ แต่นั่งหล่อเสียงดัง",
      "กินเหล้าเอาสังคม",
      "กลับบ้านไหวมั้ย ถ้าไม่ไหวก็กลับมาหาเรา",
      "โต๊ะนี้ไม่มีคนคุย แต่มีคนคอย",
      "มานั่งร้านเหล้า ไม่ได้เหงา แค่ว่าง",
      "เพื่อนเราหล่อมาก ถ้าปิดไฟ",
      "มากับเพื่อน แต่ไม่มีใครกักเพื่อนเลย",
      "เพื่อนเราไม่เมา แค่ลืมว่าตัวเองเป็นใคร",
      "เบียร์ไม่หวาน แต่เราหวานนะ",
      "ถ้าเธอชอบคนกินเหล้า เราคือตัวเลือกที่ดี",
      "ใครโสดยกแก้ว ใครเหงาเดินมาเลย",
      "เบียร์หมดเติมได้ แต่คนข้างกายเติมยัง",
      "ชงไม่เก่ง แต่เทเก่งนะ",
      "แก้วแรกไม่เป็นไร แก้วต่อไปอยู่โต๊ะ",
    ],
    "แอคหนุ่ม/สาว": [
      "พี่หล่อมั้ยน้อง ชนแก้วกัน",
      "โต๊ะข้างๆน่ารักจัง",
      "สวยขนาดนี้ยังโสดอยู่นะ",
      "ใครว่างมาชนแก้วกัน",
      "มองอะไร มานั่งด้วยกันเลย",
      "หล่อแบบนี้ ใครจะไม่มอง",
      "น่ารักจัง มาจากโต๊ะไหน",
      "เดินผ่านทีไร ใจเต้นทุกที",
      "ถ้ามองแล้วใจสั่น มานั่งด้วยกัน",
      "คนนั้นน่ารัก คนนี้ก็น่ารัก แต่เราน่ารักสุด",
      "ไม่ต้องแอคหรอก แค่มองก็รู้ว่าสนใจ",
      "ถ้าเธอไม่มา เราจะไปเอง",
    ],
    "ปาร์ตี้/ชนแก้ว": [
      "คืนนี้ไม่เมาไม่กลับ",
      "แก๊งนี้ไม่มีใครเบรค",
      "ชนแก้วกันมั้ย",
      "ดื่มให้สนุก อย่าดื่มให้เมา",
      "วันนี้ดื่มฉลอง พรุ่งนี้ค่อยเสียใจ",
      "แก้วนี้อุทิศให้คนโสด",
      "เมาแล้วพูดความจริง",
      "ยกแก้วให้คนที่กล้ามา",
      "คืนนี้ vibe ดีมาก",
      "เต้นไม่เป็น แต่ดื่มเก่ง",
      "มาร้านนี้ครั้งแรก แต่เมาเหมือนขาประจำ",
      "แก้วแรกชิล แก้วสามเริ่มบ้า",
    ],
    "Gen Z สุดปัง": [
      "67 ถูกใจใช่เลย",
      "scuba ไปเลยพี่",
      "เริสมากแม่",
      "slay ทั้งร้าน",
      "vibe คือดีย์",
      "real ones only",
      "ปังทุกช็อต",
      "ตัวแม่มาแล้ว",
      "ชิลไปไหน",
      "คือดี ไม่ต้องอธิบาย",
      "67 scuba เริส ปังนางมาก",
      "main character energy",
    ],
    "ฮาๆ ขำๆ": [
      "เมาแล้วหล่อขึ้น จริงมั้ย",
      "มาร้านเหล้าหาแฟน ได้แค่แฮงค์",
      "สั่งเบียร์มา 2 แก้ว อีกแก้วให้เงา",
      "ถ่ายรูปหล่อไว้ก่อน เดี๋ยวเมาถ่ายไม่ได้",
      "หน้าตาดี แต่ตับไม่ดี",
      "มาคนเดียว กลับ 0 คน เพราะหลับอยู่ร้าน",
      "เพื่อนชวนมา 5 นาที อยู่ต่อ 5 ชั่วโมง",
      "บอกว่าแก้วเดียว ตอนนี้แก้วที่ 7",
      "เมาไม่ขับ แต่เมาโทรหาแฟนเก่า",
      "พรุ่งนี้ค่อยเสียใจ คืนนี้สนุกก่อน",
    ],
  };

  // รวมแคปชั่นทั้งหมดเป็น array เดียว
  const ALL_CAPTIONS = Object.values(PRESET_CAPTIONS).flat();

  // ==================== HANDLER: สุ่มแคปชั่น ====================
  const handleRandomCaption = () => {
    const randomIndex = Math.floor(Math.random() * ALL_CAPTIONS.length);
    setText(ALL_CAPTIONS[randomIndex]);
    setAlertMessage("");
  };

  // ==================== HANDLER: เลือกแคปชั่นจาก modal ====================
  const handleSelectCaption = (caption) => {
    setText(caption);
    setShowCaptionPicker(false);
    setAlertMessage("");
  };

  // ==================== useEffect: โหลดข้อมูลจาก localStorage ====================
  // รันครั้งเดียวตอน component mount และเมื่อ type เปลี่ยน
  useEffect(() => {
    // โหลด draft ที่ผู้ใช้พิมพ์ค้างไว้ (กรณีกลับมาแก้ไข)
    const saved = localStorage.getItem("uploadFormDraft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data) {
          // กู้คืนข้อมูลที่พิมพ์ไว้
          setText(data.text || "");
          setTextColor(data.textColor || "#ffffff");
          setSocialColor(data.socialColor || "#ffffff");
          setTextLayout(data.textLayout || "right");
          setSelectedSocial(data.selectedSocial || "");
          setSocialName(data.socialName || "");
          // หมายเหตุ: ไม่เก็บรูปภาพใน localStorage เพราะขนาดใหญ่เกินไป
        }
      } catch {
        // ถ้า parse ไม่ได้ ให้ข้ามไป
      }
    }

    // ดึง actual type จาก order ที่ Select.js บันทึกไว้
    // (สำคัญสำหรับ birthday type ที่อาจถูกเปลี่ยนจาก image)
    const order = localStorage.getItem("order");
    if (order) {
      try {
        const orderData = JSON.parse(order);
        console.log("[Upload] Order from localStorage:", orderData);
        setActualType(orderData.type || type);
      } catch {
        // ถ้า parse ไม่ได้ ใช้ type จาก URL
        setActualType(type);
      }
    }
  }, [type]);

  // ==================== useEffect: Auto-save ข้อมูล ====================
  // บันทึกข้อมูลลง localStorage ทุกครั้งที่ state เหล่านี้เปลี่ยนแปลง
  // เพื่อไม่ให้ข้อมูลหายถ้าผู้ใช้ปิดหน้าหรือย้อนกลับ
  useEffect(() => {
    // หมายเหตุ: ไม่เก็บรูปภาพที่นี่เพราะ File object ไม่สามารถ stringify ได้
    // รูปภาพจะถูกเก็บเป็น base64 แยกต่างหากใน handleImageChange
    localStorage.setItem(
      "uploadFormDraft",
      JSON.stringify({
        text,
        textColor,
        socialColor,
        textLayout,
        selectedSocial,
        socialName,
      })
    );
  }, [text, textColor, socialColor, textLayout, selectedSocial, socialName]);

  // ==================== HANDLER: การเปลี่ยนแปลงข้อความ ====================
  // จัดการตอนผู้ใช้พิมพ์ข้อความ พร้อมตรวจสอบความยาว
  const handleTextChange = (e) => {
    const inputText = e.target.value;

    // ตรวจสอบว่าไม่เกินจำนวนตัวอักษรสูงสุด
    if (inputText.length <= MAX_TEXT_LENGTH) {
      setText(inputText);
      setAlertMessage(""); // ลบข้อความ error ถ้ามี
    } else {
      // แจ้งเตือนถ้าพิมพ์เกินขีดจำกัด
      setAlertMessage(`ข้อความต้องไม่เกิน ${MAX_TEXT_LENGTH} ตัวอักษร`);
    }
  };

  // ==================== HANDLER: การอัปโหลดรูปภาพ ====================
  // จัดการตอนผู้ใช้เลือกไฟล์รูปภาพ พร้อมตรวจสอบขนาด
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        setAlertMessage("รองรับเฉพาะรูป JPG, PNG หรือ WebP");
        e.target.value = "";
        return;
      }
      // Keep the browser limit lower than the server hard limit so venue Wi-Fi
      // stays responsive when several guests submit at once.
      if (file.size > MAIN_IMAGE_MAX_BYTES) {
        setAlertMessage("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
        e.target.value = "";
        return;
      }

      // เก็บไฟล์ใน state
      setImage(file);
      setAlertMessage("");

      // แปลงรูปเป็น base64 และเก็บลง localStorage เพื่อกู้คืนได้หลัง refresh
      const reader = new FileReader();
      reader.onload = function (ev) {
        localStorage.setItem("uploadFormImage", ev.target.result);
      };
      reader.readAsDataURL(file); // อ่านไฟล์และแปลงเป็น base64
    }
  };

  // ==================== HANDLER: การอัปโหลด QR Code ====================
  // จัดการตอนผู้ใช้เลือกไฟล์ QR Code สำหรับ Instagram (ไม่บังคับ)
  const handleQRCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        setAlertMessage("QR Code รองรับเฉพาะ JPG, PNG หรือ WebP");
        e.target.value = "";
        return;
      }
      if (file.size > QR_IMAGE_MAX_BYTES) {
        setAlertMessage("QR Code ต้องมีขนาดไม่เกิน 2 MB");
        e.target.value = "";
        return;
      }
      setQrCodeFile(file);
      setAlertMessage("");
    }
  };

  // ==================== HANDLER: สร้างแคปชั่นด้วย AI (Gemini) ====================
  // แปลงรูปภาพเป็น base64 แล้วส่งไป Backend เพื่อให้ Gemini AI วิเคราะห์และสร้าง caption
  // รองรับ auto-retry เมื่อ AI quota เต็ม
  // eslint-disable-next-line no-unused-vars
  const [captionRetryCount, setCaptionRetryCount] = useState(0);
  const [captionCooldown, setCaptionCooldown] = useState(0);

  // Countdown timer สำหรับ cooldown
  useEffect(() => {
    if (captionCooldown <= 0) return;
    const timer = setInterval(() => {
      setCaptionCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [captionCooldown]);

  const handleGenerateCaption = async () => {
    if (!image) {
      setAlertMessage("กรุณาเลือกรูปภาพก่อนใช้ AI สร้างแคปชั่น");
      return;
    }

    if (captionCooldown > 0) return; // ยังอยู่ใน cooldown

    setIsGeneratingCaption(true);
    setAlertMessage("");

    try {
      // แปลงรูปเป็น base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(image);
      const imageBase64 = await base64Promise;

      // ส่งไป Backend
      const response = await fetch(`${API_BASE_URL}/api/generate-caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: image.type || "image/jpeg"
        })
      });

      // Handle non-JSON responses safely
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("[AI Caption] Non-JSON response:", responseText);
        setAlertMessage("AI ไม่สามารถสร้างแคปชั่นได้ กรุณาลองใหม่");
        return;
      }

      if (data.success && data.caption) {
        setText(data.caption);
        setCaptionRetryCount(0); // reset retry count on success
        setAlertMessage(""); // clear any previous error
      } else if (data.errorCode === "QUOTA_EXCEEDED") {
        // AI quota เต็ม — ตั้ง cooldown 60 วินาที
        const cooldownSec = 60;
        setCaptionCooldown(cooldownSec);
        setCaptionRetryCount(prev => prev + 1);
        setAlertMessage(`⏳ AI กำลังพักชั่วคราว รอ ${cooldownSec} วินาทีแล้วลองกดใหม่`);
      } else {
        setAlertMessage(data.message || "AI ไม่สามารถสร้างแคปชั่นได้");
      }
    } catch (error) {
      console.error("[AI Caption] Error:", error);
      setAlertMessage("เกิดข้อผิดพลาดในการสร้างแคปชั่น กรุณาลองใหม่");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // ==================== useEffect: โหลดรูปภาพจาก localStorage ====================
  // รันครั้งเดียวตอน mount เพื่อกู้คืนรูปที่ผู้ใช้อัปโหลดไว้ก่อนหน้า
  useEffect(() => {
    const saved = localStorage.getItem("uploadFormImage");
    if (saved) {
      // แปลง base64 กลับมาเป็น File object
      const arr = saved.split(",");
      if (arr.length > 1) {
        // ดึง MIME type จาก base64 string
        const mime = arr[0].match(/:(.*?);/)[1];
        // Decode base64 เป็น binary string
        const bstr = atob(arr[1]);
        let n = bstr.length;
        // สร้าง Uint8Array จาก binary string
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        // สร้าง File object จาก Uint8Array
        const file = new File([u8arr], "image.png", { type: mime });
        setImage(file);
      }
    }
  }, []);

  // ==================== HANDLER: การกดปุ่มอัปโหลด ====================
  // ตรวจสอบความถูกต้องก่อนอนุญาตให้อัปโหลด
  const handleUpload = () => {
    // ตรวจสอบว่ามีรูปภาพสำหรับ type ที่ต้องการรูป
    if ((type === "image" || type === "birthday") && !image) {
      setAlertMessage("โปรดเลือกไฟล์รูปภาพ");
      return;
    }

    // ตรวจสอบว่ามีข้อความ
    if (!text.trim()) {
      setAlertMessage("โปรดใส่ข้อความ");
      return;
    }

    // ถ้าผ่านการตรวจสอบแล้ว แสดง modal ยืนยัน
    setShowPreviewModal(true);
  };



  // ==================== สร้างข้อความแสดง Social Media ====================
  // สร้างข้อความแบบ text ธรรมดา (เช่น "IG: username123")
  const socialText = selectedSocial && socialName
    ? (() => {
      switch (selectedSocial) {
        case "ig": return `IG: ${socialName}`;
        case "fb": return `Facebook: ${socialName}`;
        case "line": return `Line: ${socialName}`;
        case "tiktok": return `Tiktok: ${socialName}`;
        default: return "";
      }
    })()
    : "";

  // สร้าง JSX element สำหรับแสดง social บนรูปภาพ (มี logo + ชื่อ)
  const socialOnImage = selectedSocial && socialName
    ? (() => {
      // Map social type ไปหา logo ที่ตรงกัน
      const logoMap = {
        ig: igLogo,
        fb: fbLogo,
        line: lineLogo,
        tiktok: tiktokLogo
      };

      const logoSrc = logoMap[selectedSocial];
      if (!logoSrc) return null;

      // Return JSX element ที่มี logo และ username
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <img
            src={logoSrc}
            alt={selectedSocial.toUpperCase()}
            style={{ width: "22px", height: "22px", objectFit: "contain" }}
          />
          <span style={{
            fontWeight: "700",
            fontSize: "20px",
            color: socialColor,
            textShadow: "0 2px 6px rgba(0,0,0,0.8)"
          }}>{socialName}</span>
        </span>
      );
    })()
    : null;

  // ==================== HANDLER: ยืนยันและอัปโหลดเนื้อหา ====================
  // ฟังก์ชันหลักสำหรับยืนยันและส่งข้อมูลไปยัง Backend
  // จัดการทั้งกรณีฟรีและมีค่าใช้จ่าย, ทั้งรูปภาพและข้อความ
  const handleAccept = async () => {
    if (isUploading) return; // ป้องกันการกดซ้ำ
    setIsUploading(true);
    console.log("[Upload] handleAccept called, type:", type, "actualType:", actualType, "isFree:", isFree);

    // ==================== กรณี: อัปโหลดรูปภาพ (image หรือ birthday) ====================
    if ((type === "image" || type === "birthday") && image) {
      // ดึงข้อมูลผู้ใช้จาก localStorage เพื่อส่งไปกับการอัปโหลด
      // ดึงข้อมูลผู้ใช้จาก localStorage เพื่อส่งไปกับการอัปโหลด
      let sender = "Unknown";   // ชื่อผู้ส่ง
      let userId = null;        // ID ของผู้ใช้
      let email = null;         // อีเมล
      let avatar = null;        // URL รูปโปรไฟล์

      const user = localStorage.getItem("user");
      if (user) {
        try {
          const userObj = JSON.parse(user);
          sender = userObj.name || userObj.username || "Unknown";
          userId = userObj.id || null;
          email = userObj.email || null;
          avatar = userObj.avatar || null;
          console.log("[Upload] User data: userId=", userId, "email=", email);
        } catch (err) {
          console.warn("[Upload] Cannot parse user data:", err);
          sender = "Unknown";
        }
      }

      // ==================== กรณี: สินค้าฟรี ====================
      // ==================== กรณี: สินค้าฟรี ====================
      if (isFree) {
        // สำหรับสินค้าฟรี ส่งรูปไป Admin Backend ทันทีและอนุมัติเลย
        const formData = new FormData();
        formData.append("file", image);                          // ไฟล์รูปภาพ
        if (qrCodeFile) formData.append("qrCode", qrCodeFile);  // QR Code (ถ้ามี)
        formData.append("type", actualType || "image");        // ประเภทเนื้อหา
        formData.append("time", time || "60");                 // เวลาแสดง (วินาที)
        formData.append("price", "0");                          // ฟรี = 0 บาท
        formData.append("textColor", textColor);                // สีข้อความ
        formData.append("socialColor", socialColor);             // สี social
        formData.append("textLayout", textLayout);              // เทมเพลต layout
        formData.append("text", text);                          // ข้อความ
        formData.append("socialType", selectedSocial);          // ประเภท social media
        formData.append("socialName", socialName);              // ญื่อ social
        formData.append("composed", "0");                       // ยังไม่ได้ compose
        formData.append("status", "pending");                   // สถานะ: รออนุมัติ
        formData.append("sender", sender);                      // ชื่อผู้ส่ง
        if (userId) formData.append("userId", userId);         // User ID
        if (email) formData.append("email", email);            // Email
        if (avatar) formData.append("avatar", avatar);         // Avatar URL

        try {
          console.log("[Upload] Uploading FREE item with type:", actualType, "to Admin backend");
          // ส่งไปยัง Admin Backend
          const response = await fetch(`${API_BASE_URL}/api/upload?shopId=${shopId}`, {
            method: "POST",
            headers: { "x-shop-id": shopId, ...authenticatedHeaders() },
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log("[Upload] Upload success:", result);
            console.log("[Upload] Received uploadId from Admin:", result.uploadId);

            // สร้างหมายเลขคิวใหม่
            const currentQueueNumber = parseInt(localStorage.getItem("currentQueueNumber") || "0") + 1;
            localStorage.setItem("currentQueueNumber", currentQueueNumber.toString());

            // สร้างข้อมูลคำสั่งซื้อ
            const newOrder = {
              type: actualType || type,
              time: time,
              price: 0,
              queueNumber: currentQueueNumber,
              orderId: result.uploadId  // uploadId จาก Admin
            };

            console.log("[Upload] Creating FREE order with orderId:", newOrder.orderId, "type:", newOrder.type);

            // บันทึกคำสั่งซื้อลง localStorage
            const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
            existingOrders.push(newOrder);
            localStorage.setItem("orders", JSON.stringify(existingOrders));
            localStorage.setItem("order", JSON.stringify(newOrder));

            // ลบข้อมูลชั่วคราว
            localStorage.removeItem("uploadFormDraft");
            localStorage.removeItem("uploadFormImage");

            showToast("✅ อัปโหลดสำเร็จ!", "success");
            navigate(`/home${shopId ? `?shopId=${shopId}` : ''}`);  // กลับไปหน้าหลัก
          } else {
            const errText = await response.text();
            console.error("[Upload] Upload failed:", response.status, errText);
            throw new Error(`Upload failed: ${response.status} ${errText}`);
          }
        } catch (error) {
          console.error('[Upload] Error uploading:', error);
          setAlertMessage("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่");
          setIsUploading(false);
        }
      } else {
        // ==================== กรณี: สินค้ามีค่าใช้จ่าย ====================
        // ส่งไฟล์ไปยัง User Backend ก่อน แล้วค่อยไปหน้าชำระเงิน
        try {
          const formData = new FormData();
          formData.append("file", image);
          if (qrCodeFile) {
            formData.append("qrCode", qrCodeFile);
          }
          formData.append("type", actualType || "image");
          formData.append("time", time || "60");
          formData.append("price", price || "1");
          formData.append("text", text || "");
          formData.append("textColor", textColor || "#ffffff");
          formData.append("socialColor", socialColor || "#ffffff");
          formData.append("textLayout", textLayout || "right");
          formData.append("sender", sender);
          formData.append("userId", userId || "guest");
          formData.append("email", email || "");
          formData.append("avatar", avatar || "");
          formData.append("socialType", selectedSocial || "");
          formData.append("socialName", socialName || "");

          console.log("[Upload] Sending file to backend...");
          // ส่งไฟล์ไปยัง User Backend เพื่อเก็บชั่วคราว
          const response = await fetch(`${API_BASE_URL}/api/upload?shopId=${shopId}`, {
            method: "POST",
            headers: { "x-shop-id": shopId, ...authenticatedHeaders() },
            body: formData
          });

          if (!response.ok) {
            throw new Error("Failed to upload file");
          }

          const data = await response.json();
          if (!data.success || !data.uploadId) {
            throw new Error("Invalid response from server");
          }

          console.log("[Upload] File uploaded, uploadId:", data.uploadId);

          // เก็บแค่ uploadId และข้อมูลสำคัญ (ไม่เก็บไฟล์)
          const uploadData = {
            uploadId: data.uploadId,
            type: actualType || "image",
            time: time || "60",
            price: price || "1",
            sender,
            userId,
            email,
            avatar  // ✅ ส่ง avatar ไปด้วยเพื่อให้ ranking record มีรูป
          };

          localStorage.setItem("pendingUploadData", JSON.stringify(uploadData));
          console.log("[Upload] Saved uploadId to localStorage");

          setShowPreviewModal(false);

          // ถ้าฟรี (ราคา 0) ให้ confirm และส่งไปหน้า home เลย
          if (Number(price) === 0) {
            try {
              const confirmResponse = await fetch(`${API_BASE_URL}/api/confirm-payment?shopId=${shopId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-shop-id": shopId,
                  ...authenticatedHeaders()
                },
                body: JSON.stringify({
                  uploadId: data.uploadId,
                  userId,
                  email,
                  avatar
                })
              });

              if (!confirmResponse.ok) {
                const errText = await confirmResponse.text();
                throw new Error(`Payment confirmation failed: ${confirmResponse.status} ${errText}`);
              }

              const result = await confirmResponse.json();
              console.log("[Upload] Free payment confirmed:", result);

              const currentQueueNumber = incrementQueueNumber();
              const newOrder = {
                type: uploadData.type,
                time: uploadData.time,
                price: uploadData.price,
                queueNumber: currentQueueNumber,
                orderId: result.uploadId || data.uploadId  // ใช้ uploadId จาก Admin (ถ้ามี) หรือ User Backend
              };

              console.log("[Upload] Creating order with orderId:", newOrder.orderId, "from Admin");

              const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
              existingOrders.push(newOrder);
              localStorage.setItem("orders", JSON.stringify(existingOrders));
              localStorage.setItem("order", JSON.stringify(newOrder));

              localStorage.removeItem("pendingUploadData");
              localStorage.removeItem("uploadFormDraft");
              localStorage.removeItem("uploadFormImage");

              navigate(`/home${shopId ? `?shopId=${shopId}` : ''}`);
              return;
            } catch (confirmError) {
              console.error('[Upload] Free order confirmation error:', confirmError);
              setAlertMessage("เกิดข้อผิดพลาดในการยืนยันคำสั่ง กรุณาลองใหม่");
              setIsUploading(false);
              return;
            }
          }

          // มีค่าใช้จ่าย ไปหน้าชำระเงินตามปกติ
          navigate(`/payment?price=${price}&type=${actualType || type}&time=${time}&uploadId=${data.uploadId}&shopId=${shopId}`);
        } catch (error) {
          console.error('[Upload] Error uploading file:', error);
          setAlertMessage("เกิดข้อผิดพลาดในการอัพโหลดไฟล์ กรุณาลองใหม่");
          setIsUploading(false);
        }
      }
    } else if (type === "text") {
      // ==================== กรณี: อัปโหลดข้อความเท่านั้น (text) ====================
      // ดึงข้อมูลผู้ใช้จาก localStorage
      let sender = "Unknown";
      let userId = null;
      let email = null;
      let avatar = null;

      const user = localStorage.getItem("user");
      if (user) {
        try {
          const userObj = JSON.parse(user);
          sender = userObj.name || userObj.username || "Unknown";
          userId = userObj.id || null;
          email = userObj.email || null;
          avatar = userObj.avatar || null;
          console.log("[Upload Text] User data: userId=", userId, "email=", email);
        } catch (err) {
          console.warn("[Upload Text] Cannot parse user data:", err);
          sender = "Unknown";
        }
      }

      // ==================== กรณี: ข้อความฟรี ====================
      if (isFree) {
        // สำหรับข้อความฟรี ส่งไป Admin Backend ทันทีและอนุมัติเลย
        const payload = {
          type,
          text,
          time,
          price: 0,  // ฟรี
          sender,
          userId,
          email,
          avatar,
          textColor,
          socialColor,
          textLayout,
          socialType: selectedSocial,
          socialName: socialName,
          status: "pending"  // อนุมัติอัตโนมัติสำหรับข้อความฟรี
        };

        try {
          const response = await fetch(`${API_BASE_URL}/api/upload?shopId=${shopId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-shop-id": shopId,
              ...authenticatedHeaders()
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const result = await response.json();
            // สร้างหมายเลขคิว
            const currentQueueNumber = parseInt(localStorage.getItem("currentQueueNumber") || "0") + 1;
            localStorage.setItem("currentQueueNumber", currentQueueNumber.toString());

            // สร้างข้อมูลคำสั่งซื้อ
            const newOrder = {
              type,
              time,
              price: 0,
              queueNumber: currentQueueNumber,
              orderId: result.uploadId
            };

            // บันทึกลง localStorage
            const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
            existingOrders.push(newOrder);
            localStorage.setItem("orders", JSON.stringify(existingOrders));
            localStorage.setItem("order", JSON.stringify(newOrder));

            // ลบข้อมูลชั่วคราว
            localStorage.removeItem("uploadFormDraft");

            setShowPreviewModal(false);
            navigate(`/home${shopId ? `?shopId=${shopId}` : ''}`);
          } else {
            throw new Error('Failed to upload');
          }
        } catch (error) {
          console.error('Error uploading:', error);
          setAlertMessage("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่");
          setIsUploading(false);
        }
      } else {
        // ==================== กรณี: ข้อความมีค่าใช้จ่าย ====================
        // ส่งข้อมูลไป User Backend เพื่อสร้าง uploadId ก่อน
        try {
          const formData = new FormData();
          formData.append("type", type);
          formData.append("text", text);
          formData.append("time", time || "60");
          formData.append("price", price || "1");
          formData.append("textColor", textColor);
          formData.append("socialColor", socialColor || "#ffffff");
          formData.append("textLayout", textLayout || "right");
          formData.append("socialType", selectedSocial || "");
          formData.append("socialName", socialName || "");
          formData.append("sender", sender);
          formData.append("userId", userId || "guest");
          formData.append("email", email || "");
          formData.append("avatar", avatar || "");

          console.log("[Upload] Sending text data to backend...");
          const response = await fetch(`${API_BASE_URL}/api/upload?shopId=${shopId}`, {
            method: "POST",
            headers: { "x-shop-id": shopId, ...authenticatedHeaders() },
            body: formData
          });

          if (!response.ok) {
            throw new Error("Failed to upload text data");
          }

          const data = await response.json();
          if (!data.success || !data.uploadId) {
            throw new Error("Invalid response from server");
          }

          console.log("[Upload] Text uploaded, uploadId:", data.uploadId);

          // เก็บ uploadId และข้อมูลสำคัญ
          const uploadData = {
            uploadId: data.uploadId,
            type,
            text,
            time: time || "60",
            price: price || "1",
            sender,
            userId,
            email,
            avatar  // ✅ ส่ง avatar ไปด้วยเพื่อให้ ranking record มีรูป
          };

          localStorage.setItem("pendingUploadData", JSON.stringify(uploadData));
          console.log("[Upload] Saved uploadId to localStorage");

          setShowPreviewModal(false);

          // มีค่าใช้จ่าย ไปหน้าชำระเงินตามปกติ
          navigate(`/payment?price=${price}&type=${type}&time=${time}&uploadId=${data.uploadId}&shopId=${shopId}`);
        } catch (error) {
          console.error('[Upload] Error uploading text:', error);
          setAlertMessage("เกิดข้อผิดพลาดในการอัพโหลดข้อมูล กรุณาลองใหม่");
          setIsUploading(false);
        }
      }
    }
  };

  // ==================== HANDLER: แก้ไขเนื้อหา ====================
  // ปิด preview modal และกลับไปแก้ไขข้อมูล
  const handleEdit = () => {
    setShowPreviewModal(false);
  };

  // ==================== HANDLER: Modal ข้อกำหนด ====================
  const handleShowModal = () => setShowModal(true); // เปิด modal แสดงข้อกำหนดการใช้งาน
  const handleCloseModal = () => setShowModal(false); // ปิด modal ข้อกำหนด

  // ==================== HANDLER: ย้อนกลับหน้าก่อนหน้า ====================
  const handleGoBack = () => {
    navigate(-1);  // ย้อนกลับไป 1 หน้า
  };

  // ==================== RENDER ====================
  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        {/* ==================== HEADER: แถบหัวเรื่อง ==================== */}
        <header className="upload-header">
          <button className="back-btn" onClick={handleGoBack}>
  <FiChevronLeft size={24} color="#ffffff" />
</button>
          <h1>สร้างเนื้อหา</h1>
          <div></div>
        </header>

        <main className="upload-main">
          <div className="content-card">
            {/* ==================== แสดงข้อมูลแพ็กเกจที่เลือก ==================== */}
            <div className="package-info">
              <div className="package-detail">
                <span className="label">ประเภท:</span>
                <span className="value">
                  {type === "image" ? "รูปภาพ + ข้อความ" :
                    type === "birthday" ? "🎂 อวยพรวันเกิด" : "ข้อความ"}
                </span>
              </div>
              <div className="package-detail">
                <span className="label">เวลาแสดง:</span>
                <span className="value">{time} วินาที</span>
              </div>
              <div className="package-detail">
                <span className="label">ราคา:</span>
                <span className="value price">{price === 0 ? 'ฟรี' : `฿${price}`}</span>
              </div>
            </div>

            {/* ==================== SECTION: อัปโหลดรูปภาพ (สำหรับ type: image/birthday) ==================== */}
            {(type === "image" || type === "birthday") && (
              <div className="upload-section">
                <h3>อัปโหลดรูปภาพ</h3>
                <div className="file-upload-container">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    id="file-upload"
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    {image ? (
                      <div className="file-selected">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span>เลือกไฟล์แล้ว: {image.name}</span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span>คลิกเพื่อเลือกรูปภาพ</span>
                        <small>รองรับ JPG, PNG, WebP • ขนาดไม่เกิน 5 MB</small>
                      </div>
                    )}
                  </label>
                </div>

                {image && (
                  <div className={`upload-preview-container layout-${textLayout}`}>
                    {/* รูปภาพ */}
                    <div className="upload-preview-image-box">
                      <img src={URL.createObjectURL(image)} alt="Preview" />
                    </div>

                    {/* Sidebar ข้อความ */}
                    <div className={`upload-preview-sidebar ${qrCodeFile ? 'has-qr' : ''}`}>
                      {/* Social + Text */}
                      <div className="upload-preview-content">
                        {/* Social */}
                        {socialOnImage && (
                          <div className="upload-social-display">
                            {socialOnImage}
                          </div>
                        )}

                        {/* Text */}
                        {text && (
                          <div
                            className="upload-text-display"
                            style={{ color: textColor }}
                          >
                            {text}
                          </div>
                        )}
                      </div>

                      {/* QR Code ด้านล่าง */}
                      {qrCodeFile && (
                        <div className="upload-qr-display">
                          <span className="upload-qr-label">สแกนเลย!</span>
                          <img
                            src={URL.createObjectURL(qrCodeFile)}
                            alt="QR Code"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QR Code Upload Section for IG */}
            {selectedSocial === "ig" && (type === "image" || type === "birthday") && (
              <div className="upload-section">
                <h3>QR Code Instagram (ไม่บังคับ)</h3>
                <div className="file-upload-container">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleQRCodeChange}
                    id="qrcode-upload"
                    className="file-input"
                  />
                  <label htmlFor="qrcode-upload" className="file-upload-label">
                    {qrCodeFile ? (
                      <div className="file-selected">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span>QR Code: {qrCodeFile.name}</span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span>คลิกเพื่อเลือก QR Code</span>
                        <small>ไม่บังคับ • รองรับ JPG, PNG, WebP • ขนาดไม่เกิน 2 MB</small>
                      </div>
                    )}
                  </label>
                </div>

                {qrCodeFile && (
                  <div className="qr-preview">
                    <img src={URL.createObjectURL(qrCodeFile)} alt="QR Code Preview" style={{
                      maxWidth: "300px",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      marginTop: "12px"
                    }} />
                  </div>
                )}
              </div>
            )}

            {/* Social Section */}
            <div className="social-section">
              <h3>ช่องทางโซเชียลของคุณ</h3>
              <p className="input-requirement">ไม่บังคับ • ชื่อช่องทางยาวได้ไม่เกิน 32 ตัวอักษร</p>
              <div className="social-radio-options">
                <label className={`social-radio ${selectedSocial === "ig" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="social"
                    value="ig"
                    checked={selectedSocial === "ig"}
                    onChange={() => { setSelectedSocial("ig"); setSocialName(""); }}
                  />
                  <span className="icon-label">
                    <img src={igLogo} alt="IG" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                    IG
                  </span>
                </label>
                <label className={`social-radio ${selectedSocial === "fb" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="social"
                    value="fb"
                    checked={selectedSocial === "fb"}
                    onChange={() => { setSelectedSocial("fb"); setSocialName(""); }}
                  />
                  <span className="icon-label">
                    <img src={fbLogo} alt="Facebook" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                    Facebook
                  </span>
                </label>
                <label className={`social-radio ${selectedSocial === "line" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="social"
                    value="line"
                    checked={selectedSocial === "line"}
                    onChange={() => { setSelectedSocial("line"); setSocialName(""); }}
                  />
                  <span className="icon-label">
                    <img src={lineLogo} alt="Line" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                    Line
                  </span>
                </label>
                <label className={`social-radio ${selectedSocial === "tiktok" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="social"
                    value="tiktok"
                    checked={selectedSocial === "tiktok"}
                    onChange={() => { setSelectedSocial("tiktok"); setSocialName(""); }}
                  />
                  <span className="icon-label">
                    <img src={tiktokLogo} alt="TikTok" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                    Tiktok
                  </span>
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  className="social-input"
                  placeholder={
                    selectedSocial === "ig" ? "ชื่อ IG" :
                      selectedSocial === "fb" ? "ชื่อ Facebook" :
                        selectedSocial === "line" ? "ชื่อ Line" :
                          selectedSocial === "tiktok" ? "ชื่อ Tiktok" : "ชื่อช่องทาง"
                  }
                  maxLength={32}
                  value={socialName}
                  onChange={e => setSocialName(e.target.value)}
                  disabled={!selectedSocial}
                />
              </div>
            </div>

            {/* แสดงข้อความ socialText ด้านบน textarea */}
            {socialText && (
              <div className="social-preview-text">
                {socialText}
              </div>
            )}

            <div className="text-section">
              <div className="text-section-header">
                <h3>ข้อความที่ต้องการแสดง</h3>
                <p className="input-requirement">ไม่บังคับ • ข้อความยาวได้ไม่เกิน 50 ตัวอักษร</p>
                <div className="caption-btn-group">
                  {/* ปุ่มสุ่มแคปชั่น */}
                  <button
                    className="random-caption-btn"
                    onClick={handleRandomCaption}
                    title="สุ่มแคปชั่น"
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                    </svg>
                    <span>สุ่ม</span>
                  </button>

                  {/* ปุ่มเลือกแคปชั่น */}
                  <button
                    className="pick-caption-btn"
                    onClick={() => setShowCaptionPicker(true)}
                    title="เลือกแคปชั่นจากรายการ"
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>เลือก</span>
                  </button>

                  {/* ปุ่ม AI Caption (เฉพาะ image/birthday) */}
                  {(type === "image" || type === "birthday") && (
                    <button
                      className={`ai-caption-btn ${isGeneratingCaption ? 'loading' : ''} ${captionCooldown > 0 ? 'cooldown' : ''}`}
                      onClick={handleGenerateCaption}
                      disabled={isGeneratingCaption || !image || captionCooldown > 0}
                      title={
                        captionCooldown > 0
                          ? `รอ ${captionCooldown} วินาที`
                          : !image
                            ? 'กรุณาเลือกรูปภาพก่อน'
                            : 'ให้ AI สร้างแคปชั่นจากรูปภาพ'
                      }
                    >
                      {isGeneratingCaption ? (
                        <>
                          <span className="ai-spinner"></span>
                          <span>กำลังคิด...</span>
                        </>
                      ) : captionCooldown > 0 ? (
                        <>
                          <svg className="ai-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span>รอ {captionCooldown}s</span>
                        </>
                      ) : (
                        <>
                          <svg className="ai-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          <span>AI Caption</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-input-container">
                <textarea
                  placeholder="พิมพ์ข้อความที่ต้องการแสดงบนหน้าจอ..."
                  value={text}
                  onChange={handleTextChange}
                  className="text-input"
                  maxLength={MAX_TEXT_LENGTH}
                />
                <div className="character-count">
                  <span className={text.length >= MAX_TEXT_LENGTH ? 'limit-reached' : ''}>
                    {text.length}/{MAX_TEXT_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            <div className="color-section">
              <h3>สีข้อความ</h3>
              <div className="color-picker-group">
                <div className="color-picker-item">
                  <label>สีชื่อ Social</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={socialColor}
                      onChange={(e) => setSocialColor(e.target.value)}
                      className="color-input"
                    />
                    <span className="color-hex">{socialColor}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>สีข้อความที่แสดง</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="color-input"
                    />
                    <span className="color-hex">{textColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selector - เฉพาะ image/birthday */}
            {(type === "image" || type === "birthday") && (
              <div className="template-section">
                <h3>เทมเพลตจัดวาง</h3>
                <div className="template-options">
                  {[
                    { value: "right", label: "ขวา", icon: "➡️" },
                    { value: "left", label: "ซ้าย", icon: "⬅️" },
                    { value: "top", label: "บน", icon: "⬆️" },
                    { value: "bottom", label: "ล่าง", icon: "⬇️" },
                    { value: "center", label: "กลาง", icon: "⏺️" },
                  ].map((tpl) => (
                    <button
                      key={tpl.value}
                      className={`template-btn ${textLayout === tpl.value ? 'active' : ''}`}
                      onClick={() => setTextLayout(tpl.value)}
                      type="button"
                    >
                      <span className="template-icon">{tpl.icon}</span>
                      <span className="template-label">{tpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {alertMessage && (
              <div className="alert-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {alertMessage}
              </div>
            )}

            <div className="action-buttons">
              <button className="secondary-btn" onClick={handleShowModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9,9h6a3,3,0,0,1,0,6H9" />
                  <path d="M9,15V9" />
                </svg>
                ข้อกำหนด
              </button>
              <button className="primary-btn" onClick={handleUpload}>
                ดำเนินการต่อ
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </main>

        {/* Modal ข้อกำหนด */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>ข้อกำหนดการใช้งาน</h3>
                <button className="close-button" onClick={handleCloseModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="restrictions-content">
                  <h4>🚫 เนื้อหาที่ห้ามใช้</h4>
                  <ul>
                    <li>การโฆษณาที่ละเมิดกฎหมาย (การพนัน, แอลกอฮอล์, ยาเสพติด)</li>
                    <li>เนื้อหาลามกอนาจารหรือไม่เหมาะสม</li>
                    <li>การดูถูกเหยียดหยามหรือสร้างความแตกแยก</li>
                    <li>การคุกคามหรือผิดกฎหมาย</li>
                    <li>QR Code หรือลิงก์ในรูปภาพ</li>
                  </ul>
                  <div className="warning-note">
                    ⚠️ หากพบเนื้อหาที่ไม่เหมาะสม ทางบริการขอสงวนสิทธิ์ในการปฏิเสธและไม่คืนเงิน
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal ยืนยัน */}
        {showPreviewModal && (
          <div className="modal-overlay" onClick={handleEdit}>
            <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>ยืนยันเนื้อหา</h3>
                <button className="close-button" onClick={handleEdit}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="preview-container">
                  {(type === "image" || type === "birthday") && image && (
                    <div className={`upload-preview-container modal-view layout-${textLayout}`}>
                      {/* รูปภาพ */}
                      <div className="upload-preview-image-box">
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Preview"
                        />
                      </div>

                      {/* Sidebar ข้อความ */}
                      <div className={`upload-preview-sidebar ${qrCodeFile ? 'has-qr' : ''}`}>
                        {/* Social + Text */}
                        <div className="upload-preview-content">
                          {/* Social */}
                          {socialOnImage && (
                            <div className="upload-social-display">
                              {socialOnImage}
                            </div>
                          )}

                          {/* Text */}
                          {text && (
                            <div
                              className="upload-text-display"
                              style={{ color: textColor }}
                            >
                              {text}
                            </div>
                          )}
                        </div>

                        {/* QR Code ด้านล่าง */}
                        {qrCodeFile && (
                          <div className="upload-qr-display">
                            <span className="upload-qr-label">สแกนเลย!</span>
                            <img
                              src={URL.createObjectURL(qrCodeFile)}
                              alt="QR Code"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {type === "text" && (
                    <div
                      style={{
                        background: "linear-gradient(135deg,#233046 60%,#1e293b 100%)",
                        borderRadius: "18px",
                        minHeight: "120px",
                        minWidth: "80%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        padding: "24px 0"
                      }}
                    >
                      {/* Social อยู่บนข้อความในกล่องเดียวกัน */}
                      {socialOnImage && (
                        <div
                          style={{
                            marginBottom: "16px",
                            marginTop: "8px",
                            color: socialColor,
                            padding: "6px 18px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "20px",
                            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                            maxWidth: "100%",
                            wordBreak: "break-all",
                            display: "inline-flex",
                            alignItems: "center",
                            boxShadow: "none"
                          }}
                        >
                          {socialOnImage}
                        </div>
                      )}
                      <div
                        style={{
                          color: textColor,
                          fontWeight: "400",
                          fontSize: "18px",
                          textShadow: textColor === "white"
                            ? "0 2px 8px rgba(0,0,0,0.8)"
                            : "0 2px 8px rgba(255,255,255,0.8)",
                          textAlign: "center",
                          wordBreak: "break-all"
                        }}
                      >
                        {text}
                      </div>
                    </div>
                  )}
                  <div className="preview-info">
                    <p><strong>แสดงเป็นเวลา:</strong> {time} วินาที</p>
                    <p><strong>ราคา:</strong> {price === 0 ? 'ฟรี' : `฿${price}`}</p>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="secondary-btn" onClick={handleEdit}>แก้ไข</button>
                <button className="primary-btn" onClick={handleAccept} disabled={isUploading} style={{ opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                  {isUploading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'uploadSpin 0.7s linear infinite',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                      }}></span>
                      กำลังดำเนินการ...
                      <style>{`@keyframes uploadSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </span>
                  ) : (
                    isFree ? "ยืนยันการอัพโหลด" : "ยืนยันและชำระเงิน"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL: เลือกแคปชั่นสำเร็จรูป ==================== */}
        {showCaptionPicker && (
          <div className="modal-overlay" onClick={() => setShowCaptionPicker(false)}>
            <div className="modal-content caption-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>เลือกข้อความ</h3>
                <button className="close-button" onClick={() => setShowCaptionPicker(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body caption-picker-body">
                {Object.entries(PRESET_CAPTIONS).map(([category, captions]) => (
                  <div key={category} className="caption-category">
                    <button
                      className={`caption-category-header ${openCategory === category ? 'open' : ''}`}
                      onClick={() => setOpenCategory(openCategory === category ? null : category)}
                    >
                      <span>{category}</span>
                      <svg
                        width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        className={`category-chevron ${openCategory === category ? 'rotate' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {openCategory === category && (
                      <div className="caption-list">
                        {captions.map((caption, index) => (
                          <div key={index} className="caption-item">
                            <span className="caption-text">{caption}</span>
                            <button
                              className="caption-select-btn"
                              onClick={() => handleSelectCaption(caption)}
                            >
                              เลือก
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
