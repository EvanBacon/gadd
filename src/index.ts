#!/usr/bin/env node
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import { Command } from 'commander';
import { copy, ensureDir, readFileSync, remove } from 'fs-extra';
import ora from 'ora';
import * as path from 'path';
import tempy from 'tempy';

import * as Remote from './Remote';
import shouldUpdate, { shouldUseYarn } from './Update';

type PackageManagerName = 'yarn' | 'npm';

const folderName = 'gadd';
const packageJSON = require('../package.json');

let inputPath: string;

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('<github-url>')
  .usage(`${chalk.magenta('<project-root>')} [options]`)
  .description('Downloads and installs NPM packages from GitHub monorepos')
  .option('-p, --path [name]', 'The path inside of a GitHub repo where the package lives.')
  .option('-d, --dev', 'Install as a dev dependency')
  .option('--use-npm', 'Use npm to install dependencies. (default when Yarn is not installed)')
  .option('--no-install', 'Skip installing npm packages after extracting.')
  .allowUnknownOption()
  .action(projectRoot => (inputPath = projectRoot))
  .parse(process.argv);

async function runAsync(): Promise<void> {
  const projectRoot = path.resolve(process.cwd());
  try {
    const tempRoot = tempy.directory();
    const extractPackageStep = ora(chalk.bold(`Locating package repo.`));
    extractPackageStep.start();
    let packageToInstall: string;
    try {
      await Remote.resolvePackageArgAsync(tempRoot, extractPackageStep, inputPath, program.path);

      const pkgPath = path.resolve(tempRoot, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const name = pkg.name;
      const dir = await ensurePackageDirAsync(projectRoot, name);
      await copy(tempRoot, dir, { recursive: true, overwrite: true });
      await remove(tempRoot);
      packageToInstall = `${name}@file:.${folderName}/${name}`;
      extractPackageStep.succeed('Downloaded and extracted package files.');
    } catch (e) {
      extractPackageStep.fail(
        'Something went wrong in downloading and extracting the package files.'
      );

      process.exit(1);
    }

    const shouldInstall = program.install;
    const packageManager = resolvePackageManager();

    await installNodeDependenciesAsync(projectRoot, packageManager, {
      name: packageToInstall,
      isDev: !!program.dev,
      silent: false,
      shouldInstall,
    });
  } catch (error) {
    await commandDidThrowAsync(error);
  }
  await shouldUpdate();
  process.exit(0);
}

async function installNodeDependenciesAsync(
  projectRoot: string,
  packageManager: PackageManagerName,
  flags: { name: string; isDev: boolean; silent: boolean; shouldInstall: boolean }
): Promise<void> {
  const options = { cwd: projectRoot, silent: flags.silent };

  if (!flags.shouldInstall) {
    console.log(`⚠️  Before running your app, make sure you have node modules installed:`);
    console.log(
      `  ${
        packageManager === 'yarn'
          ? `yarn add${flags.isDev ? ' -D' : ''} ${flags.name}`
          : `npm install${flags.isDev ? ' --dev' : ''} ${flags.name}`
      }`
    );
    return;
  }
  const manager =
    packageManager === 'yarn'
      ? new PackageManager.YarnPackageManager(options)
      : new PackageManager.NpmPackageManager(options);

  if (flags.isDev) {
    await manager.addDevAsync(flags.name);
  } else {
    await manager.addAsync(flags.name);
  }
}

runAsync();

function resolvePackageManager(): PackageManagerName {
  let packageManager: PackageManagerName = 'npm';

  if (!program.useNpm && shouldUseYarn()) {
    packageManager = 'yarn';
    console.log();
    console.log('🧶 Using Yarn to install packages. You can pass --use-npm to use npm instead.');
    console.log();
  } else {
    console.log();
    console.log('📦 Using npm to install packages.');
    console.log();
  }
  return packageManager;
}

async function commandDidThrowAsync(error: any) {
  console.log();
  console.log(chalk.red(`An unexpected error occurred:`));
  console.log(error);
  console.log();

  await shouldUpdate();

  process.exit(1);
}

async function ensurePackageDirAsync(projectRoot: string, packageName: string) {
  const dir = path.join(projectRoot, `.${folderName}`, packageName);
  await remove(dir);
  await ensureDir(dir);
  return dir;
}

export function logNewSection(title: string) {
  let spinner = ora(chalk.bold(title));
  spinner.start();
  return spinner;
}
