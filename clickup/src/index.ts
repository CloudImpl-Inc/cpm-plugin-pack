import {Action, CPMContext, CPMPluginCreator} from '@cloudimpl-inc/cpm';
import {authCodeLogin} from "./oauth";
import {ClickUpAPI} from "./api";
import inquirer from "inquirer";
import prompt = inquirer.prompt;
import Table from "cli-table";

const clientId = '2E9QXSC2MT3MNRCKAJR9RLHSJJQXZ52Y';
const clientSecret = '9M9H9EUPR3IZW7YNSR6PV0FK7PYV67LG2W365Z9WAWISWXKIQFVOS7O7RIECOHV1';

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
        ctx.secrets.token = await authCodeLogin(clientId, clientSecret);
    }
}

const configure: Action = async (ctx, input) => {
    await loginIfNot(ctx);

    ctx.variables.workspaceId = await selectWorkspace(ctx);
    ctx.variables.spaceId = await selectSpace(ctx, ctx.variables.workspaceId);
    ctx.variables.listId = await selectList(ctx, ctx.variables.spaceId);

    return {};
}

const listTasks: Action = async (ctx, input) => {
    await loginIfNot(ctx);

    const api = new ClickUpAPI(ctx.secrets.token);
    let tasks;

    if (input.options.assigned) {
        const user = await api.getCurrentUser();
        tasks = await api.getTasksInList(ctx.variables.listId, user.id);
    } else {
        tasks = await api.getTasksInList(ctx.variables.listId);
    }

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
        commands: {
            'configure': {
                description: 'configure clickup plugin (only support interactive mode)'
            }
        },
        actions: {
            'clickup configure': configure,
            'task list': listTasks,
            'task get': getTask,
            'task status': updateTaskStatus
        }
    };
}

// Export the plugin creator function
export default createTaskPlugin;
