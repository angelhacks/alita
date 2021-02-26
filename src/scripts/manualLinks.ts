import { base } from "../utils/airtable";

const run = async () => {
  let unLinked = await base("Team Mixer")
    .select({ filterByFormula: `AND({People}="", NOT({Link}=""))` })
    .all();
  unLinked.forEach(async (record) => {
    await base("Team Mixer").update(record.id, {
      People: [record.get("Link")],
    });
  });
};

run().catch(console.log);
