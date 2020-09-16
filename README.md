<!-- Header -->

<p align="center">
  <h1>gadd</h1>
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

# Example: install @react-navigation/core from github.com/react-navigation/react-navigation

npx gadd react-navigation/react-navigation -p packages/core
```

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
