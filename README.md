# cpm plugin getting started
This is a template repository to start implement cpm plugin

## Setup repository
- Create a new repository with this template
- Clone created repository
- Open `./plugin/package.json`
- Replace `"name": "plugin-name",` with plugin name
- Replace `"description": "plugin-description",` with plugin description
- Replace `"author": "plugin-arthur",` with plugin arthur name
- Replace `"repository": "plugin-repo",` with created plugin repository url
- Replace `"homepage": "plugin-repo#readme",` with created plugin repository url
- Open `./cpm.yml`
- Replace `plugin-name` with plugin name

## Start development
- Open `./plugin/src/index.ts` with your favourite code editor
- Change `name: 'plugin-name',` with display name for plugin cpm cli use this name if you are exporting custom commands
- `actions: {}` object contains all the actions provided by plugin
- Key should mention the cpm command which this action handles (ex: `task ls`, `task get`, `repo clone`)
- You can view command syntax by running help command in cpm cli
- `ctx` will contain config (`./cpm.yml`) and secrets store (which you can use to get or store new secrets for plugin)
- `input` will contain all the arguments and options passed for command (according to the command syntax)

## Test locally
- Run `cpm` inside plugin repository (it should load plugin)
- Run any command provided by plugin and plugin should invoke the action

## Publish to npm
- Change README.md file content with actual content related to plugin (This will be used as the homepage for plugin)
- Login to npm with `npm login`
- Go to `./plugin` folder
- Publish plugin with `npm publish`

## Use plugin
- Go to repository where you need to install plugin
- Run `cpm install <plugin>` with plugin name
- Or if you want to install plugin globally run `cpm install <plugin> -g`

>Happy Coding ;)