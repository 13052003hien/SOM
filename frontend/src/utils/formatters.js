/**
 * Format tiền tệ sang VND (Việt Nam Đồng)
 * @param {number} amount - số tiền
 * @param {boolean} showSymbol - hiển thị ký hiệu đ hay không (mặc định: true)
 * @returns {string} - chuỗi đã định dạng
 * @example
 * formatVND(1000000) => "1.000.000 đ"
 * formatVND(1000000, false) => "1.000.000"
 */
export function formatVND(amount, showSymbol = true) {
  if (amount === null || amount === undefined) {
    return "0 đ";
  }

  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (!showSymbol) {
    return formatted.replace(/\s?₫\s?$/g, "").trim();
  }

  return formatted;
}

/**
 * Parse chuỗi VND thành number
 * @param {string} vndString - chuỗi VND
 * @returns {number} - số tiền
 * @example
 * parseVND("1.000.000 đ") => 1000000
 */
export function parseVND(vndString) {
  if (!vndString) return 0;
  return parseInt(vndString.replace(/\D/g, ""), 10) || 0;
}

/**
 * Format ngày tháng theo định dạng Việt
 * @param {string|Date} date - ngày tháng
 * @param {string} format - định dạng (default: "dd/MM/yyyy HH:mm")
 * @returns {string} - chuỗi đã định dạng
 */
export function formatDate(date, format = "dd/MM/yyyy") {
  if (!date) return "";
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  let result = format;
  result = result.replace("dd", day);
  result = result.replace("MM", month);
  result = result.replace("yyyy", year);
  result = result.replace("HH", hours);
  result = result.replace("mm", minutes);

  return result;
}
