import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("UTC");

export const toUTC = (date) => {
  return dayjs(date).utc().toDate();
};

export const formatISO = (date) => {
  return dayjs(date).utc().toISOString();
};

export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

export default dayjs;
