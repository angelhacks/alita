import Record from "airtable/lib/record";
import { base } from "../utils/airtable";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

var teams = [];

class Member {
  id: string;
  name: string;
  recordID: string;
  record: Record;
  requested = Array<Member>();
  bidirectional = Array<Member>();
  requestUnformated: Array<Record>;
  constructor(id, name, record, requestUnformatted) {
    this.id = id;
    this.name = name;
    this.recordID = record.id;
    this.record = record;
    this.requestUnformated = requestUnformatted;
  }
  getPartners() {
    let bidirectional: Array<Member> = [this];
    if (!this.requested) {
      return bidirectional;
    }
    this.requested.forEach((member) => {
      if (member?.requested?.includes(this)) {
        bidirectional.push(member);
      }
    });
    return bidirectional;
  }
}

const runMixer = async () => {
  let teamMixer = await base("Team Mixer")
    .select({ filterByFormula: `Mixer=""` })
    .all();
  let peopleTable = await base("People")
    .select({ filterByFormula: `NOT({Team Mixer}="")` })
    .all();
  let peopleTableSearch = {};
  let mixerSearch = { "not-there": "not-there" };
  let people: { prop: Member } = <{ prop: Member }>{};
  peopleTable.forEach((record) => {
    peopleTableSearch[record.id] = record;
  });
  teamMixer.forEach((record) => {
    mixerSearch[record.id] = record;
  });

  teamMixer.forEach(
    (v) =>
      (people[v.id] = new Member(
        v.id,
        v.get("Name"),
        v,
        v
          .get("Teammates")
          ?.map(
            (v) =>
              mixerSearch[
                peopleTableSearch[v]
                  ? peopleTableSearch[v].get("Team Mixer")[0]
                  : null
              ]
          )
      ))
  );
  //console.log(peopleTable);
  let todo = [];
  Object.values(people).forEach((member) => {
    member.requested = member.requestUnformated?.map((record) => {
      if (!record) {
        return null;
      }
      if (!people[record.id] && record) {
        people[record.id] = new Member(
          record.id,
          record.get("Name"),
          record,
          record
            .get("Teammates")
            ?.map(
              (v) =>
                mixerSearch[
                  peopleTableSearch[v]
                    ? peopleTableSearch[v].get("Team Mixer")[0]
                    : "not-there"
                ]
            )
        );
        todo.push(people[record.id]);
      }
      return record ? people[record.id] : null;
    });
  });

  todo.forEach((member) => {
    member.requested = member.requestUnformated.map((record) => {
      return record ? people[record.id] : null;
    });
  });
  let unformattedTeams = [];
  Object.values(people).forEach((member) => {
    let team = member
      .getPartners()
      ?.map((v) => v.id)
      .sort();
    if (team) {
      unformattedTeams.push(team);
    }
  });
  unformattedTeams.forEach((team) => {
    if (
      team &&
      unformattedTeams.filter((v) => JSON.stringify(v) == JSON.stringify(team))
        .length == team.length
    ) {
      teams.push(team);
    }
  });

  teams = teams.filter((v) => v);
  teams = [...new Set(teams.map((v) => JSON.stringify(v)))].map((v) =>
    JSON.parse(v)
  );
  teams.forEach((v) => {
    base("Teams")
      .create([
        {
          fields: {
            Name: uniqueNamesGenerator({
              dictionaries: [colors, adjectives, animals],
              separator: " ",
              style: "capital",
            }),
            Members: v,
          },
        },
      ])
      .catch(console.log);
  });
};

runMixer().catch(console.log);
