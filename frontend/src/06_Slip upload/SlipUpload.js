import React, { useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config/apiConfig";
import { showToast } from "../authService";

/**
 * Component สำหรับอัปโหลดและตรวจสอบสลิปการชำระเงิน
 *
 * Props:
 * - price: ราคาที่ต้องชำระ (ใช้สำหรับตรวจสอบจำนวนเงินในสลิป)
 * - onSuccess: Callback function ที่จะถูกเรียกเมื่อการชำระเงินสำเร็จ
 */
function SlipUpload({ price, onSuccess }) {
  const [slipFile, setSlipFile] = useState(null);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  // null | "pending" | "success" | "failed"
  const [paymentStatus, setPaymentStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleSlipChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSlipFile(e.target.files[0]);
    }
  };

  const handleUploadSlipAndVerify = async () => {
    if (!slipFile) {
      showToast("กรุณาเลือกไฟล์สลิปก่อน", "error");
      return;
    }

    setIsVerifyingSlip(true);
    setPaymentStatus("pending");

    const formData = new FormData();
    formData.append("slip", slipFile);
    formData.append("amount", price);

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-slip`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setPaymentStatus("success");
        console.log("[SlipUpload] verification success, calling onSuccess");
        onSuccess && onSuccess();
      } else {
        setPaymentStatus("failed");
        showToast(response.data.message || "สลิปไม่ถูกต้องหรือจำนวนเงินไม่ตรง", "error");
      }
    } catch (error) {
      setPaymentStatus("failed");
      showToast("เกิดข้อผิดพลาดในการตรวจสอบสลิป", "error");
    }

    setIsVerifyingSlip(false);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ marginTop: '20px', width: '100%' }}>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleSlipChange}
        disabled={isVerifyingSlip || paymentStatus === "success"}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      {/* Upload area & confirm button — hidden once payment succeeds */}
      {paymentStatus !== "success" && (
        <>
          {/* Upload Drop Zone */}
          <div
            onClick={(!isVerifyingSlip && paymentStatus !== "success") ? triggerFileInput : undefined}
            style={{
              border: `2px dashed ${slipFile ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '12px',
              padding: '24px',
              backgroundColor: slipFile ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
              cursor: isVerifyingSlip ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              minHeight: '120px'
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: slipFile ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: slipFile ? '#10b981' : 'rgba(255,255,255,0.5)'
            }}>
              {slipFile ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '15px', color: slipFile ? '#10b981' : 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: '4px' }}>
                {slipFile ? "เลือกสลิปเรียบร้อย" : "แตะเพื่ออัปโหลดสลิป"}
              </span>
              <span style={{ display: 'block', fontSize: '13px', color: slipFile ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.4)' }}>
                {slipFile ? slipFile.name : "รองรับไฟล์ภาพ JPG, PNG"}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleUploadSlipAndVerify}
            disabled={!slipFile || isVerifyingSlip}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: (!slipFile || isVerifyingSlip)
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: (!slipFile || isVerifyingSlip) ? 'rgba(255,255,255,0.3)' : '#fff',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: (!slipFile || isVerifyingSlip) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
          >
            {isVerifyingSlip ? (
              <>
                <span className="slip-spinner"></span>
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                ยืนยันการชำระเงิน
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Failed status - show below button */}
          {paymentStatus === "failed" && (
            <div style={{
              marginTop: '12px', padding: '12px', borderRadius: '10px',
              fontSize: '0.85rem', textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              การชำระเงินล้มเหลว หรือสลิปไม่ถูกต้อง กรุณาลองใหม่
            </div>
          )}
        </>
      )}

      {/* Success State - replaces upload area entirely */}
      {paymentStatus === "success" && (
        <div style={{
          marginTop: '8px', padding: '24px 20px',
          borderRadius: '14px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '12px', textAlign: 'center'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
              การชำระเงินสำเร็จ!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
              กำลังดำเนินการ กรุณารอสักครู่...
            </div>
          </div>
        </div>
      )}

      <style>{`
        .slip-spinner {
          display: inline-block;
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: slipSpin 0.7s linear infinite;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        @keyframes slipSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SlipUpload;
