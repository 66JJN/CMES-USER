import {
  getShopStorageKey,
  readShopJson,
  writeShopJson,
} from "./shopStorage";

describe("shop-scoped browser storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("keeps orders from two shops separate for the same user", () => {
    window.localStorage.setItem("user", JSON.stringify({ id: "user-1" }));

    writeShopJson("orders", [{ orderId: "jj-1", shopId: "JJ" }], "JJ");

    expect(readShopJson("orders", [], "Mellow01")).toEqual([]);
    expect(readShopJson("orders", [], "JJ")).toEqual([
      { orderId: "jj-1", shopId: "JJ" },
    ]);
  });

  test("keeps orders from two users in the same shop separate", () => {
    expect(getShopStorageKey("orders", "JJ", "user-1")).not.toBe(
      getShopStorageKey("orders", "JJ", "user-2"),
    );
  });

  test("does not delete or adopt an ambiguous legacy value", () => {
    window.localStorage.setItem(
      "orders",
      JSON.stringify([{ orderId: "legacy-order" }]),
    );

    expect(readShopJson("orders", [], "Mellow01")).toEqual([]);
    expect(window.localStorage.getItem("orders")).not.toBeNull();
  });
});
