<!-- Header -->

![Gadd](/gadd.png)

<p align="center">
  <em><b>g</b>ithub <b>add</b></em>
  <br />
  <b>download and install packages from a github monorepo</b>
  <br />

  <p align="center">
    <a href="https://packagephobia.now.sh/result?p=gadd">
      <img alt="the best way to install a npm package from a monorepo" longdesc="the best way to install a npm package from a monorepo" src="https://flat.badgen.net/packagephobia/install/gadd" />
    </a>
  </p>
  
</p>

<!-- Body -->

```sh
npx gadd <username/repo> --path packages/library

# Example: install React from github.com/facebook/react

npx gadd facebook/react -p packages/react
```

## Why tho

Big epic projects like `react`, `jest`, `babel`, `expo`, etc. keep their packages in a monorepo under the `packages/` directory. These packages cannot be installed directly using NPM or Yarn which makes it awkward and hard to test them without being published. Both NPM and Yarn should probably add first-class support for this feature but they don't 😐 So for now you can use `gadd`.

## How

**gadd is** a super light-weight package that clones the GitHub tar to a temporary folder, then extracts the tar into a `.gadd` folder in your project. After that gadd installs the package using your package manager tool of choice!

- Modules are installed in your project's `.gadd/` folder.
- You can add `.gadd/` to your `.gitignore` to keep the dev modules out of your git history.
- Big repos can take a while to install, this is cuz GitHub doesn't support downloading individual folders.
- You can install any repo by ommitting the `--path` arg, but it might make more sense to just install the package directly with NPM.

## Flags

```sh
Usage: gadd <project-root> [options]

Downloads and installs NPM packages from GitHub monorepos

Options:
  -V, --version      output the version number
  -p, --path [name]  The path inside of a GitHub repo where the package lives.
  -d, --dev          Install as a dev dependency
  --use-npm          Use npm to install dependencies. (default when Yarn is not installed)
  --no-install       Skip installing npm packages after extracting.
  -h, --help         output usage information
```
