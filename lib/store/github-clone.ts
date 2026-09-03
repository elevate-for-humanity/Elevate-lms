import { Octokit } from '@octokit/rest';

/**
 * Clone a repository for a customer
 */
export async function cloneRepoForCustomer({
  sourceRepo,
  targetOwner,
  targetRepo,
  githubToken,
}: {
  sourceRepo: string;
  targetOwner: string;
  targetRepo: string;
  githubToken: string;
}): Promise<{ success: boolean; repoUrl?: string; cloneUrl?: string; error?: string }> {
  const octokit = new Octokit({ auth: githubToken });

  const [sourceOwner, sourceName] = sourceRepo.split('/');

  // Create a fork or template repository
  try {
    const { data } = await octokit.repos.createUsingTemplate({
      template_owner: sourceOwner,
      template_repo: sourceName,
      owner: targetOwner,
      name: targetRepo,
      description: 'Cloned from Elevate For Humanity',
      private: true,
    });

    return {
      success: true,
      repoUrl: data.html_url,
      cloneUrl: data.clone_url,
    };
  } catch (templateError) {
    // Fallback: create fork if template doesn't work
    try {
      const { data } = await octokit.repos.createFork({
        owner: sourceOwner,
        repo: sourceName,
      });

      // Rename the fork
      await octokit.repos.update({
        owner: targetOwner,
        repo: data.name,
        name: targetRepo,
      });

      return {
        success: true,
        repoUrl: data.html_url,
        cloneUrl: data.clone_url,
      };
    } catch (forkError) {
      return {
        success: false,
        error: forkError instanceof Error ? forkError.message : String(forkError),
      };
    }
  }
}

/**
 * Grant repository access to a user
 */
export async function grantRepoAccess({
  owner,
  repo,
  username,
  githubToken,
}: {
  owner: string;
  repo: string;
  username: string;
  githubToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const octokit = new Octokit({ auth: githubToken });

  try {
    await octokit.repos.addCollaborator({
      owner,
      repo,
      username,
      permission: 'push',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}
