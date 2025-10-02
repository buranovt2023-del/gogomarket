
const { Octokit } = require('@octokit/rest');
const logger = require('../utils/logger');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

async function getRecentCommits(limit = 10) {
  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: limit
    });
    
    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author.name,
      date: commit.commit.author.date
    }));
  } catch (error) {
    logger.error('Error fetching commits:', error);
    throw error;
  }
}

async function getBranches() {
  try {
    const { data } = await octokit.repos.listBranches({
      owner,
      repo
    });
    
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo
    });
    
    return data.map(branch => ({
      name: branch.name,
      isDefault: branch.name === repoData.default_branch,
      protected: branch.protected
    }));
  } catch (error) {
    logger.error('Error fetching branches:', error);
    throw error;
  }
}

async function compareVersions(base, head) {
  try {
    const { data } = await octokit.repos.compareCommits({
      owner,
      repo,
      base,
      head
    });
    
    return {
      commits: data.total_commits,
      filesChanged: data.files.length,
      additions: data.files.reduce((sum, file) => sum + file.additions, 0),
      deletions: data.files.reduce((sum, file) => sum + file.deletions, 0),
      recentCommits: data.commits.slice(0, 5).map(c => ({
        message: c.commit.message.split('\n')[0],
        author: c.commit.author.name
      }))
    };
  } catch (error) {
    logger.error('Error comparing versions:', error);
    throw error;
  }
}

async function getCIStatus() {
  try {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 1
    });
    
    if (data.workflow_runs.length === 0) {
      return { status: 'No runs found' };
    }
    
    const run = data.workflow_runs[0];
    
    // Get jobs for this run
    const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: run.id
    });
    
    const duration = run.updated_at && run.created_at
      ? Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000) + 's'
      : 'N/A';
    
    return {
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      startedAt: run.created_at,
      duration,
      jobs: jobsData.jobs.map(job => ({
        name: job.name,
        status: job.status,
        conclusion: job.conclusion
      }))
    };
  } catch (error) {
    logger.error('Error fetching CI status:', error);
    throw error;
  }
}

async function triggerWorkflow(workflowId, ref = 'main', inputs = {}) {
  try {
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs
    });
    
    logger.info(`Triggered workflow ${workflowId} on ${ref}`);
    return { success: true };
  } catch (error) {
    logger.error('Error triggering workflow:', error);
    throw error;
  }
}

module.exports = {
  getRecentCommits,
  getBranches,
  compareVersions,
  getCIStatus,
  triggerWorkflow
};
