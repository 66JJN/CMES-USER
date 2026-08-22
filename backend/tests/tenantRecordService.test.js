import test from "node:test";
import assert from "node:assert/strict";

import {
  findGiftForShop,
  getPendingUploadForShop,
  requireShopIdValue,
} from "../services/tenantRecordService.js";
import { createUpstreamError } from "../services/adminService.js";

test("gift lookup includes the current shop and order id", async () => {
  let receivedQuery;

  const result = await findGiftForShop(
    { shopId: "Mellow01", orderId: "gift-1" },
    {
      findOne: async (query) => {
        receivedQuery = query;
        return { orderId: "gift-1", shopId: "Mellow01" };
      },
    },
  );

  assert.deepEqual(receivedQuery, { orderId: "gift-1", shopId: "Mellow01" });
  assert.equal(result.shopId, "Mellow01");
});

test("pending upload from another shop is hidden", () => {
  const pendingUploads = new Map([
    ["upload-1", { id: "upload-1", shopId: "JJ" }],
  ]);

  assert.equal(
    getPendingUploadForShop({
      shopId: "Mellow01",
      uploadId: "upload-1",
      pendingUploads,
    }),
    null,
  );
});

test("pending upload from the same shop is returned", () => {
  const pendingUpload = { id: "upload-1", shopId: "JJ" };
  const pendingUploads = new Map([["upload-1", pendingUpload]]);

  assert.equal(
    getPendingUploadForShop({ shopId: "JJ", uploadId: "upload-1", pendingUploads }),
    pendingUpload,
  );
});

test("invalid shop ids are rejected before a lookup", () => {
  assert.throws(
    () => requireShopIdValue("../../JJ"),
    (error) => error.status === 400 && /shopId/.test(error.message),
  );
});

test("an Admin 404 stays a 404 instead of becoming a generic server error", () => {
  const error = createUpstreamError("order status", 404);

  assert.equal(error.status, 404);
  assert.equal(error.statusCode, 404);
  assert.match(error.message, /404/);
});
