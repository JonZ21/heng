import { LinearClient } from '@linear/sdk';

export default {
  name: 'linear',
  interval: 30_000,

  async fetch(config) {
    const client = new LinearClient({ apiKey: config.linear_api_key });
    const viewer = await client.viewer;
    const result = await viewer.assignedIssues({
      filter: {
        state: { type: { in: ['started', 'unstarted', 'backlog'] } },
        completedAt: { null: true },
      },
    });

    const today = new Date().toISOString().split('T')[0];
    const inProgress = [];
    const upcoming = [];
    const overdue = [];

    for (const issue of result.nodes) {
      const isOverdue = issue.dueDate && issue.dueDate < today;
      if (issue.state.type === 'started') {
        inProgress.push(formatIssue(issue));
      } else if (isOverdue) {
        overdue.push(formatIssue(issue));
      } else {
        upcoming.push(formatIssue(issue));
      }
    }

    return { inProgress, upcoming, overdue, lastUpdated: new Date().toISOString() };
  },
};

function formatIssue(issue) {
  return {
    id: issue.id,
    title: issue.title,
    identifier: issue.identifier,
    dueDate: issue.dueDate ?? null,
    stateName: issue.state.name,
    stateType: issue.state.type,
  };
}
