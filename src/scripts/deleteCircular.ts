import Record from "airtable/lib/record";
import { base } from "../utils/airtable";

const run = async () => {
  let circles = await base("Team Mixer")
    .select({ filterByFormula: "NOT({Teammates}='')" })
    .all();
  circles = circles.filter((record) => {
    if (record.get("Teammates").includes(record.get("People")[0])) {
      return true;
    }
    return false;
  });
  circles.forEach((record) => {
    record
      .get("Teammates")
      .splice(record.get("Teammates").indexOf(record.get("People")[0]), 1);
    base("Team Mixer").update(record.id, {
      Teammates: record.get("Teammates"),
    });
  });
};
run();
