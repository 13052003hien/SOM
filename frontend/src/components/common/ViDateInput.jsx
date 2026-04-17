import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

function buildDate(year, month, day = 1) {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function parseDateValue(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  return buildDate(year, month, day);
}

function parseMonthValue(value) {
  if (!value) return null;
  const [year, month] = String(value).split("-").map(Number);
  return buildDate(year, month, 1);
}

function toDateValue(date) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

function toMonthValue(date) {
  if (!date) return "";
  return format(date, "yyyy-MM");
}

export function ViDateInput({
  value,
  onChange,
  mode = "date",
  placeholder,
  required,
  className,
  name,
  id
}) {
  const isMonthMode = mode === "month";
  const selected = isMonthMode ? parseMonthValue(value) : parseDateValue(value);

  return (
    <DatePicker
      id={id}
      name={name}
      selected={selected}
      onChange={(date) => {
        if (!date) {
          onChange("");
          return;
        }

        onChange(isMonthMode ? toMonthValue(date) : toDateValue(date));
      }}
      locale={vi}
      dateFormat={isMonthMode ? "MM/yyyy" : "dd/MM/yyyy"}
      placeholderText={placeholder || (isMonthMode ? "MM/YYYY" : "DD/MM/YYYY")}
      showMonthYearPicker={isMonthMode}
      className={className}
      required={required}
      autoComplete="off"
      todayButton={isMonthMode ? undefined : "Hôm nay"}
      isClearable={false}
    />
  );
}
