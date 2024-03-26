import {Action, ActionInput, ActionOutput, CPMContext, CPMPluginCreator} from '@cloudimpl-inc/cpm';
import {authCodeLogin} from "./oauth";
import {ClickUpAPI} from "./api";
import inquirer from "inquirer";
import prompt = inquirer.prompt;
import Table from "cli-table";

const getSelection = async (message: string, list: { id: string, name: string }[]) => {
    const options: string[] = [];
    const idMapping: Record<string, string> = {};

    list.forEach(w => {
        options.push(w.name);
        idMapping[w.name] = w.id;
    })

    const answers: { selection: string } = await prompt([
        {
            type: 'list',
            name: 'selection',
            message: message,
            choices: options
        }
    ]);

    return idMapping[answers.selection];
}

const getClientCredential = async (): Promise<{
    clientId: string,
    clientSecret: string
}> => {
    return prompt([
        {
            type: 'input',
            name: 'clientId',
            message: 'Enter client id:'
        },
        {
            type: 'input',
            name: 'clientSecret',
            message: 'Enter client secret:'
        }
    ]);
}

const selectWorkspace = async (ctx: CPMContext) => {
    const api = new ClickUpAPI(ctx.secrets.token);
    const workspaces = await api.listWorkspaces();
    return await getSelection('Select team:', workspaces);
}

const selectSpace = async (ctx: CPMContext, teamId: string) => {
    const api = new ClickUpAPI(ctx.secrets.token);
    const spaces = await api.listSpacesInWorkspace(teamId);
    return await getSelection('Select space:', spaces);
}

const selectList = async (ctx: CPMContext, spaceId: string) => {
    const api = new ClickUpAPI(ctx.secrets.token);
    const lists = await api.getListsInSpace(spaceId);
    return await getSelection('Select list:', lists);
}

const loginIfNot = async (ctx: CPMContext) => {
    if (!ctx.secrets.token) {
        const clientId = ctx.variables.clientId;
        const clientSecret = ctx.variables.clientSecret;
        ctx.secrets.token = await authCodeLogin(clientId, clientSecret);
    }
}

const configure: Action = async (ctx, input) => {
    const readmeUrl = 'https://cloudimpl-inc.github.io/cpm-plugin-pack/clickup/#readme';
    console.log(`You can find plugin configure guide here: ${readmeUrl}`);

    const clientCred = await getClientCredential();
    ctx.variables.clientId = clientCred.clientId;
    ctx.variables.clientSecret = clientCred.clientSecret;

    await loginIfNot(ctx);

    ctx.variables.workspaceId = await selectWorkspace(ctx);
    ctx.variables.spaceId = await selectSpace(ctx, ctx.variables.workspaceId);
    ctx.variables.listId = await selectList(ctx, ctx.variables.spaceId);

    return {};
}

const getTasks = async (ctx: CPMContext, input: ActionInput) => {
    await loginIfNot(ctx);

    const api = new ClickUpAPI(ctx.secrets.token);
    let tasks;

    if (input.options.assigned) {
        const user = await api.getCurrentUser();
        tasks = await api.getTasksInList(ctx.variables.listId, user.id);
    } else {
        tasks = await api.getTasksInList(ctx.variables.listId);
    }

    return tasks;
}

const listTasks: Action = async (ctx, input) => {
    const tasks = await getTasks(ctx, input);

    const table = new Table({
        head: ['ID', 'Title', 'Status'],
        colWidths: [20, 40, 20]
    });

    tasks.forEach(task => {
        table.push([task.id, task.name, task.status.status]);
    });

    console.log(table.toString());

    return {};
};

const getTask: Action = async (ctx, input) => {
    await loginIfNot(ctx);

    const taskId = input.args.id;
    const api = new ClickUpAPI(ctx.secrets.token);
    const task = await api.getTask(taskId)

    console.log(`getting task for id = ${input.args.id}`);
    const table = new Table({
        head: ['ID', 'Title', 'Status'],
        colWidths: [20, 40, 20]
    });
    table.push([task.id, task.name, task.status.status]);
    console.log(table.toString());

    return {id: task.id, title: task.name, status: task.status.status};
};

const selectTask: Action = async (ctx, input): Promise<ActionOutput> => {
    const tasks = await getTasks(ctx, input);
    const taskId = await getSelection('Select task:', tasks);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return {};
    }

    const table = new Table({
        head: ['ID', 'Title', 'Status'],
        colWidths: [20, 40, 20]
    });
    table.push([task.id, task.name, task.status.status]);
    console.log(table.toString());
    return {id: task.id, title: task.name, status: task.status.status};
};

const updateTaskStatus: Action = async (ctx, input) => {
    await loginIfNot(ctx);

    const taskId = input.args.id;
    const newStatus = input.args.status;

    const api = new ClickUpAPI(ctx.secrets.token);
    await api.updateTask(taskId, {
        status: newStatus
    })

    console.log(`Task ${taskId} status updated to ${newStatus}`);
    return {};
};

const createTaskPlugin: CPMPluginCreator = async (ctx) => {
    return {
        name: 'clickup',
        configure: configure,
        actions: {
            'clickup configure': configure,
            'task list': listTasks,
            'task select': selectTask,
            'task get': getTask,
            'task status': updateTaskStatus
        }
    };
}

// Export the plugin creator function
export default createTaskPlugin;
