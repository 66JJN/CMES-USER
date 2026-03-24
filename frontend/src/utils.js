export const incrementQueueNumber = () => {
  let currentQueueNumber = parseInt(localStorage.getItem("queueNumber") || "0", 10);
  if (!isNaN(currentQueueNumber)) {
    currentQueueNumber += 1; // เพิ่มค่าเพียงครั้งเดียว
  } else {
    currentQueueNumber = 1; // เริ่มต้นที่ 1 หากยังไม่มีค่า
  }
  localStorage.setItem("queueNumber", currentQueueNumber);
  return currentQueueNumber;
};