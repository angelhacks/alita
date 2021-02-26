import { base } from "../utils/airtable";

const run = async () => {
  try {
    let unLinked = await base("Team Mixer")
      .select({ filterByFormula: `AND({People}="", NOT({Link}=""))` })
      .all();
    console.log(unLinked.map((v) => v.get("Name")));
    await Promise.all(
      unLinked.map(async (record) => {
        await base("Team Mixer")
          .update(record.id, {
            People: [record.get("Link")],
          })
          .catch(console.log);
      })
    );
  } catch (e) {
    console.log;
  }
};

run().catch(console.log);
