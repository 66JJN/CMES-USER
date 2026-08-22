import {
  adoptVerifiedLegacyOrders,
  appendShopOrder,
  getShopStorageKey,
  readShopOrders,
  readShopJson,
  removeShopOrder,
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

  test("filters records whose embedded shop does not match the storage shop", () => {
    window.localStorage.setItem("user", JSON.stringify({ id: "user-1" }));
    writeShopJson(
      "orders",
      [
        { orderId: "mellow-1", shopId: "Mellow01" },
        { orderId: "jj-1", shopId: "JJ" },
        { orderId: "legacy" },
      ],
      "Mellow01",
    );

    expect(readShopOrders("Mellow01")).toEqual([
      { orderId: "mellow-1", shopId: "Mellow01" },
    ]);
  });

  test("append and remove only mutate the current shop order list", () => {
    window.localStorage.setItem("user", JSON.stringify({ id: "user-1" }));
    appendShopOrder("JJ", { orderId: "jj-1", type: "image" });
    appendShopOrder("Mellow01", { orderId: "mellow-1", type: "gift" });

    removeShopOrder("Mellow01", "mellow-1");

    expect(readShopOrders("Mellow01")).toEqual([]);
    expect(readShopOrders("JJ")).toEqual([
      { orderId: "jj-1", type: "image", shopId: "JJ" },
    ]);
  });

  test("adopts only legacy orders verified by the current shop", () => {
    window.localStorage.setItem("user", JSON.stringify({ id: "user-1" }));
    window.localStorage.setItem(
      "orders",
      JSON.stringify([
        { orderId: "jj-verified", type: "image" },
        { orderId: "another-shop", type: "gift" },
      ]),
    );

    adoptVerifiedLegacyOrders("JJ", new Set(["jj-verified"]));

    expect(readShopOrders("JJ")).toEqual([
      { orderId: "jj-verified", type: "image", shopId: "JJ" },
    ]);
    expect(JSON.parse(window.localStorage.getItem("orders"))).toHaveLength(2);
  });
});
