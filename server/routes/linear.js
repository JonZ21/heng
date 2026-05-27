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
      const { data } = await client.client.rawRequest(`
        query IssueTeamStates($id: String!) {
          issue(id: $id) {
            team {
              states { nodes { id type } }
            }
          }
        }
      `, { id: req.params.issueId });
    
      const doneState = data.issue.team.states.nodes.find(s => s.type === 'completed');
      if (!doneState) {
        return res.status(422).json({ error: 'No completed state found for team' });
      }
    
      await client.client.rawRequest(`
        mutation IssueUpdate($id: String!, $stateId: String!) {
          issueUpdate(id: $id, input: { stateId: $stateId }) {
            success
          }
        }
      `, { id: req.params.issueId, stateId: doneState.id });
    
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    
    });

  return router;
}
