import { LinearClient } from '@linear/sdk';

export default {
  name: 'linear',
  interval: 30_000,

  async fetch(config) {
    const client = new LinearClient({ apiKey: config.linear_api_key });
    const { data } = await client.client.rawRequest(`
      query {
        issues(filter: { state: { type: { nin: ["cancelled"] } } }, first: 100) {
          nodes {
            id
            title
            identifier
            dueDate
            state { name type }
            project { id name color }
          }
        }
      }
    `);

    const projectMap = new Map();

    for (const issue of data.issues.nodes) {
      const proj = issue.project;
      const key = proj ? proj.id : '__none__';

      if (!projectMap.has(key)) {
        projectMap.set(key, {
          id: key,
          name: proj ? proj.name : 'General',
          color: proj ? proj.color : '#8a8a9a',
          totalIssues: 0,
          completedIssues: 0,
          openIssues: [],
        });
      }

      const p = projectMap.get(key);
      p.totalIssues++;

      if (issue.state.type === 'completed') {
        p.completedIssues++;
      } else {
        p.openIssues.push({
          id: issue.id,
          title: issue.title,
          identifier: issue.identifier,
          dueDate: issue.dueDate ?? null,
          stateName: issue.state.name,
          stateType: issue.state.type,
        });
      }
    }

    const projects = [...projectMap.values()]
      .sort((a, b) => b.openIssues.length - a.openIssues.length)
      .slice(0, 4);

    return { projects, lastUpdated: new Date().toISOString() };
  },
};
