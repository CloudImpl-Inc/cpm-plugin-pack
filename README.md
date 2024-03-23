# cpm plugin pack
This repository contain plugins for cpm

## Plugins available
- Clickup
- Git
- Github

## Clickup plugin available commands
- cpm task list
- cpm task get
- cpm task status

## Git plugin available commands
- cpm 

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