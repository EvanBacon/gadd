// From create-next-app
import chalk from 'chalk';
import got from 'got';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

// @ts-ignore
const pipeline = promisify(Stream.pipeline);

type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

async function isUrlOk(url: string): Promise<boolean> {
  const res = await got(url).catch(e => e);
  return res.statusCode === 200;
}

async function getRepoInfo(url: any, examplePath?: string): Promise<RepoInfo | undefined> {
  const [, username, name, t, _branch, ...file] = url.pathname.split('/');
  const filePath = examplePath ? examplePath.replace(/^\//, '') : file.join('/');

  // Support repos whose entire purpose is to be an example, e.g.
  // https://github.com/:username/:my-cool-example-repo-name.
  if (t === undefined) {
    const infoResponse = await got(`https://api.github.com/repos/${username}/${name}`).catch(
      e => e
    );
    if (infoResponse.statusCode !== 200) {
      return;
    }
    const info = JSON.parse(infoResponse.body);
    return { username, name, branch: info['default_branch'], filePath };
  }

  // If examplePath is available, the branch name takes the entire path
  const branch = examplePath
    ? `${_branch}/${file.join('/')}`.replace(new RegExp(`/${filePath}|/$`), '')
    : _branch;

  if (username && name && branch && t === 'tree') {
    return { username, name, branch, filePath };
  }
  return undefined;
}

function hasRepo({ username, name, branch, filePath }: RepoInfo) {
  const contentsUrl = `https://api.github.com/repos/${username}/${name}/contents`;
  const packagePath = `${filePath ? `/${filePath}` : ''}/package.json`;

  return isUrlOk(contentsUrl + packagePath + `?ref=${branch}`);
}

export async function resolvePackageArgAsync(
  projectRoot: string,
  oraInstance: any,
  remoteUrl: string,
  remotePath?: string
): Promise<boolean> {
  let repoInfo: RepoInfo | undefined;

  if (remoteUrl) {
    // @ts-ignore
    let repoUrl: URL | undefined;

    try {
      // @ts-ignore
      repoUrl = new URL(remoteUrl);
    } catch (error) {
      if (error.code !== 'ERR_INVALID_URL') {
        oraInstance.fail(error);
        process.exit(1);
      }
    }

    if (repoUrl) {
      if (repoUrl.origin !== 'https://github.com') {
        oraInstance.fail(
          `Invalid URL: ${chalk.red(
            `"${remoteUrl}"`
          )}. Only GitHub repositories are supported. Please use a GitHub URL and try again.`
        );
        process.exit(1);
      }

      repoInfo = await getRepoInfo(repoUrl, remotePath);

      if (!repoInfo) {
        oraInstance.fail(
          `Found invalid GitHub URL: ${chalk.red(
            `"${remoteUrl}"`
          )}. Please fix the URL and try again.`
        );
        process.exit(1);
      }

      const found = await hasRepo(repoInfo);

      if (!found) {
        oraInstance.fail(
          `Could not locate the repository for ${chalk.red(
            `"${remoteUrl}"`
          )}. Please check that the repository exists and try again.`
        );
        process.exit(1);
      }
    } else {
      // Support relative imports like EvanBacon/manticore
      return resolvePackageArgAsync(
        projectRoot,
        oraInstance,
        `https://github.com/${remoteUrl}`,
        remotePath
      );
    }
  }

  oraInstance.text = chalk.bold(
    `Downloading files from repo ${chalk.cyan(remoteUrl)}. This might take a moment.`
  );

  await downloadAndExtractRepoAsync(projectRoot, repoInfo!);

  return true;
}

function downloadAndExtractRepoAsync(
  root: string,
  { username, name, branch, filePath }: RepoInfo
): Promise<void> {
  const strip = filePath ? filePath.split('/').length + 1 : 1;
  return pipeline(
    got.stream(`https://codeload.github.com/${username}/${name}/tar.gz/${branch}`),
    tar.extract({ cwd: root, strip }, [`${name}-${branch}${filePath ? `/${filePath}` : ''}`])
  );
}
