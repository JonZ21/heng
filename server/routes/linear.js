import { Router } from 'express';
import { LinearClient } from '@linear/sdk';

export default function linearRouter(db) {
  const router = Router();

  router.post('/complete/:issueId', async (req, res) => {
    const apiKey = process.env.LINEAR_API_KEY ||
      db.prepare("SELECT value FROM integrations_config WHERE key = 'linear_api_key'").get()?.value;

    if (!apiKey) {
      return res.status(500).json({ error: 'Linear API key not configured' });
    }

    try {
      const client = new LinearClient({ apiKey });
      const issue = await client.issue(req.params.issueId);
      const team = await issue.team;
      const statesConn = await team.states();
      const doneState = statesConn.nodes.find(s => s.type === 'completed');

      if (!doneState) {
        return res.status(422).json({ error: 'No completed state found for team' });
      }

      await client.issueUpdate(req.params.issueId, { stateId: doneState.id });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
