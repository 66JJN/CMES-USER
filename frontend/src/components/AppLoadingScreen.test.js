import { render, screen } from "@testing-library/react";
import AppLoadingScreen from "./AppLoadingScreen";

describe("AppLoadingScreen", () => {
  test("อธิบายชัดเจนว่ากำลังโหลดข้อมูลร้านโดยไม่แสดงชื่อหรือไอคอนสมมติ", () => {
    render(<AppLoadingScreen />);

    expect(screen.getByRole("status")).toHaveTextContent("กำลังโหลดข้อมูลร้าน");
    expect(screen.getByText("กรุณารอสักครู่")).toBeInTheDocument();
    expect(screen.queryByText("Digital Signage CMES")).not.toBeInTheDocument();
    expect(screen.queryByTestId("display-icon")).not.toBeInTheDocument();
  });

  test("แสดงสาเหตุและปุ่มลองใหม่เมื่อโหลดไม่สำเร็จ", () => {
    const retry = jest.fn();
    render(<AppLoadingScreen error="เชื่อมต่อข้อมูลร้านไม่สำเร็จ" onRetry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("เชื่อมต่อข้อมูลร้านไม่สำเร็จ");
    screen.getByRole("button", { name: "ลองใหม่" }).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
