import {
  bootstrapApplication,
  clearShopProfileCache,
  getCachedShopProfile,
  loadShopProfile,
} from "./appBootstrap";

afterEach(() => {
  clearShopProfileCache();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("bootstrapApplication", () => {
  test("เริ่มโหลดข้อมูลร้านพร้อมกับตรวจสอบผู้ใช้", async () => {
    let finishAuth;
    let finishShop;
    const initializeAuth = jest.fn(() => new Promise((resolve) => { finishAuth = resolve; }));
    const loadShopProfile = jest.fn(() => new Promise((resolve) => { finishShop = resolve; }));

    const result = bootstrapApplication({
      shopId: "JJ",
      initializeAuth,
      loadShopProfile,
      timeoutMs: 1000,
    });

    expect(initializeAuth).toHaveBeenCalledTimes(1);
    expect(loadShopProfile).toHaveBeenCalledWith("JJ");

    finishShop({ name: "JJ" });
    finishAuth(null);
    await expect(result).resolves.toEqual({ name: "JJ" });
  });

  test("ปฏิเสธทันทีเมื่อไม่มีรหัสร้าน", async () => {
    await expect(bootstrapApplication({
      shopId: "",
      initializeAuth: jest.fn(),
      loadShopProfile: jest.fn(),
      timeoutMs: 1000,
    })).rejects.toThrow("ไม่พบรหัสร้าน");
  });

  test("หยุดรอและแจ้งให้ลองใหม่เมื่อใช้เวลานานเกินกำหนด", async () => {
    jest.useFakeTimers();
    const result = bootstrapApplication({
      shopId: "JJ",
      initializeAuth: () => new Promise(() => {}),
      loadShopProfile: () => new Promise(() => {}),
      timeoutMs: 8000,
    });

    jest.advanceTimersByTime(8000);
    await expect(result).rejects.toThrow("ใช้เวลานานเกินไป");
  });

  test("โหลดและเก็บชื่อร้านจริงโดยไม่สร้างชื่อร้านสำรอง", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, shop: { name: "ร้าน JJ", logo: "logo.jpg" } }),
    });

    await expect(loadShopProfile("JJ")).resolves.toEqual({
      name: "ร้าน JJ",
      logo: "logo.jpg",
    });
    expect(getCachedShopProfile("JJ")).toEqual({ name: "ร้าน JJ", logo: "logo.jpg" });

    await loadShopProfile("JJ");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("แจ้งข้อผิดพลาดเมื่อ API ไม่คืนชื่อร้าน", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, shop: { name: "" } }),
    });

    await expect(loadShopProfile("JJ")).rejects.toThrow("ไม่พบข้อมูลชื่อร้าน");
    expect(getCachedShopProfile("JJ")).toBeNull();
  });
});
