/* eslint-disable camelcase */

// node modules
import { inspect } from 'util'

// packages
import core from '@actions/core'
import github from '@actions/github'

export default async function ({ octokit, workflow_id, run_id, before, jobName }) {
  // get current run of this workflow
  const { data: { workflow_runs } } = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
    ...github.context.repo,
    workflow_id
  })

  // find any instances of the same workflow
  const active_runs = workflow_runs
    // limit to currently running ones
    .filter(run => ['in_progress', 'queued', 'waiting', 'pending', 'action_required', 'requested'].includes(run.status))
    // exclude this one
    .filter(run => run.id !== run_id)
    // get older runs
    .filter(run => new Date(run.run_started_at) < before)

  core.info(`found ${active_runs.length} active workflow runs`)

  // If no job name specified, return all active runs (existing behavior)
  if (!jobName) {
    core.debug(inspect(active_runs.map(run => ({ id: run.id, name: run.name }))))
    return active_runs
  }

  // Job-level filtering: check each active run for the specific job
  const runs_with_target_job = []
  
  for (const run of active_runs) {
    try {
      // Get jobs for this workflow run
      const { data: { jobs } } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs', {
        ...github.context.repo,
        run_id: run.id
      })

      // Check if this run has the target job currently running
      const target_job = jobs.find(job => 
        job.name === jobName && 
        ['in_progress', 'queued', 'waiting', 'pending', 'action_required', 'requested'].includes(job.status)
      )

      if (target_job) {
        core.info(`found job "${jobName}" (status: ${target_job.status}) in run #${run.id}`)
        runs_with_target_job.push(run)
      }
    } catch (error) {
      // Log error but continue checking other runs
      core.warning(`failed to fetch jobs for run #${run.id}: ${error.message}`)
    }
  }

  core.debug(inspect(runs_with_target_job.map(run => ({ id: run.id, name: run.name }))))
  return runs_with_target_job
}
