import Airtable from "airtable";

const exportBase = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
  "app1lOaOX1W7GCYtT"
);

export const base = exportBase;
