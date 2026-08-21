import React from "react";
import "./AppLoadingScreen.css";

function AppLoadingScreen({ error = "", onRetry }) {
  const hasError = Boolean(error);

  return (
    <main className="app-loading-screen">
      <section
        className={`app-loading-card${hasError ? " app-loading-card--error" : ""}`}
        role={hasError ? "alert" : "status"}
        aria-live={hasError ? "assertive" : "polite"}
        aria-busy={!hasError}
      >
        {hasError ? (
          <>
            <div className="app-loading-error-mark" aria-hidden="true">!</div>
            <h1>โหลดข้อมูลร้านไม่สำเร็จ</h1>
            <p>{error}</p>
            <button type="button" onClick={onRetry}>ลองใหม่</button>
          </>
        ) : (
          <>
            <div className="app-loading-spinner" aria-hidden="true" />
            <h1>กำลังโหลดข้อมูลร้าน…</h1>
            <p>กรุณารอสักครู่</p>
          </>
        )}
      </section>
    </main>
  );
}

export default AppLoadingScreen;
