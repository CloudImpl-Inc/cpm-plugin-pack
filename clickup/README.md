# CPM plugin for clickup

## Supported commands
- cpm task list
- cpm task select
- cpm task get
- cpm task status

## Add plugin
1. Go to repository where you need to install plugin
2. Run `cpm plugin add @cloudimpl-inc/cpm-clickup`

## Configure plugin

### Create clickup oauth app for workspace (If not created)
1. Go to [clickup](https://app.clickup.com/)
2. In the upper-left corner, click your Workspace avatar
3. Select **Settings**
4. In the sidebar, click **ClickUp API**
5. In the upper right, click **Create an App**
6. Name the app and add a redirect URL
7. Click **Create App**
8. Your Client ID and Client Secret are automatically generated

### Configure plugin
1. Run `cpm plugin configure @cloudimpl-inc/cpm-clickup`
2. Enter Client ID and Client Secret retrieved from clickup oauth app
3. Then it will ask you to login and authorize workspace
4. Select workspace you want to attach with the project
5. Select workspace, space and list accordingly to attach with the project

>Happy Coding ;)